import type { ITestCaseHookParameter } from '@cucumber/cucumber'
import { TestStepResultStatus } from '@cucumber/messages'
import { describe, expect, it } from '@jest/globals'
import minimist from 'minimist'
import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { argv, platform } from 'node:process'
import RerunService from '../src/index.js'
import { gherkinDocument, pickle } from './fixtures/cucumber.js'

describe('wdio-rerun-service', () => {
    const nonPassingItemsCucumber = [
        { location: 'feature/sample.feature:1', failure: 'some error' },
        { location: 'feature/sample.feature:4', failure: 'another error' },
    ]
    const nonPassingItemsMocha = [
        { location: 'tests/sample1.test.ts', failure: 'some error' },
        { location: 'tests/sample2.test.ts', failure: 'another error' },
    ]
    const capabilities = { browser: 'chrome' }
    const specFile = ['features/sample.feature']

    const world = {
        gherkinDocument: gherkinDocument,
        result: {
            status: TestStepResultStatus.PASSED,
            duration: {
                seconds: 4,
                nanos: 1000000,
            },
            message: 'some message',
        },
        pickle: pickle,
        testCaseStartedId: 'some-id',
    } satisfies ITestCaseHookParameter

    const cucumberBrowser: WebdriverIO.Browser = {
        config: { framework: 'cucumber' },
    } as WebdriverIO.Browser
    const mochaBrowser = {
        config: { framework: 'mocha' },
    } as WebdriverIO.Browser

    const rerunScriptFile = platform === 'win32' ? 'rerun.bat' : 'rerun.sh'

    describe('setup', () => {
        it('should not throw error when setup with no parameters', async () => {
            const service = new RerunService()
            await expect(
                service.before(capabilities, specFile),
            ).resolves.toBeUndefined()
            expect(service.ignoredTags).toEqual([])
            expect(service.rerunDataDir).toEqual('./results/rerun')
            expect(service.rerunScriptPath).toEqual(rerunScriptFile)
            expect(service.commandPrefix).toEqual('')
            expect(service.customParameters).toEqual('')
        })

        it('should throw error when setup bad rereunDataDir', async () => {
            const service = new RerunService({ rerunDataDir: '\0' })
            await expect(
                service.before(capabilities, specFile),
            ).rejects.toThrow()
        })

        it('can configure ignoredTags', async () => {
            const service = new RerunService({ ignoredTags: ['@ignored'] })
            await expect(
                service.before({}, ['features/sample.feature']),
            ).resolves.toBeUndefined()
            expect(service.ignoredTags).toEqual(['@ignored'])
            expect(service.rerunDataDir).toEqual('./results/rerun')
            expect(service.rerunScriptPath).toEqual(rerunScriptFile)
            expect(service.commandPrefix).toEqual('')
            expect(service.customParameters).toEqual('')
        })

        it('can configure rerunDataDir', async () => {
            const service = new RerunService({
                rerunDataDir: './results/custom_rerun_directory',
            })
            await expect(
                service.before({}, ['features/sample.feature']),
            ).resolves.toBeUndefined()
            expect(service.ignoredTags).toEqual([])
            expect(service.rerunDataDir).toEqual(
                './results/custom_rerun_directory',
            )
            expect(service.rerunScriptPath).toEqual(rerunScriptFile)
            expect(service.commandPrefix).toEqual('')
            expect(service.customParameters).toEqual('')
        })

        it('can configure rerunScriptPath', async () => {
            const service = new RerunService({
                rerunScriptPath: './custom_rerun_script.sh',
            })
            await expect(
                service.before({}, ['features/sample.feature']),
            ).resolves.toBeUndefined()
            expect(service.ignoredTags).toEqual([])
            expect(service.rerunDataDir).toEqual('./results/rerun')
            expect(service.rerunScriptPath).toEqual('./custom_rerun_script.sh')
            expect(service.commandPrefix).toEqual('')
            expect(service.customParameters).toEqual('')
        })

        it('can configure commandPrefix', async () => {
            const service = new RerunService({
                commandPrefix: 'CUSTOM_VAR=true',
            })
            await expect(
                service.before({}, ['features/sample.feature']),
            ).resolves.toBeUndefined()
            expect(service.ignoredTags).toEqual([])
            expect(service.rerunDataDir).toEqual('./results/rerun')
            expect(service.rerunScriptPath).toEqual(rerunScriptFile)
            expect(service.commandPrefix).toEqual('CUSTOM_VAR=true')
            expect(service.customParameters).toEqual('')
        })

        it('can configure customParameters', async () => {
            const service = new RerunService({ customParameters: '--foobar' })
            await expect(
                service.before({}, ['features/sample.feature']),
            ).resolves.toBeUndefined()
            expect(service.ignoredTags).toEqual([])
            expect(service.rerunDataDir).toEqual('./results/rerun')
            expect(service.rerunScriptPath).toEqual(rerunScriptFile)
            expect(service.commandPrefix).toEqual('')
            expect(service.customParameters).toEqual('--foobar')
        })
    })

    describe('before', () => {
        it('should throw an exception when no parameters are given', async () => {
            const service = new RerunService()
            // @ts-expect-error - test invalid input
            await expect(service.before()).rejects.toThrow()
        })

        it('should not throw an exception when empty specFile parameter', async () => {
            const service = new RerunService()
            await expect(service.before({}, [])).resolves.toBeUndefined()
        })
    })

    describe('afterScenario', () => {
        it('should throw an exception when no parameters are given', () => {
            const service = new RerunService()
            // @ts-expect-error - test invalid input
            expect(() => service.afterScenario()).toThrow()
        })

        it('should not throw an exception when parameters are given', () => {
            const service = new RerunService()
            global.browser = cucumberBrowser
            expect(() => service.afterScenario(world)).not.toThrow()
        })

        for (const status of [
            TestStepResultStatus.PENDING,
            TestStepResultStatus.UNDEFINED,
            TestStepResultStatus.AMBIGUOUS,
            TestStepResultStatus.FAILED,
        ]) {
            it('should add to nonPassingItems if status is ' + status, () => {
                const service = new RerunService()
                global.browser = cucumberBrowser
                const testWorld = {
                    ...world,
                    result: {
                        ...world.result,
                        status,
                    },
                }
                service.afterScenario(testWorld)
                expect(service.nonPassingItems.length).toBeGreaterThan(0)
            })
        }

        for (const status of [
            TestStepResultStatus.PASSED,
            TestStepResultStatus.SKIPPED,
        ]) {
            it(
                'should not add to nonPassingItems if status is ' + status,
                () => {
                    const service = new RerunService()
                    global.browser = cucumberBrowser
                    const testWorld = {
                        ...world,
                        result: {
                            ...world.result,
                            status,
                        },
                    }
                    service.afterScenario(testWorld)
                    expect(service.nonPassingItems).toEqual([])
                },
            )
        }

        it('should add to nonPassingItems if tag is not ignored', () => {
            const service = new RerunService({
                ignoredTags: ['@scenario-tag6'],
            })
            global.browser = cucumberBrowser
            const testWorld = {
                ...world,
                result: {
                    ...world.result,
                    status: TestStepResultStatus.FAILED,
                },
            }
            service.afterScenario(testWorld)
            expect(service.nonPassingItems.length).toBeGreaterThan(0)
        })

        it('should not add to nonPassingItems if tag is ignored', () => {
            const service = new RerunService({
                ignoredTags: ['@scenario-tag1'],
            })
            global.browser = cucumberBrowser
            const testWorld = {
                ...world,
                result: {
                    ...world.result,
                    status: TestStepResultStatus.FAILED,
                },
            }
            service.afterScenario(testWorld)
            expect(service.nonPassingItems).toEqual([])
        })
    })

    describe('afterTest', () => {
        it('should not throw an exception when parameters are given', () => {
            const service = new RerunService()
            global.browser = mochaBrowser
            expect(() =>
                service.afterTest({} as any, 'context', {
                    error: { message: 'This test has failed.' },
                    result: 'result',
                    duration: 24213,
                    passed: false,
                    retries: {
                        limit: 0,
                        attempts: 0,
                    },
                    exception: '',
                    status: 'status',
                }),
            ).not.toThrow()
        })

        it('should not throw an exception when parameters are given but no error.message', () => {
            const service = new RerunService()
            global.browser = mochaBrowser
            expect(() =>
                service.afterTest({} as any, 'context', {
                    error: {},
                    result: 'result',
                    duration: 24213,
                    passed: false,
                    retries: {
                        limit: 0,
                        attempts: 0,
                    },
                    exception: '',
                    status: 'status',
                }),
            ).not.toThrow()
        })

        it('should add to nonPassingItems if results.passed is false', () => {
            const service = new RerunService()
            global.browser = mochaBrowser
            service.afterTest({} as any, 'context', {
                error: { message: 'This test has failed.' },
                result: 'result',
                duration: 24213,
                passed: false,
                retries: {
                    limit: 0,
                    attempts: 0,
                },
                exception: '',
                status: 'status',
            })
            expect(service.nonPassingItems.length).toBeGreaterThan(0)
        })

        it('should not add to nonPassingItems if results.passed is true', () => {
            const service = new RerunService()
            global.browser = mochaBrowser
            service.afterTest({} as any, 'context', {
                error: { message: 'This test has failed.' },
                result: 'result',
                duration: 24213,
                passed: true,
                retries: {
                    limit: 0,
                    attempts: 0,
                },
                exception: '',
                status: 'status',
            })
            expect(service.nonPassingItems).toEqual([])
        })
    })

    describe('after', () => {
        it('should not throw an exception when no parameters are given', async () => {
            const service = new RerunService()
            service.nonPassingItems = nonPassingItemsCucumber
            service.serviceWorkerId = '123'
            await expect(
                service.before(capabilities, specFile),
            ).resolves.toBeUndefined()
            await expect(service.after()).resolves.toBeUndefined()
        })
    })

    describe('onComplete', () => {
        it('should not throw an exception when no parameters are given with prefix', async () => {
            const service = new RerunService({
                commandPrefix: 'CUSTOM_VAR=true',
            })
            service.nonPassingItems = nonPassingItemsCucumber
            await expect(service.onComplete()).resolves.toBeUndefined()
        })

        it('should not throw an exception when no parameters are given with additional params', async () => {
            const service = new RerunService({ customParameters: '--foobar' })
            service.nonPassingItems = nonPassingItemsMocha
            await expect(service.onComplete()).resolves.toBeUndefined()
        })

        it('should not throw an exception when no parameters are given and no nonPassingItems', async () => {
            const service = new RerunService()
            service.serviceWorkerId = '123'
            await expect(service.onComplete()).resolves.toBeUndefined()
        })
    })

    describe('integration tests', () => {
        it('should add failed specs to rerun script', async () => {
            const rerunDataDir = join(tmpdir(), 'rerun-data')
            const rerunScriptPath = join(rerunDataDir, rerunScriptFile)
            const service = new RerunService({ rerunDataDir, rerunScriptPath })
            await service.before({}, [])
            service.nonPassingItems = nonPassingItemsMocha
            await service.after()
            await service.onComplete()
            const disableRerun =
                platform === 'win32'
                    ? 'set DISABLE_RERUN=true &&'
                    : 'DISABLE_RERUN=true'
            const rerunScript = await readFile(rerunScriptPath, 'utf8')
            const parsedArgs = minimist(argv.slice(2))
            const args = parsedArgs._[0] ?? ''
            expect(rerunScript).toBe(
                `${disableRerun} npx wdio ${args} --spec=tests/sample1.test.ts --spec=tests/sample2.test.ts`,
            )
            await rm(rerunDataDir, { recursive: true, force: true })
        })

        it('should not add failed specs to rerun script if DISABLE_RERUN is set', async () => {
            process.env['DISABLE_RERUN'] = 'true'
            const rerunDataDir = join(tmpdir(), 'rerun-data')
            const rerunScriptPath = join(rerunDataDir, rerunScriptFile)
            const service = new RerunService({ rerunDataDir, rerunScriptPath })
            await service.before({}, [])
            service.nonPassingItems = nonPassingItemsMocha
            await service.after()
            await service.onComplete()
            let rerunScript: string | undefined = undefined
            let err: NodeJS.ErrnoException | undefined = undefined
            try {
                rerunScript = await readFile(rerunScriptPath, 'utf8')
                await rm(rerunDataDir, { recursive: true, force: true })
            } catch (e) {
                err = e as NodeJS.ErrnoException
            }
            expect(err).toBeDefined()
            expect(err?.code).toBe('ENOENT')
            expect(rerunScript).toBeUndefined()
        })
    })
})
