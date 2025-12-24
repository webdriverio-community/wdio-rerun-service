import RerunService from 'wdio-rerun-service'

export const config: WebdriverIO.Config = {
    runner: 'local',
    tsConfigPath: './tsconfig.json',

    specs: ['./cucumber/features/**/*.feature'],
    exclude: [],

    maxInstances: 1,

    capabilities: [
        {
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: [
                    '--headless',
                    '--disable-gpu',
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                ],
            },
        },
    ],

    logLevel: 'error',
    bail: 0,
    waitforTimeout: 1000,
    connectionRetryTimeout: 30000,
    connectionRetryCount: 1,

    services: [
        [
            RerunService,
            {
                rerunDataDir: './cucumber/results/rerun',
                rerunScriptPath: './cucumber/rerun.sh',
                ignoredTags: ['@skip-rerun'],
            },
        ],
    ],

    framework: 'cucumber',
    reporters: ['spec'],

    cucumberOpts: {
        require: ['./cucumber/step-definitions/**/*.ts'],
        backtrace: false,
        requireModule: [],
        dryRun: false,
        failFast: false,
        snippets: true,
        source: true,
        strict: false,
        tagExpression: '',
        timeout: 10000,
        ignoreUndefinedDefinitions: false,
    },
}
