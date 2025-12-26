import RerunService from 'wdio-rerun-service'
import { baseConfig } from './wdio.base.conf.js'

export const config = {
    ...baseConfig,

    specs: ['./cucumber/features/**/*.feature'],

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
