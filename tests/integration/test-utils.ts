/**
 * Shared test utilities for integration tests
 */
import { execSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

export const INTEGRATION_DIR = join(import.meta.dirname, '.')

export interface WdioResult {
    exitCode: number
    output: string
    stderr: string
}

export type Framework = 'cucumber' | 'jasmine' | 'mocha'

/**
 * Get paths for a framework's rerun artifacts
 */
export function getFrameworkPaths(framework: Framework) {
    const frameworkDir = join(INTEGRATION_DIR, framework)
    return {
        dir: frameworkDir,
        rerunScript: join(frameworkDir, 'rerun.sh'),
        rerunBat: join(frameworkDir, 'rerun.bat'),
        resultsDir: join(frameworkDir, 'results'),
        rerunDataDir: join(frameworkDir, 'results', 'rerun'),
    }
}

/**
 * Clean rerun artifacts for a framework
 */
export async function cleanRerunArtifacts(framework: Framework): Promise<void> {
    const paths = getFrameworkPaths(framework)
    await rm(paths.rerunScript, { force: true })
    await rm(paths.rerunBat, { force: true })
    await rm(paths.resultsDir, { recursive: true, force: true })
}

/**
 * Run WebdriverIO with the specified framework and specs
 */
export function runWdio(framework: Framework, specs: string[]): WdioResult {
    const specsArg = specs.map((s) => `--spec=${s}`).join(' ')
    const cmd = `pnpm wdio:${framework} ${specsArg}`

    try {
        const output = execSync(cmd, {
            cwd: INTEGRATION_DIR,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        })
        return { exitCode: 0, output, stderr: '' }
    } catch (error: unknown) {
        const execError = error as {
            status?: number
            stdout?: string
            stderr?: string
        }
        return {
            exitCode: execError.status ?? 1,
            output: execError.stdout ?? '',
            stderr: execError.stderr ?? '',
        }
    }
}
