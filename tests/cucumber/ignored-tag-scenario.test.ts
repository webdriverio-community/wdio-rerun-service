import { describe, expect, it } from 'vitest'
import * as fs from 'fs'
import RerunService from '../../src'

const world = JSON.parse(
    fs
        .readFileSync(
            './tests/cucumber/fixtures/ignored-tag-scenario.world.json',
        )
        .toString(),
)

describe('wdio-rerun-service - Ignored tags', () => {
    const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
    const specFile = ['tests/ignored-tag-scenario.feature']

    const cucumberBrowser: WebdriverIO.Browser = {
        options: { framework: 'cucumber' },
    } as WebdriverIO.Browser

    it('should NOT add scenario with ignored tag to nonPassingItems', async () => {
        const service = new RerunService({ ignoredTags: ['@skip'] })
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        // Scenario has @skip tag which is in ignoredTags, so it should be filtered out
        expect(service.nonPassingItems.length).toBe(0)
    })

    it('should add scenario when tag is not in ignoredTags', async () => {
        const service = new RerunService({ ignoredTags: ['@other-tag'] })
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        // Scenario has @skip tag but we're ignoring @other-tag, so it should be added
        expect(service.nonPassingItems.length).toBe(1)
        expect(service.nonPassingItems[0]?.location).toEqual(
            'tests/ignored-tag-scenario.feature:5',
        )
    })

    it('should add scenario when ignoredTags is empty', async () => {
        const service = new RerunService({ ignoredTags: [] })
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        // No ignored tags, so scenario should be added
        expect(service.nonPassingItems.length).toBe(1)
    })
})
