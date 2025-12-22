import { describe, expect, it } from 'vitest'
import fs from 'fs'
import RerunService from '../../src'

const world = JSON.parse(
    fs
        .readFileSync('./tests/cucumber/fixtures/multiple-rules.world.json')
        .toString(),
)

describe('wdio-rerun-service - Multiple Rules in feature', () => {
    const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
    const specFile = ['tests/multiple-rules.feature']

    const cucumberBrowser: WebdriverIO.Browser = {
        options: { framework: 'cucumber' },
    } as WebdriverIO.Browser

    it('should find scenario in second rule when first rule also has scenarios', async () => {
        const service = new RerunService()
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        // Scenario is in second Rule block at line 11
        expect(service.nonPassingItems.length).toBe(1)
        expect(service.nonPassingItems[0]?.location).toEqual(
            'tests/multiple-rules.feature:11',
        )
    })
})
