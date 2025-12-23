describe('Failing Tests', () => {
    it('should fail - intentional failure for rerun service', async () => {
        await browser.url('https://webdriver.io')
        const title = await browser.getTitle()
        // Intentionally fail to trigger rerun service
        expect(title).toBe('This will not match')
    })
})
