const fs = require('fs');
const path = require('path');
const { v5: uuidv5 } = require('uuid');

const argv = require('minimist')(process.argv.slice(2));

class RerunService {

    constructor({ ignoredTags, rerunDataDir, rerunScriptPath, commandPrefix, customParameters } = {}) {
        this.nonPassingItems = [];
        this.serviceWorkerId;
        this.ignoredTags = ignoredTags || [];
        this.rerunDataDir = rerunDataDir || "./results/rerun";
        this.rerunScriptPath = rerunScriptPath || "./rerun.sh";
        this.commandPrefix = commandPrefix || "";
        this.customParameters = customParameters || "";
        this.specFile = "";
    }

    before(capabilities, specs) {
        this.specFile = specs[0];
        // console.log(`Re-run service is activated. Data directory: ${this.rerunDataDir}`);
        fs.mkdirSync(this.rerunDataDir, { recursive: true });
        // INFO: `namespace` below copied from: https://github.com/kelektiv/node-uuid/blob/master//lib/v35.js#L54:16
        this.serviceWorkerId = uuidv5(`${Date.now()}`, '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    }

    afterTest(test, context, { error, result, duration, passed, retries }) {
        if (browser.config.framework !== 'cucumber' && !passed) {
            // console.log(`Re-run service is inspecting non-passing test.`);
            // console.log(`Test location: ${this.specFile}`);
            if (error && error.message) {
                this.nonPassingItems.push({ location: this.specFile, failure: error.message });
            } else {
                // console.log("The non-passing test did not contain any error message, it could not be added for re-run.")
            }
        }
    }

    // Executed after a Cucumber scenario ends.
    afterScenario(world, result, context) {
        const CUCUMBER_STATUS_MAP = ['UNKNOWN', 'PASSED', 'SKIPPED', 'PENDING', 'UNDEFINED', 'AMBIGUOUS', 'FAILED']
        const status = typeof world.result.status === 'number' ? CUCUMBER_STATUS_MAP[world.result.status || 0] : world.result.status;
        const scenario = world.gherkinDocument.feature.children.filter(child => {
          if (child.scenario) {
            return child.scenario && world.pickle.astNodeIds.includes(child.scenario.id.toString());
          }
        })[0].scenario;
    
        let scenarioLineNumber = scenario.location.line;
    
        if (scenario.examples && scenario.examples.length > 0) {
          let exampleLineNumber = 0;
          scenario.examples.find(example =>
            example.tableBody.find(row => {
              if (row.id === world.pickle.astNodeIds[1]) {
                exampleLineNumber = row.location.line;
                return true;
              } else {
                return false;
              }
            })
          )
    
          scenarioLineNumber = exampleLineNumber;
        }
        
        if (browser.config.framework === 'cucumber' && (status !== 'PASSED' && status !== 'SKIPPED')) {
            const scenarioLocation = `${world.pickle.uri}:${scenarioLineNumber}`;
            const tagsList = world.pickle.tags.map(tag => tag.name);
            const service = this;
            if (this.ignoredTags && !tagsList.some(ignoredTag => service.ignoredTags.includes(ignoredTag))) {
                this.nonPassingItems.push({
                    location: scenarioLocation,
                    failure: world.result.message
                });
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
                let rerunCommand = `${this.commandPrefix} DISABLE_RERUN=true node_modules/.bin/wdio ${argv._[0]} ${this.customParameters} `;
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
                // console.log(`Re-run script has been generated @ ${this.rerunScriptPath}`);
            }
        }
    }
};

module.exports = RerunService;
