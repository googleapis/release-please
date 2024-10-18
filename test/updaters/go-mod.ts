import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {Version} from '../../src/version';
import {GoMod} from '../../src/updaters/go/go-mod';

const fixturesPath = './test/updaters/fixtures/go';

describe('go.mod', () => {
  describe('updateContent', () => {
    it('refuses to update without versions', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './go.mod'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GoMod({
        version: Version.parse('v2.3.4'),
      });
      expect(() => {
        updater.updateContent(oldContent);
      }).to.throw();
    });
    it('updates dependencies', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './go.mod'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updatedVersions = new Map();
      updatedVersions.set('example.com/foo/bar', Version.parse('v2.1.3'));
      updatedVersions.set(
        'github.com/stretchr/testify',
        Version.parse('v1.2.4')
      );

      const updater = new GoMod({
        version: Version.parse('v2.3.4'),
        versionsMap: updatedVersions,
      });
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
