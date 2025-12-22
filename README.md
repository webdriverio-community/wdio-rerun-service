WebdriverIO Re-run Service
==========================

[![wdio-rerun-service CI](https://github.com/webdriverio-community/wdio-rerun-service/actions/workflows/test.yml/badge.svg)](https://github.com/webdriverio-community/wdio-rerun-service/actions/workflows/test.yml)
![npm](https://img.shields.io/npm/dm/wdio-rerun-service)
![npm bundle size](https://img.shields.io/bundlephobia/min/wdio-rerun-service)
![GitHub issues](https://img.shields.io/github/issues/webdriverio-community/wdio-rerun-service)

This service tracks failing Mocha or Jasmine tests and Cucumber scenarios executed within the [WebdriverIO](https://webdriver.io) test framework. It will allow failing or unstable tests or scenarios to be re-run.

## Features

- 🔄 Re-run failed Mocha, Jasmine, or Cucumber tests after the main test run completes
- 🥒 Full Cucumber support including scenarios inside `Rule:` blocks
- 🏷️ Filter out scenarios with specific tags from re-runs
- 🪟 Cross-platform support (generates `rerun.sh` on Unix, `rerun.bat` on Windows)
- ⚙️ Configurable command prefix and custom parameters

## Compatibility

| wdio-rerun-service | WebdriverIO |
|--------------------|-------------|
| `^2.1.0`           | `^8.0.0 \|\| ^9.0.0` |
| `^2.0.0`           | `^8.0.0` |
| `^1.7.0`           | `^7.0.0` |

**Note:** Version `2.1.0` is backward compatible with WebdriverIO v8 and adds support for v9. All users on v8 or v9 should use the latest `2.x.x` version.

## Re-run vs. Retry

The `retry` logic built into WebdriverIO for Cucumber and Mocha/Jasmine is helpful for handling flaky steps in Cucumber and Mocha/Jasmine. Retrying in each framework has caveats: 
* Cucumber: It does not take into account that some steps may not be able to be retried in the middle of a test. Running a step twice may break the rest of the Scenario or it may not be possible in the test context. 
* Mocha/Jasmine: The `retry` logic may be applied to an individual test, however, this is still done in real-time and perhaps does not account for temporal issues or network connectivity problems.

The main distinctions of the `re-run`:
* Will re-run an entire individual Cucumber Scenario and not just a single step
* Enables an entire spec file to be re-run after a main test execution is complete
* May be copied and executed locally (`retry` cannot)
* Can still be used in conjunction with `retry` methods
* Does not require any code change to apply `retry` logic to flaky or problematic tests

It is recommended to take some time to evaluate the options available. A hybrid solution may be the best solution to provide the best real and actionable test results.

## Installation

Using `npm`:

```bash
npm install wdio-rerun-service
```

Using `yarn`:

```bash
yarn add wdio-rerun-service
```

Using `pnpm`:

```bash
pnpm add wdio-rerun-service
```

After package installation is complete, add it to `services` array in `wdio.conf.js`:

```js
// wdio.conf.js
import RerunService from 'wdio-rerun-service';
export const config = {
    // ...
    services: [
        [RerunService, {
            // Re-run service options here...
        }]
    ],
    // ...
};
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Usage

By design, this service does not automatically re-run failed tests.

After WebdriverIO has completed execution, if failures are found, a re-run script will be generated at **rerunScriptPath** (default: `./rerun.sh` on Unix, `./rerun.bat` on Windows).

You can then execute this script manually or integrate it into your CI pipeline.

### Disabling Re-run

Set the environment variable `DISABLE_RERUN=true` to disable the service (useful during re-run execution to prevent infinite loops).

### Conditional Re-run
Every teams re-run needs will differ execution could be based on any number of factors, this is an example of how to accomplish a conditional re-run based on # of failures.

##### attemptRerun.sh
Executes `./rerun.sh` if less than 25 failures have been found in the last execution of WebdriverIO.
```sh
#!/usr/bin/env bash
MAX_TO_RERUN=${MAX_TO_RERUN:=25}
if [ -f "rerun.sh" ]; then
  echo "[rerun.sh] file exists, checking total failures."
  NUMBER_OF_FAILURES=$(grep "\-\-spec" -o rerun.sh | wc -l | xargs)
	if [ "$MAX_TO_RERUN" -gt "$NUMBER_OF_FAILURES" ]; then
    echo "Re-running $NUMBER_OF_FAILURES failed scenarios!"
    . ./rerun.sh
	else
    echo "Skipping re-run, expected < $MAX_TO_RERUN failures to qualify execution for re-run, got $NUMBER_OF_FAILURES failures."
	fi
else
  echo "No [rerun.sh] file exists, skipping re-run!"
fi
```
##### Bash Re-run Command
Execute in shell
```sh
. ./attemptRerun.sh
```
##### Integrate with NPM
Add task in `package.json`
```sh
"attempt-rerun": ". ./attemptRerun.sh"
````
##### NPM Re-run Command
Execute in shell
```sh
npm run attempt-rerun
```

## Configuration

The following options may be added to the wdio.conf.js file. To define options for the service you need to add the service to the `services` list in the following way:

```js
// wdio.conf.js
import RerunService from 'wdio-rerun-service';
export const config = {
    // ...
    services: [
        [RerunService, {
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
import RerunService from 'wdio-rerun-service';
export const config = {
    // ...
    services: [
        [RerunService, {
            rerunDataDir: './custom-rerun-directory'
        }]
    ],
    // ...
}
```

### rerunScriptPath
Path to write the re-run script.

Type: `String`

Default: `./rerun.sh` (Unix) or `./rerun.bat` (Windows)

Example:
```js
import RerunService from 'wdio-rerun-service';
export const config = {
    // ...
    services: [
        [RerunService, {
            rerunScriptPath: './custom-path-for-rerun.sh'
        }]
    ],
    // ...
}
```

### ignoredTags
(Cucumber-only) Set of Cucumber tags to exclude. If scenario contains a tag, the re-run service will skip analysis.

Type: `Array`

Default: `[]`

Example:
```js
import RerunService from 'wdio-rerun-service';
export const config = {
    // ...
    services: [
        [RerunService, {
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
import RerunService from 'wdio-rerun-service';
export const config = {
    // ...
    services: [
        [RerunService, {
            commandPrefix: "VARIABLE=true"
        }]
    ],
    // ...
}
```

### customParameters
Parameters which will be added to the re-run command that is generated.
Can be used with `commandPrefix`.

Type: `String`

Default: `''`

Example:
```js
import RerunService from 'wdio-rerun-service';
export const config = {
    // ...
    services: [
        [RerunService, {
            customParameters: "--foobar"
        }]
    ],
    // ...
}
```
----

