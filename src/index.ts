import type { Logger } from '@wdio/logger'
import logger from '@wdio/logger'
import type { Frameworks, Options, Services } from '@wdio/types'
import { randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { argv, env, platform } from 'node:process'
import { parseArgs } from 'node:util'

type AfterScenario = NonNullable<
    WebdriverIO.HookFunctionExtension['afterScenario']
>
type AfterScenarioParameters = Parameters<AfterScenario>
type World = AfterScenarioParameters[0]

interface NonPassingItem {
    location: string
    failure?: string | undefined
}

interface RerunServiceOptions {
    ignoredTags?: string[]
    rerunDataDir?: string
    rerunScriptPath?: string
    commandPrefix?: string
    customParameters?: string
    platformName?: NodeJS.Platform
}

export default class RerunService implements Services.ServiceInstance {
    nonPassingItems: NonPassingItem[]
    serviceWorkerId: string
    ignoredTags: string[]
    rerunDataDir: string
    rerunScriptPath: string
    commandPrefix: string
    customParameters: string
    specFile: string
    disabled: boolean
    platformName: NodeJS.Platform
    log: Logger

    constructor(options: RerunServiceOptions = {}) {
        const {
            ignoredTags,
            rerunDataDir,
            rerunScriptPath,
            commandPrefix,
            customParameters,
            platformName,
        } = options
        this.nonPassingItems = []
        this.serviceWorkerId = ''
        this.ignoredTags = ignoredTags ?? []
        this.rerunDataDir = rerunDataDir ?? './results/rerun'
        this.platformName = platformName ?? platform
        this.rerunScriptPath =
            rerunScriptPath ??
            (this.platformName === 'win32' ? 'rerun.bat' : 'rerun.sh')
        this.commandPrefix = commandPrefix ?? ''
        this.customParameters = customParameters ?? ''
        this.specFile = ''
        this.disabled = env['DISABLE_RERUN'] === 'true'
        this.log = logger('@wdio/wdio-rerun-service')
    }

    async before(_capabilities: WebdriverIO.Capabilities, specs: string[]) {
        if (this.disabled) {
            return
        }
        this.specFile = specs[0] ?? ''
        this.log.debug(
            `🔄 Re-run service activated. Data directory: ${this.rerunDataDir}`,
        )
        await mkdir(this.rerunDataDir, { recursive: true })
        this.serviceWorkerId = randomUUID()
    }

    afterTest(
        _test: Frameworks.Test,
        _context: any,
        results: Frameworks.TestResult,
    ) {
        if (this.disabled) {
            return
        }
        const { passed } = results
        const config = browser.options as Options.Testrunner
        if (passed || config.framework === 'cucumber') {
            return
        }
        this.log.debug(`🔍 Inspecting non-passing test.`)
        this.log.debug(`📍 Test location: ${this.specFile}`)
        const error = results.error as Error | undefined
        if (error?.message) {
            this.nonPassingItems.push({
                location: this.specFile,
                failure: error.message,
            })
        } else {
            this.log.debug(
                '⚠️ Non-passing test did not contain an error message, skipping.',
            )
        }
    }

    // Executed after a Cucumber scenario ends.
    afterScenario(world: World) {
        if (this.disabled) {
            return
        }
        const config = browser.options as Options.Testrunner
        const status = world.result?.status as string | undefined
        if (
            config.framework !== 'cucumber' ||
            status === 'PASSED' ||
            status === 'SKIPPED'
        ) {
            return
        }

        const { gherkinDocument, pickle } = world
        const featureChildren = gherkinDocument.feature?.children ?? []

        // Locate the matching scenario by searching feature children
        // Scenarios can be at top-level OR nested within Rule blocks
        const findMatchingScenario = () => {
            for (const featureChild of featureChildren) {
                // Direct scenario under feature
                if (featureChild.scenario) {
                    if (pickle.astNodeIds.includes(featureChild.scenario.id)) {
                        return featureChild.scenario
                    }
                }
                // Scenario nested inside a Rule block
                if (featureChild.rule?.children) {
                    const ruleScenario = featureChild.rule.children.find(
                        (ruleChild) =>
                            ruleChild.scenario &&
                            pickle.astNodeIds.includes(ruleChild.scenario.id),
                    )?.scenario
                    if (ruleScenario) return ruleScenario
                }
            }
            return undefined
        }

        const scenario = findMatchingScenario()
        let scenarioLineNumber = scenario?.location.line ?? 0

        if (scenario && scenario.examples.length > 0) {
            let exampleLineNumber = 0
            scenario.examples.find((example) =>
                example.tableBody.find((row) => {
                    if (row.id === pickle.astNodeIds[1]) {
                        exampleLineNumber = row.location.line
                        return true
                    }
                    return false
                }),
            )
            scenarioLineNumber = exampleLineNumber
        }

        const scenarioLocation = `${pickle.uri}:${scenarioLineNumber}`
        const tagsList = pickle.tags.map((tag) => tag.name)
        if (
            !Array.isArray(this.ignoredTags) ||
            !tagsList.some((ignoredTag) =>
                this.ignoredTags.includes(ignoredTag),
            )
        ) {
            this.nonPassingItems.push({
                location: scenarioLocation,
                failure: world.result?.message,
            })
        }
    }

    async after() {
        if (this.disabled) {
            return
        }
        if (this.nonPassingItems.length === 0) {
            this.log.debug('✅ No non-passing scenarios or tests detected.')
            return
        }
        await writeFile(
            join(this.rerunDataDir, `rerun-${this.serviceWorkerId}.json`),
            JSON.stringify(this.nonPassingItems),
        )
    }

    async onComplete() {
        if (this.disabled) {
            return
        }
        try {
            const files = await readdir(this.rerunDataDir)
            const rerunFiles = files.filter((file) => file.endsWith('.json'))
            if (rerunFiles.length === 0) {
                return
            }
            const { positionals } = parseArgs({
                args: argv.slice(2),
                allowPositionals: true,
                strict: false,
            })
            const args = positionals[0] ? positionals[0] + ' ' : ''
            const prefix = this.commandPrefix ? this.commandPrefix + ' ' : ''
            const disableRerun =
                this.platformName === 'win32'
                    ? 'set DISABLE_RERUN=true &&'
                    : 'DISABLE_RERUN=true'
            let rerunCommand = `${prefix}${disableRerun} npx wdio ${args}${this.customParameters}`
            const failureLocations = new Set<string>()
            for (const file of rerunFiles) {
                const json = JSON.parse(
                    await readFile(join(this.rerunDataDir, file), 'utf8'),
                ) as NonPassingItem[]
                json.forEach((failure) => {
                    failureLocations.add(failure.location.replace(/\\/g, '/'))
                })
            }
            failureLocations.forEach((failureLocation) => {
                rerunCommand += ` --spec=${failureLocation}`
            })
            await writeFile(this.rerunScriptPath, rerunCommand, { mode: 0o755 })
            this.log.debug(
                `📝 Re-run script generated: ${this.rerunScriptPath}`,
            )
        } catch (err) {
            this.log.debug(
                `❌ Failed to generate re-run script: ${JSON.stringify(err)}`,
            )
        }
    }
}
