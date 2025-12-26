import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['*.e2e.test.ts'],
        testTimeout: 60000, // 1 minute per test (browser startup + wdio run)
        hookTimeout: 30000,
        // Each framework uses its own rerun directory, so file parallelism is safe.
        // However, running too many browser instances causes instability.
        // Run files in parallel but tests within each file sequentially.
        fileParallelism: true,
    },
})
