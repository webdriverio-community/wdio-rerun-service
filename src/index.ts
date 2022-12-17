import type { Capabilities, Frameworks, Services } from '@wdio/types'
import type { Testrunner } from '@wdio/types/build/Options'
import minimist from 'minimist'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { argv, platform } from 'node:process'
import { v5 as uuidv5 } from 'uuid'

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

    constructor(options: RerunServiceOptions = {}) {
        const {
            ignoredTags,
            rerunDataDir,
            rerunScriptPath,
            commandPrefix,
            customParameters,
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
    }

    async before(
        _capabilities: Capabilities.RemoteCapability,
        specs: string[],
    ) {
        this.specFile = specs[0] ?? ''
        // console.log(`Re-run service is activated. Data directory: ${this.rerunDataDir}`);
        await mkdir(this.rerunDataDir, { recursive: true })
        this.serviceWorkerId = uuidv5(String(Date.now()), uuidv5.DNS)
    }

    afterTest(
        _test: Frameworks.Test,
        _context: any,
        results: Frameworks.TestResult,
    ) {
        const { passed } = results
        const config = browser.config as Testrunner
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
        const CUCUMBER_STATUS_MAP = [
            'UNKNOWN',
            'PASSED',
            'SKIPPED',
            'PENDING',
            'UNDEFINED',
            'AMBIGUOUS',
            'FAILED',
        ]
        const config = browser.config as Testrunner
        const status =
            typeof world.result?.status === 'number'
                ? CUCUMBER_STATUS_MAP[world.result.status]
                : world.result?.status
        if (
            config.framework !== 'cucumber' ||
            status === 'PASSED' ||
            status === 'SKIPPED'
        ) {
            return
        }
        const scenarioLineNumber =
            world.gherkinDocument.feature?.children.filter((child) =>
                child.scenario
                    ? world.pickle.astNodeIds.includes(
                          child.scenario.id.toString(),
                      )
                    : false,
            )?.[0]?.scenario?.location.line ?? 0
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
        if (this.nonPassingItems.length === 0) {
            return // console.log('Re-run service did not detect any non-passing scenarios or tests.');
        }
        await writeFile(
            join(this.rerunDataDir, `rerun-${this.serviceWorkerId}.json`),
            JSON.stringify(this.nonPassingItems),
        )
    }

    async onComplete() {
        try {
            const files = await readdir(this.rerunDataDir)
            const rerunFiles = files.filter((file) => file.endsWith('.json'))
            if (rerunFiles.length === 0) {
                return
            }
            const parsedArgs = minimist(argv.slice(2))
            const args = parsedArgs._[0] ? parsedArgs._[0] + ' ' : ''
            const prefix = this.commandPrefix ? this.commandPrefix + ' ' : ''
            const disableRerun =
                platform === 'win32'
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
            // console.log(`Re-run script has been generated @ ${this.rerunScriptPath}`);
        } catch (err) {
            // console.log(`Re-run service failed to generate re-run script: ${err}`);
        }
    }
}
