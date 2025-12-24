import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
    cleanRerunArtifacts,
    getFrameworkPaths,
    runWdio,
} from './test-utils.js'

const { rerunScript: RERUN_SCRIPT, rerunDataDir: RERUN_DATA_DIR } =
    getFrameworkPaths('jasmine')

/**
 * Integration tests for wdio-rerun-service with Jasmine
 *
 * Like Mocha, Jasmine tests don't have line numbers in rerun.sh.
 * The rerun service captures the spec file path only.
 */
describe('RerunService Jasmine Integration Tests', () => {
    beforeEach(async () => {
        await cleanRerunArtifacts('jasmine')
    })

    afterEach(async () => {
        await cleanRerunArtifacts('jasmine')
    })

    afterAll(async () => {
        await cleanRerunArtifacts('jasmine')
    })

    // =========================================================================
    // PASSING SPECS - Should NOT generate rerun.sh
    // =========================================================================
    describe('Passing Specs', () => {
        it('should NOT generate rerun.sh when all tests pass', () => {
            const { exitCode } = runWdio('jasmine', [
                './jasmine/passing.spec.ts',
            ])

            expect(exitCode).toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(false)
        })

        it('should NOT create rerun JSON files when all tests pass', async () => {
            runWdio('jasmine', ['./jasmine/passing.spec.ts'])

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
            const { exitCode } = runWdio('jasmine', [
                './jasmine/failing.spec.ts',
            ])

            expect(exitCode).not.toBe(0)
            expect(existsSync(RERUN_SCRIPT)).toBe(true)
        })

        it('should include failing.spec.ts in rerun.sh', async () => {
            runWdio('jasmine', ['./jasmine/failing.spec.ts'])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('failing.spec.ts')
        })

        it('should write failure data to JSON file', async () => {
            runWdio('jasmine', ['./jasmine/failing.spec.ts'])

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
            const { exitCode } = runWdio('jasmine', [
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
            const { exitCode } = runWdio('jasmine', [
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
            runWdio('jasmine', ['./jasmine/failing.spec.ts'])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('DISABLE_RERUN=true')
        })

        it('should include npx wdio command', async () => {
            runWdio('jasmine', ['./jasmine/failing.spec.ts'])

            const rerunContent = await readFile(RERUN_SCRIPT, 'utf8')
            expect(rerunContent).toContain('npx wdio')
        })

        // Skip on Windows - Unix file permissions don't apply
        it.skipIf(process.platform === 'win32')(
            'should be executable (chmod +x)',
            () => {
                runWdio('jasmine', ['./jasmine/failing.spec.ts'])

                const stats = statSync(RERUN_SCRIPT)
                const isExecutable = (stats.mode & 0o111) !== 0
                expect(isExecutable).toBe(true)
            },
        )
    })
})
