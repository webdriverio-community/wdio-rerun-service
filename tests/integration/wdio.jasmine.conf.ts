import RerunService from 'wdio-rerun-service'
import { baseConfig } from './wdio.base.conf.js'

export const config = {
    ...baseConfig,

    specs: ['./jasmine/**/*.spec.ts'],

    services: [
        [
            RerunService,
            {
                rerunDataDir: './jasmine/results/rerun',
                rerunScriptPath: './jasmine/rerun.sh',
            },
        ],
    ],

    framework: 'jasmine',

    jasmineOpts: {
        defaultTimeoutInterval: 10000,
    },
}
