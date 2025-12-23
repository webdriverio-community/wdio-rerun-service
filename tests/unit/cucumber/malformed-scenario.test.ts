import { describe, expect, it } from 'vitest'
import fs from 'fs'
import RerunService from '../../../src'

const world = JSON.parse(
    fs
        .readFileSync(
            './tests/unit/cucumber/fixtures/malformed-scenario.world.json',
        )
        .toString(),
)

describe('wdio-rerun-service - Malformed scenario (no matching ID)', () => {
    const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
    const specFile = ['tests/malformed-scenario.feature']

    const cucumberBrowser: WebdriverIO.Browser = {
        options: { framework: 'cucumber' },
    } as WebdriverIO.Browser

    it('should add to nonPassingItems with line 0 when scenario cannot be found', async () => {
        const service = new RerunService()
        global.browser = cucumberBrowser
        await service.before(capabilities, specFile)
        service.afterScenario(world)
        // When scenario is not found, line number defaults to 0
        // The service still adds it with :0 as the line number
        expect(service.nonPassingItems.length).toBe(1)
        expect(service.nonPassingItems[0]?.location).toContain(':0')
    })
})
