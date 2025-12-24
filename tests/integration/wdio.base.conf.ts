/**
 * Base WebdriverIO configuration shared across all frameworks
 */
export const baseConfig: Partial<WebdriverIO.Config> = {
    runner: 'local',
    tsConfigPath: './tsconfig.json',
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

    reporters: ['spec'],
}
