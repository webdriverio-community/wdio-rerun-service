import { describe, expect, it } from 'vitest'
import fs from 'fs'
import RerunService from '../../../src'

const world = JSON.parse(
    fs
        .readFileSync(
            './tests/unit/cucumber/fixtures/basic-scenario.world.json',
        )
        .toString(),
)

describe('wdio-rerun-service', () => {
    const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
    const specFile = ['tests/scenario.feature']

    const cucumberBrowser: WebdriverIO.Browser = {
        options: { framework: 'cucumber' },
    } as WebdriverIO.Browser

    it('should generate line number at the row of scenario', async () => {
        const service = new RerunService()
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        expect(service?.nonPassingItems[0]?.location).toEqual(
            'tests/scenario.feature:7',
        )
    })
})
