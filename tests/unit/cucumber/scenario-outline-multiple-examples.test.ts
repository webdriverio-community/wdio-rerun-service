import { describe, expect, it } from 'vitest'
import fs from 'fs'
import RerunService from '../../../src'

const world = JSON.parse(
    fs
        .readFileSync(
            './tests/unit/cucumber/fixtures/scenario-outline-multiple-examples.world.json',
        )
        .toString(),
)

describe('wdio-rerun-service - Scenario Outline with Multiple Examples', () => {
    const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
    const specFile = ['tests/scenario.outline.multiple.feature']

    const cucumberBrowser: WebdriverIO.Browser = {
        options: { framework: 'cucumber' },
    } as WebdriverIO.Browser

    it('should generate line number for the specific example row from second Examples table', async () => {
        const service = new RerunService()
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        // The world.json has astNodeIds pointing to line 19 (first data row of Second set)
        expect(service?.nonPassingItems[0]?.location).toEqual(
            'tests/scenario.outline.multiple.feature:19',
        )
    })
})
