import { describe, expect, it } from '@jest/globals'
import * as fs from 'fs'
import RerunService from '../../src'

const world = JSON.parse(
    fs
        .readFileSync('./tests/cucumber/fixtures/scenario-outline.world.json')
        .toString(),
)

describe('wdio-rerurn-service', () => {
    const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
    const specFile = ['tests/scenario.outline.feature']

    const cucumberBrowser: WebdriverIO.Browser = {
        options: { framework: 'cucumber' },
    } as WebdriverIO.Browser

    it('should generate line number at the row of example data', async () => {
        const service = new RerunService()
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        expect(service?.nonPassingItems[0]?.location).toEqual(
            'tests/scenario.outline.feature:12',
        )
    })
})
