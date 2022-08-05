import {it} from "mocha";
import {RootComposerUpdatePackages} from "../../src/updaters/php/root-composer-update-packages";
import {Version, VersionsMap} from "../../src/version";
import {readFileSync} from "fs";
import {resolve} from "path";
import * as snapshot from "snap-shot-it";
import {expect} from "chai";

const fixturesPath = './test/updaters/fixtures/php';

describe('PHPComposer', () => {
    describe('updateContent', () => {
        it.only('update version in composer.json', async () => {
            const oldContent = readFileSync(
                resolve(fixturesPath, './composer.json'),
                'utf8'
            )

            const version = Version.parse('1.0.0');

            const versionsMap: VersionsMap = new Map();

            versionsMap.set('version', version);

            const newContent = new RootComposerUpdatePackages({version, versionsMap}).updateContent(oldContent);

            expect(newContent).to.contain('1.0.0');

            snapshot(newContent);
        });
    });
});
