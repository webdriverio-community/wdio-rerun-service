const fs = require('fs');
const path = require('path');
const { v5: uuidv5 } = require('uuid');

const argv = require('minimist')(process.argv.slice(2));

class RerunService {

    constructor(options) {
        this.options = options;
        this.nonPassingScenarios = [];
        this.serviceWorkerId;
        this.ignoredTags = this.options.ignoredTags ? this.options.ignoredTags : [];
        this.rerunDataDir = this.options.rerunDataDir ? this.options.rerunDataDir : "./results/rerun";
        this.rerunScriptPath = this.options.rerunScriptPath ? this.options.rerunScriptPath : "./rerun.sh";
        this.commandPrefix = this.options.commandPrefix ? this.options.commandPrefix : "";
    }

    before(capabilities, specs) {
        console.log(`Re-run service is activated. Data directory: ${this.rerunDataDir}`);
        fs.mkdir(this.rerunDataDir, { recursive: true }, err => {
            if (err) throw err;
        });
        // INFO: `namespace` below copied from: https://github.com/kelektiv/node-uuid/blob/master//lib/v35.js#L54:16
        this.serviceWorkerId = uuidv5(`${Date.now()}`, '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    }

    afterScenario(uri, feature, scenario, result, sourceLocation, context) {
        if (result.status !== 'passed') {
            console.log(`Re-run service is inspecting non-passing scnario.`);
            let scenarioLocation = `${uri}:${scenario.locations[0].line}`;
            console.log(`Scenario location: ${scenarioLocation}`);
            let tagsList = scenario.tags.map(tag => tag.name);
            console.log(`Scenario location: ${scenarioLocation}`);
            let service = this;
            if (this.ignoredTags && tagsList.some(it => service.ignoredTags.includes(it))) {
                console.log(`Re-run service will ignore the current scenario since it includes one of the ignored tags: ${this.ignoredTags}`);
            } else {
                this.nonPassingScenarios.push({ location: scenarioLocation, failure: result.exception.message });
            }
        }
    }

    after(result, capabilities, specs) {
        if (this.nonPassingScenarios.length > 0) {
            fs.writeFileSync(`${this.rerunDataDir}/rerun-${serviceWorkerId}.json`, JSON.stringify(this.nonPassingScenarios));
        } else {
            console.log('Re-run service did not detect any non-passing scenarios.');
        }
    }

    onComplete(exitCode, config, capabilities, results) {
        const directoryPath = path.join(process.cwd(), `${this.rerunDataDir}`);
        if (fs.existsSync(directoryPath)) {
            let rerunFiles = fs.readdirSync(directoryPath);
            if (rerunFiles.length > 0) {
                let rerunCommand = `DISABLE_RERUN=true wdio ${argv._[0]} `;
                if (this.commandPrefix) {
                    rerunCommand = `${this.commandPrefix} ${rerunCommand}`;
                }
                rerunFiles.forEach(file => {
                    let json = JSON.parse(fs.readFileSync(`${this.rerunDataDir}/${file}`));
                    json.forEach(failure => {
                        rerunCommand += ` --spec=${failure.location}`;
                    });
                });
                fs.writeFileSync(this.rerunScriptPath, rerunCommand);
                console.log(`Re-run script has been generated @ ${this.rerunScriptPath}`);
            }
        } else {
            console.log('Re-run service did not detect any failing or flakey scenarios during the entire test execution.');
        }
    }
};

module.exports = RerunService;
