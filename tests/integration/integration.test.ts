import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { readFile, rm, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const INTEGRATION_DIR = join(import.meta.dirname, '.')
const RERUN_SCRIPT = join(INTEGRATION_DIR, 'rerun.sh')
const RERUN_BAT = join(INTEGRATION_DIR, 'rerun.bat')
const RESULTS_DIR = join(INTEGRATION_DIR, 'results')
const RERUN_DATA_DIR = join(RESULTS_DIR, 'rerun')

async function cleanRerunArtifacts() {
    await rm(RERUN_SCRIPT, { force: true })
    await rm(RERUN_BAT, { force: true })
    await rm(RESULTS_DIR, { recursive: true, force: true })
}

function runWdio(specs: string[]): {
    exitCode: number
    output: string
    stderr: string
} {
    const specsArg = specs.map((s) => `--spec=${s}`).join(' ')
    const cmd = `pnpm wdio:cucumber ${specsArg}`

    try {
        const output = execSync(cmd, {
            cwd: INTEGRATION_DIR,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        })
        return { exitCode: 0, output, stderr: '' }
    } catch (error: any) {
        return {
            exitCode: error.status ?? 1,
            output: error.stdout ?? '',
            stderr: error.stderr ?? '',
        }
    }
}

/**
 * Integration tests for wdio-rerun-service with Cucumber
 *
 * These tests verify that rerun.sh contains the correct spec file name
 * and LINE NUMBER of each failing scenario. Line numbers are critical
 * because they allow re-running specific scenarios/examples.
 *
 * Each test documents the expected line number in both the test name
 * and assertions.
 */
describe('RerunService Cucumber Integration Tests', () => {
    beforeEach(async () => {
        await cleanRerunArtifacts()
    })

    afterEach(async () => {
        await cleanRerunArtifacts()
    })

    afterAll(async () => {
        await cleanRerunArtifacts()
    })

    // =========================================================================
    // PASSING SCENARIOS - Should NOT generate rerun.sh
    // =========================================================================
    describe('Passing Scenarios', () => {
        it('should NOT generate rerun.sh when all scenarios pass', () => {
            const { exitCode } = runWdio([
                './cucumber/features/passing.feature',
            ])

            expect(exitCode).toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(false)
        })

        it('should NOT create rerun JSON files when all scenarios pass', async () => {
            runWdio(['./cucumber/features/passing.feature'])

            if (existsSync(RERUN_DATA_DIR)) {
                const files = await readdir(RERUN_DATA_DIR)
                const jsonFiles = files.filter((f) => f.endsWith('.json'))
                expect(jsonFiles.length).toBe(0)
            }
        })
    })

    // =========================================================================
    // BASIC SCENARIO - Scenario starts on line 3
    //
    // basic-failing.feature:
    //   1: Feature: Basic Failing Scenario
    //   2:
    //   3:   Scenario: Intentional failure    <-- THIS LINE
    //   4:     Given I am on Google
    //   5:     Then the page title should be "This will never match"
    // =========================================================================
    describe('Basic Failing Scenario (line 3)', () => {
        const FEATURE = './cucumber/features/basic-failing.feature'
        const EXPECTED_LINE = 3

        it('should generate rerun.sh when scenario fails', () => {
            const { exitCode } = runWdio([FEATURE])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)
        })

        it(`should include basic-failing.feature:${EXPECTED_LINE} in rerun.sh`, async () => {
            runWdio([FEATURE])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `basic-failing.feature:${EXPECTED_LINE}`,
            )
        })

        it('should write failure data to JSON with correct line number', async () => {
            runWdio([FEATURE])

            const files = await readdir(RERUN_DATA_DIR)
            const jsonFile = files.find((f) => f.endsWith('.json'))
            const content = JSON.parse(
                await readFile(join(RERUN_DATA_DIR, jsonFile!), 'utf8'),
            )

            expect(content[0].location).toContain(
                `basic-failing.feature:${EXPECTED_LINE}`,
            )
        })
    })

    // =========================================================================
    // SCENARIO OUTLINE - Example row starts on line 9
    //
    // scenario-outline.feature:
    //   1: Feature: Scenario Outline Failure
    //   2:
    //   3:   Scenario Outline: Intentional outline failure
    //   4:     Given I am on Google
    //   5:     Then the page title should be "<expected>"
    //   6:
    //   7:     Examples:
    //   8:       | expected            |
    //   9:       | This will not match |    <-- THIS LINE (example data row)
    // =========================================================================
    describe('Scenario Outline (example row on line 9)', () => {
        const FEATURE = './cucumber/features/scenario-outline.feature'
        const EXPECTED_LINE = 9 // Points to example data row, NOT Scenario Outline line

        it(`should include scenario-outline.feature:${EXPECTED_LINE} in rerun.sh`, async () => {
            const { exitCode } = runWdio([FEATURE])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `scenario-outline.feature:${EXPECTED_LINE}`,
            )
        })

        it('should NOT point to Scenario Outline line (line 3)', async () => {
            runWdio([FEATURE])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).not.toContain('scenario-outline.feature:3')
        })
    })

    // =========================================================================
    // SCENARIO OUTLINE WITH MULTIPLE EXAMPLES - Lines 9 and 13
    //
    // scenario-outline-multiple-examples.feature:
    //   1: Feature: Scenario Outline with Multiple Examples
    //   2:
    //   3:   Scenario Outline: Multiple example tables
    //   4:     Given I am on Google
    //   5:     Then the page title should be "<expected>"
    //   6:
    //   7:     Examples: First set
    //   8:       | expected      |
    //   9:       | First failure |    <-- THIS LINE
    //  10:
    //  11:     Examples: Second set
    //  12:       | expected       |
    //  13:       | Second failure |   <-- AND THIS LINE
    // =========================================================================
    describe('Scenario Outline with Multiple Examples (lines 9 and 13)', () => {
        const FEATURE =
            './cucumber/features/scenario-outline-multiple-examples.feature'
        const FIRST_EXAMPLE_LINE = 9
        const SECOND_EXAMPLE_LINE = 13

        it(`should include both example rows: lines ${FIRST_EXAMPLE_LINE} and ${SECOND_EXAMPLE_LINE}`, async () => {
            const { exitCode } = runWdio([FEATURE])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `scenario-outline-multiple-examples.feature:${FIRST_EXAMPLE_LINE}`,
            )
            expect(rerunContent).toContain(
                `scenario-outline-multiple-examples.feature:${SECOND_EXAMPLE_LINE}`,
            )
        })
    })

    // =========================================================================
    // SCENARIO UNDER RULE - Scenario starts on line 5
    //
    // scenario-under-rule.feature:
    //   1: Feature: Scenario Under Rule
    //   2:
    //   3:   Rule: Business rule that groups scenarios
    //   4:
    //   5:     Scenario: Failing scenario under rule    <-- THIS LINE
    //   6:       Given I am on Google
    //   7:       Then the page title should be "This will not match"
    // =========================================================================
    describe('Scenario Under Rule (line 5)', () => {
        const FEATURE = './cucumber/features/scenario-under-rule.feature'
        const EXPECTED_LINE = 5

        it(`should include scenario-under-rule.feature:${EXPECTED_LINE} in rerun.sh`, async () => {
            const { exitCode } = runWdio([FEATURE])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `scenario-under-rule.feature:${EXPECTED_LINE}`,
            )
        })
    })

    // =========================================================================
    // SCENARIO OUTLINE UNDER RULE - Example row starts on line 11
    //
    // scenario-outline-under-rule.feature:
    //   1: Feature: Scenario Outline Under Rule
    //   2:
    //   3:   Rule: Data validation rule
    //   4:
    //   5:     Scenario Outline: Outline inside a Rule
    //   6:       Given I am on Google
    //   7:       Then the page title should be "<expected>"
    //   8:
    //   9:     Examples:
    //  10:       | expected            |
    //  11:       | This will not match |    <-- THIS LINE
    // =========================================================================
    describe('Scenario Outline Under Rule (example row on line 11)', () => {
        const FEATURE =
            './cucumber/features/scenario-outline-under-rule.feature'
        const EXPECTED_LINE = 11

        it(`should include scenario-outline-under-rule.feature:${EXPECTED_LINE} in rerun.sh`, async () => {
            const { exitCode } = runWdio([FEATURE])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `scenario-outline-under-rule.feature:${EXPECTED_LINE}`,
            )
        })

        it('should NOT point to Scenario Outline line (line 5)', async () => {
            runWdio([FEATURE])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).not.toContain(
                'scenario-outline-under-rule.feature:5',
            )
        })
    })

    // =========================================================================
    // MULTIPLE RULES - Scenarios on lines 5 and 11
    //
    // multiple-rules.feature:
    //   1: Feature: Multiple Rules
    //   2:
    //   3:   Rule: First Rule
    //   4:
    //   5:     Scenario: Scenario in first rule    <-- THIS LINE
    //   6:       Given I am on Google
    //   7:       Then the page title should be "First rule failure"
    //   8:
    //   9:   Rule: Second Rule
    //  10:
    //  11:     Scenario: Scenario in second rule   <-- AND THIS LINE
    //  12:       Given I am on Google
    //  13:       Then the page title should be "Second rule failure"
    // =========================================================================
    describe('Multiple Rules (lines 5 and 11)', () => {
        const FEATURE = './cucumber/features/multiple-rules.feature'
        const FIRST_RULE_SCENARIO_LINE = 5
        const SECOND_RULE_SCENARIO_LINE = 11

        it(`should include both scenarios: lines ${FIRST_RULE_SCENARIO_LINE} and ${SECOND_RULE_SCENARIO_LINE}`, async () => {
            const { exitCode } = runWdio([FEATURE])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `multiple-rules.feature:${FIRST_RULE_SCENARIO_LINE}`,
            )
            expect(rerunContent).toContain(
                `multiple-rules.feature:${SECOND_RULE_SCENARIO_LINE}`,
            )
        })
    })

    // =========================================================================
    // BACKGROUND UNDER RULE - Scenario starts on line 8
    //
    // background-under-rule.feature:
    //   1: Feature: Background Under Rule
    //   2:
    //   3:   Rule: Rule with background
    //   4:
    //   5:     Background:
    //   6:       Given I am on Google
    //   7:
    //   8:     Scenario: Failing scenario after background    <-- THIS LINE
    //   9:       Then the page title should be "This will not match"
    // =========================================================================
    describe('Background Under Rule (scenario on line 8, NOT background line 5)', () => {
        const FEATURE = './cucumber/features/background-under-rule.feature'
        const SCENARIO_LINE = 8
        const BACKGROUND_LINE = 5

        it(`should include background-under-rule.feature:${SCENARIO_LINE} in rerun.sh`, async () => {
            const { exitCode } = runWdio([FEATURE])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `background-under-rule.feature:${SCENARIO_LINE}`,
            )
        })

        it(`should NOT point to Background line (line ${BACKGROUND_LINE})`, async () => {
            runWdio([FEATURE])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).not.toContain(
                `background-under-rule.feature:${BACKGROUND_LINE}`,
            )
        })
    })

    // =========================================================================
    // FEATURE + RULE BACKGROUNDS - Scenario starts on line 11
    //
    // background-with-feature-background.feature:
    //   1: Feature: Background at Feature and Rule Level
    //   2:
    //   3:   Background:
    //   4:     Given I am on Google
    //   5:
    //   6:   Rule: Rule with its own background
    //   7:
    //   8:     Background:
    //   9:       Given I am on Google
    //  10:
    //  11:     Scenario: Scenario with two backgrounds    <-- THIS LINE
    //  12:       Then the page title should be "This will not match"
    // =========================================================================
    describe('Feature Background + Rule Background (scenario on line 11)', () => {
        const FEATURE =
            './cucumber/features/background-with-feature-background.feature'
        const SCENARIO_LINE = 11
        const FEATURE_BACKGROUND_LINE = 3
        const RULE_BACKGROUND_LINE = 8

        it(`should include background-with-feature-background.feature:${SCENARIO_LINE} in rerun.sh`, async () => {
            const { exitCode } = runWdio([FEATURE])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `background-with-feature-background.feature:${SCENARIO_LINE}`,
            )
        })

        it('should NOT point to either Background line', async () => {
            runWdio([FEATURE])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).not.toContain(
                `background-with-feature-background.feature:${FEATURE_BACKGROUND_LINE}`,
            )
            expect(rerunContent).not.toContain(
                `background-with-feature-background.feature:${RULE_BACKGROUND_LINE}`,
            )
        })
    })

    // =========================================================================
    // IGNORED TAGS - Untagged scenario on line 3, @skip-rerun on line 8
    //
    // ignored-tag.feature:
    //   1: Feature: Ignored Tag Scenarios
    //   2:
    //   3:   Scenario: Untagged failing scenario    <-- SHOULD BE INCLUDED
    //   4:     Given I am on Google
    //   5:     Then the page title should be "This will not match"
    //   6:
    //   7:   @skip-rerun
    //   8:   Scenario: Tagged failing scenario      <-- SHOULD BE IGNORED
    //   9:     Given I am on Google
    //  10:     Then the page title should be "Also will not match"
    // =========================================================================
    describe('Ignored Tags (@skip-rerun)', () => {
        const FEATURE = './cucumber/features/ignored-tag.feature'
        const UNTAGGED_SCENARIO_LINE = 3
        const TAGGED_SCENARIO_LINE = 8

        it(`should include untagged scenario (line ${UNTAGGED_SCENARIO_LINE}) in rerun.sh`, async () => {
            runWdio([FEATURE])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `ignored-tag.feature:${UNTAGGED_SCENARIO_LINE}`,
            )
        })

        it(`should NOT include @skip-rerun tagged scenario (line ${TAGGED_SCENARIO_LINE}) in rerun.sh`, async () => {
            runWdio([FEATURE])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).not.toContain(
                `ignored-tag.feature:${TAGGED_SCENARIO_LINE}`,
            )
        })

        it('should NOT generate rerun.sh when only @skip-rerun scenarios fail', () => {
            const { exitCode } = runWdio([
                './cucumber/features/only-ignored-tag.feature',
            ])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(false)
        })
    })

    // =========================================================================
    // MULTIPLE FAILURES - Scenarios on lines 3 and 7
    //
    // multiple-failures.feature:
    //   1: Feature: Multiple Failures
    //   2:
    //   3:   Scenario: First failing scenario    <-- THIS LINE
    //   4:     Given I am on Google
    //   5:     Then the page title should be "First failure"
    //   6:
    //   7:   Scenario: Second failing scenario   <-- AND THIS LINE
    //   8:     Given I am on Google
    //   9:     Then the page title should be "Second failure"
    // =========================================================================
    describe('Multiple Failures in Same Feature (lines 3 and 7)', () => {
        const FEATURE = './cucumber/features/multiple-failures.feature'
        const FIRST_SCENARIO_LINE = 3
        const SECOND_SCENARIO_LINE = 7

        it(`should include both scenarios: lines ${FIRST_SCENARIO_LINE} and ${SECOND_SCENARIO_LINE}`, async () => {
            runWdio([FEATURE])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain(
                `multiple-failures.feature:${FIRST_SCENARIO_LINE}`,
            )
            expect(rerunContent).toContain(
                `multiple-failures.feature:${SECOND_SCENARIO_LINE}`,
            )
        })

        it('should have exactly 2 --spec= entries for 2 failures', async () => {
            runWdio([FEATURE])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            const matches = rerunContent.match(/--spec=/g)
            expect(matches?.length).toBe(2)
        })
    })

    // =========================================================================
    // MIXED PASSING AND FAILING
    // =========================================================================
    describe('Mixed Passing and Failing Features', () => {
        it('should only include failing feature in rerun.sh', async () => {
            const { exitCode } = runWdio([
                './cucumber/features/passing.feature',
                './cucumber/features/basic-failing.feature',
            ])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('basic-failing.feature:3')
            expect(rerunContent).not.toContain('passing.feature')
        })
    })

    // =========================================================================
    // RERUN SCRIPT FORMAT VALIDATION
    // =========================================================================
    describe('Rerun Script Format', () => {
        it('should include DISABLE_RERUN=true to prevent infinite loops', async () => {
            runWdio(['./cucumber/features/basic-failing.feature'])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('DISABLE_RERUN=true')
        })

        it('should include npx wdio command', async () => {
            runWdio(['./cucumber/features/basic-failing.feature'])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('npx wdio')
        })

        it('should use forward slashes in file paths (cross-platform)', async () => {
            runWdio(['./cucumber/features/basic-failing.feature'])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).not.toMatch(/--spec=.*\\/)
        })

        it('should be executable (chmod +x)', async () => {
            runWdio(['./cucumber/features/basic-failing.feature'])

            const { mode } = await stat(RERUN_SCRIPT)
            expect(mode & 0o111).not.toBe(0)
        })
    })
})
