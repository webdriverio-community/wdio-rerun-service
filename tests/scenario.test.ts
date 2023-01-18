import { describe, expect, it } from '@jest/globals'
import * as fs from 'fs'
import RerunService from '../src'

const world = JSON.parse(
    fs.readFileSync('./tests/scenario.world.json').toString(),
)

describe('wdio-rerurn-service', () => {
    const capabilities = { browser: 'chrome' }
    const specFile = ['tests/scenario.feature']

    const cucumberBrowser: WebdriverIO.Browser = {
        config: { framework: 'cucumber' },
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
