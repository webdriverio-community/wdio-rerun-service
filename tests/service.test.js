import RerunService from '../src';

const expect = global.expect;

describe('wdio-rerurn-service', () => {
    
    const nonPassingItems = [ { name: "1", location: "feature/sample.feature:1"}, {name: "2", location: "feature/sample.feature:4"} ];
    const capabilities = { browser: "chrome" };
    const specFile = ["featurs/sample.feature"];

    const world =
    { 
        gherkinDocument: {
            feature: {
                children: [
                    {
                        scenario: {
                            id: 1,
                            location: { line: 3 }
                        }
                    }
                         
                ]
            }
        },
        result: {
            status: 0
        },
        pickle: {
            astNodeIds: ["1"],
            tags: ["@sample"]
        }
    }

    const cucumberBrowser = { config: { framework: "cucumber" }};
    const mochaBrowser = { config: { framework: "mocha" }};

    it('should not throw error when setup with no parameters', () => {
        let service = new RerunService();
        expect(() => service.before(capabilities, specFile)).not.toThrow();
        expect(service.ignoredTags).toEqual([]);
        expect(service.rerunDataDir).toEqual("./results/rerun");
        expect(service.rerunScriptPath).toEqual("./rerun.sh");
        expect(service.commandPrefix).toEqual("");
    })

    it('should throw error when setup bad rereunDataDir', () => {
        let service = new RerunService({rerunDataDir: "\0"});
        expect(() => service.before(capabilities, specFile)).toThrow();
    })

    it('can configure ignoredTags', () => {
        let service = new RerunService({ignoredTags: ["@ignored"]});
        expect(() => service.before({}, ['features/sample.feature'])).not.toThrow();
        expect(service.ignoredTags).toEqual(['@ignored']);
        expect(service.rerunDataDir).toEqual("./results/rerun");
        expect(service.rerunScriptPath).toEqual("./rerun.sh");
        expect(service.commandPrefix).toEqual("");
    })

    it('can configure rerunDataDir', () => {
        let service = new RerunService({rerunDataDir: "./results/custom_rerun_directory"});
        expect(() => service.before({}, ['features/sample.feature'])).not.toThrow();
        expect(service.ignoredTags).toEqual([]);
        expect(service.rerunDataDir).toEqual("./results/custom_rerun_directory");
        expect(service.rerunScriptPath).toEqual("./rerun.sh");
        expect(service.commandPrefix).toEqual("");
    })

    it('can configure rerunScriptPath', () => {
        let service = new RerunService({rerunScriptPath: "./custom_rerun_script.sh"});
        expect(() => service.before({}, ['features/sample.feature'])).not.toThrow();
        expect(service.ignoredTags).toEqual([]);
        expect(service.rerunDataDir).toEqual("./results/rerun");
        expect(service.rerunScriptPath).toEqual("./custom_rerun_script.sh");
        expect(service.commandPrefix).toEqual("");
    })

    it('can configure commandPrefix', () => {
        let service = new RerunService({commandPrefix: "CUSTOM_VAR=true"});
        expect(() => service.before({}, ['features/sample.feature'])).not.toThrow();
        expect(service.ignoredTags).toEqual([]);
        expect(service.rerunDataDir).toEqual("./results/rerun");
        expect(service.rerunScriptPath).toEqual("./rerun.sh");
        expect(service.commandPrefix).toEqual("CUSTOM_VAR=true");
    })

    it('before should throw an exception when no parameters are given', () => {
        let service = new RerunService();
        expect(() => service.before()).toThrow();
    })

    it('afterTest should not throw an exception when parameters are given', () => {
        let service = new RerunService();
        global.browser = mochaBrowser
        expect(() => service.afterTest("test", "context", { error: { message: "This test has failed." }, result: "result", duration: 24213, passed: false, retries: 0 })).not.toThrow();
    })

    it('afterTest should not throw an exception when parameters are given but no error.message', () => {
        let service = new RerunService();
        global.browser = mochaBrowser
        expect(() => service.afterTest("test", "context", { error: {}, result: "result", duration: 24213, passed: false, retries: 0 })).not.toThrow();
    })

    it('afterScenario should throw an exception when no parameters are given', () => {
        let service = new RerunService();
        expect(() => service.afterScenario()).toThrow();
    })

    it('afterScenario should mot throw an exception when parameters are given', () => {
        let service = new RerunService();
        global.browser = cucumberBrowser;
        expect(() => service.afterScenario(world)).not.toThrow();
    })

    it('after should not throw an exception when no parameters are given', () => {
        let service = new RerunService();
        service.nonPassingItems = nonPassingItems;
        service.serviceWorkerId = "123";
        expect(() => service.before(capabilities, specFile)).not.toThrow();
        expect(() => service.after()).not.toThrow();
    })

    it('onComplete should throw an exception when no parameters are given', () => {
        let service = new RerunService({commandPrefix: "CUSTOM_VAR=true"});
        service.nonPassingItems = nonPassingItems;
        expect(() => service.onComplete()).not.toThrow();
    })

    it('onComplete should not throw an exception when no parameters are given and no nonPassingItems', () => {
        let service = new RerunService();
        service.serviceWorkerId = "123";
        expect(() => service.after()).not.toThrow();
    })

    it('before should not throw an exception when empty specFile parameter', () => {
        let service = new RerunService();
        expect(() => service.before({}, [])).not.toThrow();
    })

})