import RerunService from 'wdio-rerun-service'

export const config: WebdriverIO.Config = {
    runner: 'local',
    tsConfigPath: './tsconfig.json',

    specs: ['./mocha/**/*.spec.ts'],
    exclude: [],

    maxInstances: 1,

    capabilities: [
        {
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: ['--headless', '--disable-gpu', '--no-sandbox'],
            },
        },
    ],

    logLevel: 'warn',
    bail: 0,
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

    services: [
        [
            RerunService,
            {
                rerunDataDir: './results/rerun',
                rerunScriptPath: './rerun.sh',
            },
        ],
    ],

    framework: 'mocha',
    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
    },
}
