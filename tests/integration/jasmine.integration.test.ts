import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { readFile, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const INTEGRATION_DIR = join(import.meta.dirname, '.')
const JASMINE_DIR = join(INTEGRATION_DIR, 'jasmine')
const RERUN_SCRIPT = join(JASMINE_DIR, 'rerun.sh')
const RERUN_BAT = join(JASMINE_DIR, 'rerun.bat')
const RESULTS_DIR = join(JASMINE_DIR, 'results')
const RERUN_DATA_DIR = join(RESULTS_DIR, 'rerun')

async function cleanRerunArtifacts() {
    await rm(RERUN_SCRIPT, { force: true })
    await rm(RERUN_BAT, { force: true })
    await rm(RESULTS_DIR, { recursive: true, force: true })
}

function runWdioJasmine(specs: string[]): {
    exitCode: number
    output: string
    stderr: string
} {
    const specsArg = specs.map((s) => `--spec=${s}`).join(' ')
    const cmd = `pnpm wdio:jasmine ${specsArg}`

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
 * Integration tests for wdio-rerun-service with Jasmine
 *
 * Like Mocha, Jasmine tests don't have line numbers in rerun.sh.
 * The rerun service captures the spec file path only.
 */
describe('RerunService Jasmine Integration Tests', () => {
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
    // PASSING SPECS - Should NOT generate rerun.sh
    // =========================================================================
    describe('Passing Specs', () => {
        it('should NOT generate rerun.sh when all tests pass', () => {
            const { exitCode } = runWdioJasmine(['./jasmine/passing.spec.ts'])

            expect(exitCode).toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(false)
        })

        it('should NOT create rerun JSON files when all tests pass', async () => {
            runWdioJasmine(['./jasmine/passing.spec.ts'])

            if (existsSync(RERUN_DATA_DIR)) {
                const files = await readdir(RERUN_DATA_DIR)
                const jsonFiles = files.filter((f) => f.endsWith('.json'))
                expect(jsonFiles.length).toBe(0)
            }
        })
    })

    // =========================================================================
    // FAILING SPECS - Should generate rerun.sh with spec file path
    // =========================================================================
    describe('Failing Specs', () => {
        it('should generate rerun.sh when test fails', () => {
            const { exitCode } = runWdioJasmine(['./jasmine/failing.spec.ts'])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)
        })

        it('should include failing.spec.ts in rerun.sh', async () => {
            runWdioJasmine(['./jasmine/failing.spec.ts'])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('failing.spec.ts')
        })

        it('should write failure data to JSON file', async () => {
            runWdioJasmine(['./jasmine/failing.spec.ts'])

            const files = await readdir(RERUN_DATA_DIR)
            const jsonFile = files.find((f) => f.endsWith('.json'))
            expect(jsonFile).toBeDefined()

            const content = JSON.parse(
                await readFile(join(RERUN_DATA_DIR, jsonFile!), 'utf8'),
            )
            expect(content[0].location).toContain('failing.spec.ts')
        })
    })

    // =========================================================================
    // MIXED PASSING AND FAILING
    // =========================================================================
    describe('Mixed Passing and Failing Specs', () => {
        it('should only include failing spec in rerun.sh', async () => {
            const { exitCode } = runWdioJasmine([
                './jasmine/passing.spec.ts',
                './jasmine/failing.spec.ts',
            ])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('failing.spec.ts')
            expect(rerunContent).not.toContain('passing.spec.ts')
        })
    })

    // =========================================================================
    // MULTIPLE FAILURES IN SAME FILE
    // =========================================================================
    describe('Multiple Failures in Same File', () => {
        it('should include spec file only once in rerun.sh', async () => {
            const { exitCode } = runWdioJasmine([
                './jasmine/multiple-failures.spec.ts',
            ])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            const matches =
                rerunContent.match(/multiple-failures\.spec\.ts/g) || []
            expect(matches.length).toBe(1)
        })
    })

    // =========================================================================
    // RERUN SCRIPT FORMAT VALIDATION
    // =========================================================================
    describe('Rerun Script Format', () => {
        it('should include DISABLE_RERUN=true to prevent infinite loops', async () => {
            runWdioJasmine(['./jasmine/failing.spec.ts'])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('DISABLE_RERUN=true')
        })

        it('should include npx wdio command', async () => {
            runWdioJasmine(['./jasmine/failing.spec.ts'])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('npx wdio')
        })

        it('should be executable (chmod +x)', async () => {
            runWdioJasmine(['./jasmine/failing.spec.ts'])

            const { statSync } = await import('node:fs')
            const stats = statSync(RERUN_SCRIPT)
            const isExecutable = (stats.mode & 0o111) !== 0
            expect(isExecutable).toBe(true)
        })
    })
})
