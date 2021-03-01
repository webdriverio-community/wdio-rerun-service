const fs = require('fs');
const path = require('path');
const { v5: uuidv5 } = require('uuid');
const argv = require('minimist')(process.argv.slice(2));

class RerunService {

    constructor({ ignoredTags, rerunDataDir, rerunScriptPath, commandPrefix }) {
        this.nonPassingItems = [];
        this.serviceWorkerId;
        this.ignoredTags = ignoredTags ? ignoredTags : [];
        this.rerunDataDir = rerunDataDir ? rerunDataDir : "./results/rerun";
        this.rerunScriptPath = rerunScriptPath ? rerunScriptPath : "./rerun.sh";
        this.commandPrefix = commandPrefix ? commandPrefix : "";
        this.specFile = "";
    }

    before(capabilities, specs, browser) {
        this.specFile = specs[0];
        // console.log(`Re-run service is activated. Data directory: ${this.rerunDataDir}`);
        fs.mkdir(this.rerunDataDir, { recursive: true }, err => {
            if (err) throw err;
        });
        // INFO: `namespace` below copied from: https://github.com/kelektiv/node-uuid/blob/master//lib/v35.js#L54:16
        this.serviceWorkerId = uuidv5(`${Date.now()}`, '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    }

    // Executed after a test (in Mocha/Jasmine) ends.
    afterTest(test, context, { error, result, duration, passed, retries }) {
        if (browser.config.framework !== 'cucumber' && !passed) {
            console.log(`Re-run service is inspecting non-passing test.`);
            console.log(`Test location: ${this.specFile}`);
            if (error && error.message) {
                this.nonPassingItems.push({ location: this.specFile, failure: error.message });
            } else {
                // console.log("The non-passing test did not contain any error message, it could not be added for re-run.")
            }
        }
    }

    // Executed after a Cucumber scenario ends.
    afterScenario(world) {
        const CUCUMBER_STATUS_MAP = ['unknown', 'passed', 'skipped', 'pending', 'undefined', 'ambiguous', 'failed']
        const status = CUCUMBER_STATUS_MAP[world.result.status || 0]
        const scenarioLineNumber = world.gherkinDocument.feature.children.filter((child) => {
            return world.pickle.astNodeIds.includes(child.scenario.id);
        })[0].scenario.location.line;

        if (browser.config.framework === 'cucumber' && (status !== 'passed' && status !== 'skipped')) {
            // console.log(`Re-run service is inspecting non-passing scenario.`);
            const scenarioLocation = `${world.pickle.uri}:${scenarioLineNumber}`;
            // console.log(`Scenario location: ${scenarioLocation}`);
            const tagsList = world.pickle.tags.map(tag => tag.name);
            // console.log(`Scenario tags: ${tagsList}`);
            const service = this;
            if (this.ignoredTags && tagsList.some(ignoredTag => service.ignoredTags.includes(ignoredTag))) {
                // console.log(`Re-run service will ignore the current scenario since it includes one of the ignored tags: ${this.ignoredTags}`);
            } else {
                this.nonPassingItems.push({ location: scenarioLocation, failure: world.result.message });
            }
        }
    }

    after(result, capabilities, specs) {
        if (this.nonPassingItems.length > 0) {
            fs.writeFileSync(`${this.rerunDataDir}/rerun-${this.serviceWorkerId}.json`, JSON.stringify(this.nonPassingItems));
        } else {
            // console.log('Re-run service did not detect any non-passing scenarios or tests.');
        }
    }

    onComplete(exitCode, config, capabilities, results) {
        const directoryPath = path.join(process.cwd(), `${this.rerunDataDir}`);
        if (fs.existsSync(directoryPath)) {
            const rerunFiles = fs.readdirSync(directoryPath);
            if (rerunFiles.length > 0) {
                let rerunCommand = `DISABLE_RERUN=true node_modules/.bin/wdio ${argv._[0]} `;
                if (this.commandPrefix) {
                    rerunCommand = `${this.commandPrefix} ${rerunCommand}`;
                }
                let failureLocations = [];
                rerunFiles.forEach(file => {
                    const json = JSON.parse(fs.readFileSync(`${this.rerunDataDir}/${file}`));
                    json.forEach(failure => {
                        failureLocations.push(failure.location.replace(/\\/g, "/"));
                    });
                });
                const failureLocationsUnique = [...new Set(failureLocations)];
                failureLocationsUnique.forEach(failureLocation => {
                    rerunCommand += ` --spec=${failureLocation}`;
                });
                fs.writeFileSync(this.rerunScriptPath, rerunCommand);
                console.log(`Re-run script has been generated @ ${this.rerunScriptPath}`);
            }
        } else {
            console.log('Re-run service did not detect any failing tests during the entire test execution.');
        }
    }
}

module.exports = RerunService;
