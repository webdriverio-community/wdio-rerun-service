import { describe, expect, it } from '@jest/globals'
import RerunService from '../src'

describe('wdio-rerurn-service', () => {
    const nonPassingItems = [
        { name: '1', location: 'feature/sample.feature:1' },
        { name: '2', location: 'feature/sample.feature:4' },
    ]
    const capabilities = { browser: 'chrome' }
    const specFile = ['featurs/sample.feature']

    const world = {
        gherkinDocument: {
            feature: {
                children: [
                    {
                        background: {
                            id: 0,
                            location: { line: 1 },
                        },
                    },
                    {
                        scenario: {
                            id: 1,
                            location: { line: 3 },
                        },
                    },
                ],
            },
        },
        result: {
            status: 0,
        },
        pickle: {
            astNodeIds: ['1'],
            tags: ['@sample'],
        },
    }

    const cucumberBrowser = { config: { framework: 'cucumber' } }
    const mochaBrowser = { config: { framework: 'mocha' } }

    it('should not throw error when setup with no parameters', async () => {
        const service = new RerunService()
        await expect(service.before(capabilities, specFile)).resolves.toBe(
            undefined,
        )
        expect(service.ignoredTags).toEqual([])
        expect(service.rerunDataDir).toEqual('./results/rerun')
        expect(service.rerunScriptPath).toEqual('./rerun.sh')
        expect(service.commandPrefix).toEqual('')
        expect(service.customParameters).toEqual('')
    })

    it('should throw error when setup bad rereunDataDir', async () => {
        const service = new RerunService({ rerunDataDir: '\0' })
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await expect(service.before(capabilities, specFile)).rejects.toThrow()
    })

    it('can configure ignoredTags', async () => {
        const service = new RerunService({ ignoredTags: ['@ignored'] })
        await expect(
            service.before({}, ['features/sample.feature']),
        ).resolves.toBeUndefined()
        expect(service.ignoredTags).toEqual(['@ignored'])
        expect(service.rerunDataDir).toEqual('./results/rerun')
        expect(service.rerunScriptPath).toEqual('./rerun.sh')
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
        expect(service.rerunDataDir).toEqual('./results/custom_rerun_directory')
        expect(service.rerunScriptPath).toEqual('./rerun.sh')
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
        const service = new RerunService({ commandPrefix: 'CUSTOM_VAR=true' })
        await expect(
            service.before({}, ['features/sample.feature']),
        ).resolves.toBeUndefined()
        expect(service.ignoredTags).toEqual([])
        expect(service.rerunDataDir).toEqual('./results/rerun')
        expect(service.rerunScriptPath).toEqual('./rerun.sh')
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
        expect(service.rerunScriptPath).toEqual('./rerun.sh')
        expect(service.commandPrefix).toEqual('')
        expect(service.customParameters).toEqual('--foobar')
    })

    it('before should throw an exception when no parameters are given', async () => {
        const service = new RerunService()
        // @ts-expect-error - test invalid input
        await expect(service.before()).rejects.toThrow()
    })

    it('afterTest should not throw an exception when parameters are given', () => {
        const service = new RerunService()
        // @ts-expect-error - mock browser object
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

    it('afterTest should not throw an exception when parameters are given but no error.message', () => {
        const service = new RerunService()
        // @ts-expect-error - mock browser object
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

    it('afterScenario should throw an exception when no parameters are given', () => {
        const service = new RerunService()
        // @ts-expect-error - test invalid input
        expect(() => service.afterScenario()).toThrow()
    })

    it('afterScenario should not throw an exception when parameters are given', () => {
        const service = new RerunService()
        // @ts-expect-error - mock browser object
        global.browser = cucumberBrowser
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expect(() => service.afterScenario(world as any)).not.toThrow()
    })

    it('after should not throw an exception when no parameters are given', async () => {
        const service = new RerunService()
        service.nonPassingItems = nonPassingItems
        service.serviceWorkerId = '123'
        await expect(service.before(capabilities, specFile)).resolves.toBe(
            undefined,
        )
        await expect(service.after()).resolves.toBeUndefined()
    })

    it('onComplete should throw an exception when no parameters are given with prefix', async () => {
        const service = new RerunService({ commandPrefix: 'CUSTOM_VAR=true' })
        service.nonPassingItems = nonPassingItems
        await expect(service.onComplete()).resolves.toBeUndefined()
    })

    it('onComplete should throw an exception when no parameters are given with additional params', async () => {
        const service = new RerunService({ customParameters: '--foobar' })
        service.nonPassingItems = nonPassingItems
        await expect(service.onComplete()).resolves.toBeUndefined()
    })

    it('onComplete should not throw an exception when no parameters are given and no nonPassingItems', async () => {
        const service = new RerunService()
        service.serviceWorkerId = '123'
        await expect(service.onComplete()).resolves.toBeUndefined()
    })

    it('before should not throw an exception when empty specFile parameter', async () => {
        const service = new RerunService()
        await expect(service.before({}, [])).resolves.toBeUndefined()
    })
})
