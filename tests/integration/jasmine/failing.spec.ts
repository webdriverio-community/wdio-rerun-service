describe('Failing Tests', () => {
    it('should fail - intentional failure for rerun service', async () => {
        const testPage = `file://${process.cwd()}/test-page.html`
        await browser.url(testPage)
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
