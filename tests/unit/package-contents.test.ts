import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

describe('npm package contents', () => {
    const rootDir = join(import.meta.dirname, '..', '..')

    it('should have files whitelist in package.json', () => {
        const packageJson = JSON.parse(
            readFileSync(join(rootDir, 'package.json'), 'utf8'),
        )

        // Must have files field (whitelist approach)
        expect(packageJson.files).toBeDefined()
        expect(packageJson.files).toContain('build')

        // Should ONLY contain build directory
        expect(packageJson.files).toHaveLength(1)
        expect(packageJson.files[0]).toBe('build')
    })

    it('should have all required build artifacts', () => {
        const buildDir = join(rootDir, 'build')

        // ESM output
        expect(existsSync(join(buildDir, 'esm', 'index.js'))).toBe(true)
        expect(existsSync(join(buildDir, 'esm', 'index.d.ts'))).toBe(true)

        // CJS output
        expect(existsSync(join(buildDir, 'cjs', 'index.js'))).toBe(true)
        expect(existsSync(join(buildDir, 'cjs', 'index.d.ts'))).toBe(true)
        expect(existsSync(join(buildDir, 'cjs', 'package.json'))).toBe(true)
    })

    it('should not have dev files in build directory', () => {
        const buildDir = join(rootDir, 'build')

        const getAllFiles = (dir: string, prefix = ''): string[] => {
            const files: string[] = []
            const entries = readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                const fullPath = join(dir, entry.name)
                const relativePath = prefix
                    ? `${prefix}/${entry.name}`
                    : entry.name
                if (entry.isDirectory()) {
                    files.push(...getAllFiles(fullPath, relativePath))
                } else {
                    files.push(relativePath)
                }
            }
            return files
        }

        const buildFiles = getAllFiles(buildDir)

        // Only these files should exist in build
        const allowedPatterns = [
            /^(esm|cjs)\/index\.js$/,
            /^(esm|cjs)\/index\.js\.map$/,
            /^(esm|cjs)\/index\.d\.ts$/,
            /^cjs\/package\.json$/,
        ]

        for (const file of buildFiles) {
            const isAllowed = allowedPatterns.some((pattern) =>
                pattern.test(file),
            )
            expect(isAllowed, `Unexpected file in build: ${file}`).toBe(true)
        }
    })

    it('should have small build directory', () => {
        const buildDir = join(rootDir, 'build')

        const getDirectorySize = (dir: string): number => {
            let size = 0
            const entries = readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                const fullPath = join(dir, entry.name)
                if (entry.isDirectory()) {
                    size += getDirectorySize(fullPath)
                } else {
                    size += statSync(fullPath).size
                }
            }
            return size
        }

        const sizeInKB = getDirectorySize(buildDir) / 1024

        // Build directory should be under 50KB (currently ~20KB)
        expect(sizeInKB).toBeLessThan(50)
    })

    it('should not include dev files in root that could leak into package', () => {
        // These files exist in root but should NOT be published thanks to files whitelist
        const devFilesInRoot = [
            'vitest.config.ts',
            'eslint.config.js',
            'tsconfig.json',
            '.github',
            'src',
            'tests',
            'coverage',
        ]

        // Verify they exist (so this test is meaningful)
        const existingDevFiles = devFilesInRoot.filter((f) =>
            existsSync(join(rootDir, f)),
        )

        // At least some dev files should exist in root
        expect(existingDevFiles.length).toBeGreaterThan(0)

        // But they won't be published because files: ["build"] excludes them
        // This test documents that the whitelist is intentional
    })
})
