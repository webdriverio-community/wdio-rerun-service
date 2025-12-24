import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        exclude: ['tests/integration/**'],  // Integration tests have their own config
        coverage: {
            provider: 'v8',
            include: ['src/index.ts'],
            reporter: ['text', 'lcov'],
            thresholds: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100,
            },
        },
    },
})
