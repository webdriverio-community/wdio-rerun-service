import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const TEST_PAGE = pathToFileURL(
    join(import.meta.dirname, '../test-page.html'),
).href

describe('Failing Tests', () => {
    it('should fail - intentional failure for rerun service', async () => {
        await browser.url(TEST_PAGE)
        const title = await browser.getTitle()
        // Intentionally fail to trigger rerun service
        // Throw an error since Jasmine's expectAsync doesn't propagate to afterTest hook
        if (title !== 'This will not match') {
            throw new Error(
                `Expected title to be 'This will not match' but got '${title}'`,
            )
        }
    })
})
