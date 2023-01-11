import RerunService from '../src';
import fs from 'fs';

const expect = global.expect;
const world = JSON.parse(fs.readFileSync('./tests/scenario.outline.world.json'));

describe('wdio-rerurn-service', () => {
    
    const capabilities = { browser: "chrome" };
    const specFile = ["tests/scenario.outline.feature"];

    const cucumberBrowser = { config: { framework: "cucumber" }};

    it('should generate line number at the row of example data', () => {
        let service = new RerunService();
        global.browser = cucumberBrowser;
        service.before(capabilities, specFile);
        service.afterScenario(world);
        expect(service.nonPassingItems[0].location).toEqual("tests/scenario.outline.feature:12");
    })

})
