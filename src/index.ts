import type { Capabilities, Frameworks, Options, Services } from '@wdio/types'
import minimist from 'minimist'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { argv, env, platform } from 'node:process'
import { v4 as uuidv4 } from 'uuid'

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
    allowMultipleReruns?: boolean
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
    allowMultipleReruns: boolean

    constructor(options: RerunServiceOptions = {}) {
        const {
            ignoredTags,
            rerunDataDir,
            rerunScriptPath,
            commandPrefix,
            customParameters,
            allowMultipleReruns,
        } = options
        this.nonPassingItems = []
        this.serviceWorkerId = ''
        this.ignoredTags = ignoredTags ?? []
        this.rerunDataDir = rerunDataDir ?? './results/rerun'
        this.rerunScriptPath =
            rerunScriptPath ?? (platform === 'win32' ? 'rerun.bat' : 'rerun.sh')
        this.commandPrefix = commandPrefix ?? ''
        this.customParameters = customParameters ?? ''
        this.specFile = ''
        this.disabled =
            allowMultipleReruns === true
                ? !allowMultipleReruns
                : env['DISABLE_RERUN'] === 'true'
        this.allowMultipleReruns = allowMultipleReruns ?? false
    }

    async before(
        _capabilities: Capabilities.RemoteCapability,
        specs: string[],
    ) {
        if (this.disabled) {
            return
        }
        this.specFile = specs[0] ?? ''
        // console.log(
        //     `Re-run service is activated. Data directory: ${this.rerunDataDir}`,
        // )
        if (this.allowMultipleReruns) {
            await rm(this.rerunDataDir, { recursive: true, force: true });
        }
        await mkdir(this.rerunDataDir, { recursive: true })
        this.serviceWorkerId = uuidv4()
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
        // console.log(`Re-run service is inspecting non-passing test.`);
        // console.log(`Test location: ${this.specFile}`);
        const error = results.error as Error | undefined
        if (error?.message) {
            this.nonPassingItems.push({
                location: this.specFile,
                failure: error.message,
            })
        } else {
            // console.log("The non-passing test did not contain any error message, it could not be added for re-run.")
        }
    }

    // Executed after a Cucumber scenario ends.
    afterScenario(world: World) {
        if (this.disabled) {
            return
        }
        const config = browser.options as Options.Testrunner
        const status = world.result?.status
        if (
            config.framework !== 'cucumber' ||
            status === 'PASSED' ||
            status === 'SKIPPED'
        ) {
            return
        }
        const scenario = world.gherkinDocument.feature?.children.filter(
            (child) =>
                child.scenario
                    ? world.pickle.astNodeIds.includes(
                          child.scenario.id.toString(),
                      )
                    : false,
        )?.[0]?.scenario

        let scenarioLineNumber = scenario?.location.line ?? 0

        if (scenario && scenario.examples.length > 0) {
            let exampleLineNumber = 0
            scenario.examples.find((example) =>
                example.tableBody.find((row) => {
                    if (row.id === world.pickle.astNodeIds[1]) {
                        exampleLineNumber = row.location.line
                        return true
                    }
                    return false
                }),
            )

            scenarioLineNumber = exampleLineNumber
        }

        const scenarioLocation = `${world.pickle.uri}:${scenarioLineNumber}`
        const tagsList = world.pickle.tags.map((tag) => tag.name)
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
            return // console.log('Re-run service did not detect any non-passing scenarios or tests.');
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
            const parsedArgs = minimist(argv.slice(2))
            const args = parsedArgs._[0] ? parsedArgs._[0] + ' ' : ''
            const prefix = this.commandPrefix ? this.commandPrefix + ' ' : ''
            const disableRerunValue = String(!this.allowMultipleReruns)
            const disableRerun =
                platform === 'win32'
                    ? `set DISABLE_RERUN=${disableRerunValue} &&`
                    : `DISABLE_RERUN=${disableRerunValue}`

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
            // console.log(`Re-run script has been generated @ ${this.rerunScriptPath}`);
        } catch (err) {
            // console.log(`Re-run service failed to generate re-run script: ${err}`);
        }
    }
}
