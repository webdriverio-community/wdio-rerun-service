import RerunService from 'wdio-rerun-service'
import { baseConfig } from './wdio.base.conf.js'

export const config = {
    ...baseConfig,

    specs: ['./mocha/**/*.spec.ts'],

    services: [
        [
            RerunService,
            {
                rerunDataDir: './mocha/results/rerun',
                rerunScriptPath: './mocha/rerun.sh',
            },
        ],
    ],

    framework: 'mocha',

    mochaOpts: {
        ui: 'bdd',
        timeout: 10000,
    },
}
