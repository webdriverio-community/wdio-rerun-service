describe('Passing Tests', () => {
    it('should pass - navigation works', async () => {
        await browser.url('https://www.google.com')
        const title = await browser.getTitle()
        expect(title).toContain('Google')
    })
})
