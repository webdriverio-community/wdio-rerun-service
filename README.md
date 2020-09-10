WebdriverIO Re-run Service
==========================

This service tracks failing tests and scenarios, allowing failing or unstable tests or scenarios to be re-run.

## Re-run vs. Retry

The `retry` logic built into WDIO for Cucumber and Mocha/Jasmine is helpful for handling flakey steps in Cucumber and flakey tests in Mocha/Jasmine. However, for Cucumber this does not into account that some steps may not be able to be retried and running them 2x could break the rest of your Scenario. Mocha/Jasmine is another story as the `retry` logic can be applied to an entire test, however, this is still done real-time and perhaps does not account for temporal issues or netework connectivity problems.

The main distinctions of the `re-run`:
* will re-run an entire Cucumber Sceanrio by line number and not just the step
* allows for an entire Spec file to be re-run after a main test execution is complete
* can be copied and executed locally (`retry` cannot)
* can be used in conjuction with `retry` methods
* does not require code changes to apply `retry` method to flakey or problematic tests

It is recommended to take some time to evaluate the options available, often times, a mixed solution maybe the solution which will provide the best real and actionable results to developers.

## Installation

The easiest way is to add `wdio-rerun-service` to `devDependencies` in your `package.json`.

```json
{
    "devDependencies": {
        "wdio-rerun-service": "^0.0.7"
    }
}
```

You can simple do it by:

```bash
npm install wdio-rerun-service
```

After package installation is complet, add it to `services` array:

```js
// wdio.conf.js
const RerunService = require('wdio-rerun-service');
export.config = {
    // ...
    services: [RerunService],
    // ...
};
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

The following options can be added to the wdio.conf.js file. To define options for the service you need to add the service to the `services` list in the following way:

```js
// wdio.conf.js
const RerunService = require('wdio-rerun-service');
export.config = {
    // ...
    services: [
        [RerunService', {
            // Re-run service options here...
        }]
    ],
    // ...
};
```

### rerunDataDir
Directory where all the re-run JSON data will be kept during execution.

Type: `String`

Default: `./results/rerun`

Example:
```js
const RerunService = require('wdio-rerun-service');
export.config = {
    // ...
    services: [
        [RerunService', {
            rerunDataDir : './custom-rerun-directory'
        }]
    ],
    // ...
}
```

### rerunScriptPath
Path to write re-run Bash script.

Type: `String`

Default: `./rerun.sh`

Example:
```js
const RerunService = require('wdio-rerun-service');
export.config = {
    // ...
    services: [
        [RerunService', {
            rerunDataDir : './custom-path-for-rerun.sh'
        }]
    ],
    // ...
}
```

### ignoredTags
(Cucumber-only) Set of Cucumber tags, if scenario contains tag re-run service skip analysis.

Type: `Array`

Default: `[]`

Example:
```js
const RerunService = require('wdio-rerun-service');
export.config = {
    // ...
    services: [
        [RerunService', {
            ignoredTags: ['@known_bug']
        }]
    ],
    // ...
}
```

### commandPrefix
Prefix which will be added to the re-run command that is generated.

Type: `String`

Default: `''`

Example:
```js
const RerunService = require('wdio-rerun-service');
export.config = {
    // ...
    services: [
        [RerunService', {
            commandPrefix: "VARIABLE=true"
        }]
    ],
    // ...
}
```

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
