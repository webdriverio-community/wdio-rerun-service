import { describe, expect, it } from 'vitest'
import * as fs from 'fs'
import RerunService from '../../src'

const world = JSON.parse(
    fs
        .readFileSync(
            './tests/cucumber/fixtures/background-under-rule.world.json',
        )
        .toString(),
)

describe('wdio-rerun-service - Background in Rules', () => {
    const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
    const specFile = ['tests/background.rule.feature']

    const cucumberBrowser: WebdriverIO.Browser = {
        options: { framework: 'cucumber' },
    } as WebdriverIO.Browser

    it('should generate line number for scenario with background steps in a Rule', async () => {
        const service = new RerunService()
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        expect(service?.nonPassingItems[0]?.location).toEqual(
            'tests/background.rule.feature:14',
        )
    })
})
