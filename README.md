WebdriverIO Re-run Service
==========================

This service tracks failing tests and scenarios, allowing failing or unstable tests or scenarios to be re-run.

## Installation

The easiest way is to add `wdio-rerun-service` to `devDependencies` in your `package.json`.

```json
{
    "devDependencies": {
        "wdio-rerun-service": "^1.0.0"
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