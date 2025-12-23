import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['integration.test.ts'],
        testTimeout: 60000, // 1 minute per test (browser startup + wdio run)
        hookTimeout: 30000,
    },
})
