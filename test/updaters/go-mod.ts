import {readFileSync} from 'fs';
import {resolve} from 'path';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {Version} from '../../src/version';
import {GoModUpdater} from '../../src/updaters/go/go-mod';

const fixturesPath = './test/updaters/fixtures/go';

describe('GoModUpdater', () => {
  describe('go.mod files', () => {
    const v1File = readFileSync(resolve(fixturesPath, 'go-v1.mod'), 'utf8');
    const v2File = readFileSync(resolve(fixturesPath, 'go-v2.mod'), 'utf8');
    const v3File = readFileSync(resolve(fixturesPath, 'go-v3.mod'), 'utf8');

    it('makes no changes if the old version has a major version of 1 and the new version also has a major version of 1', async () => {
      const importsUpdater = new GoModUpdater({
        version: Version.parse('1.0.0'),
      });
      expect(importsUpdater.updateContent(v1File)).to.equal(v1File);
    });

    it('updates the version in the imports if the old version has a major version of 1 and the new version has a major version of 2', async () => {
      const importsUpdater = new GoModUpdater({
        version: Version.parse('2.0.0'),
      });
      expect(importsUpdater.updateContent(v1File)).to.equal(v2File);
    });

    it('makes no changes if the old version has a major version of 2 and the new version also has a major version of 2', async () => {
      const importsUpdater = new GoModUpdater({
        version: Version.parse('2.0.0'),
      });
      expect(importsUpdater.updateContent(v2File)).to.equal(v2File);
    });

    it('updates the version in the imports if the old version has a major version of 2 and the new version has a major version of 3', async () => {
      const importsUpdater = new GoModUpdater({
        version: Version.parse('3.0.0'),
      });
      expect(importsUpdater.updateContent(v2File)).to.equal(v3File);
    });
  });
});
