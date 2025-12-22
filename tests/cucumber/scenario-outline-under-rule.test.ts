import { describe, expect, it } from 'vitest'
import * as fs from 'fs'
import RerunService from '../../src'

const world = JSON.parse(
    fs
        .readFileSync(
            './tests/cucumber/fixtures/scenario-outline-under-rule.world.json',
        )
        .toString(),
)

describe('wdio-rerun-service - Scenario Outline under Rule', () => {
    const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
    const specFile = ['tests/scenario.outline.rule.feature']

    const cucumberBrowser: WebdriverIO.Browser = {
        options: { framework: 'cucumber' },
    } as WebdriverIO.Browser

    it('should generate line number at the row of example data for scenario outline nested under a Rule', async () => {
        const service = new RerunService()
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        // The failing example is from "Secondary data" at line 19
        expect(service?.nonPassingItems[0]?.location).toEqual(
            'tests/scenario.outline.rule.feature:19',
        )
    })
})
