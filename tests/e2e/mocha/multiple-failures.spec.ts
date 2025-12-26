import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const TEST_PAGE = pathToFileURL(
    join(import.meta.dirname, '../test-page.html'),
).href

/**
 * Spec file with multiple failing tests
 * Used to verify that rerun.sh contains the spec file only ONCE
 * (not duplicated for each failure)
 */
describe('Multiple Failures Spec', () => {
    it('first failing test', async () => {
        await browser.url(TEST_PAGE)
        const title = await browser.getTitle()
        if (title !== 'First failure') {
            throw new Error(`Expected title "First failure" but got "${title}"`)
        }
    })

    it('second failing test', async () => {
        await browser.url(TEST_PAGE)
        const title = await browser.getTitle()
        if (title !== 'Second failure') {
            throw new Error(
                `Expected title "Second failure" but got "${title}"`,
            )
        }
    })
})
