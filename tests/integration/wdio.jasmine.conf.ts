import RerunService from 'wdio-rerun-service'

export const config: WebdriverIO.Config = {
    runner: 'local',
    tsConfigPath: './tsconfig.json',

    specs: ['./jasmine/**/*.spec.ts'],
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
                rerunDataDir: './results/rerun',
                rerunScriptPath: './rerun.sh',
            },
        ],
    ],

    framework: 'jasmine',
    reporters: ['spec'],

    jasmineOpts: {
        defaultTimeoutInterval: 10000,
    },
}
