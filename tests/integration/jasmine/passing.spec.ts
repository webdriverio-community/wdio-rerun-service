describe('Passing Tests', () => {
    it('should pass - navigation works', async () => {
        const testPage = `file://${process.cwd()}/test-page.html`
        await browser.url(testPage)
        const title = await browser.getTitle()
        expect(title).toContain('Test')
    })
})
