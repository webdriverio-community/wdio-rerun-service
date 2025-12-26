import { Given, Then } from '@wdio/cucumber-framework'
import { expect } from '@wdio/globals'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Use a local file instead of hitting external servers for faster tests
const TEST_PAGE = pathToFileURL(
    join(import.meta.dirname, '../../test-page.html'),
).href

Given('I am on Google', async () => {
    await browser.url(TEST_PAGE)
})

Then('the page title should contain {string}', async (text: string) => {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await expect(browser).toHaveTitle(expect.stringContaining(text))
})

Then('the page title should be {string}', async (text: string) => {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await expect(browser).toHaveTitle(text)
})
