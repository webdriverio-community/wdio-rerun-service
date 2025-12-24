import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const TEST_PAGE = pathToFileURL(
    join(import.meta.dirname, '../test-page.html'),
).href

describe('Passing Tests', () => {
    it('should pass - navigation works', async () => {
        await browser.url(TEST_PAGE)
        const title = await browser.getTitle()
        expect(title).toContain('Test')
    })
})
