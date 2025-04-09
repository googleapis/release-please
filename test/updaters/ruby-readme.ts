import {readFileSync} from 'fs';
import {describe, it} from 'mocha';
import {resolve} from 'path';
import {RubyReadMeUpdater} from '../../src/updaters/ruby/readme';
import {Version} from '../../src/version';
import snapshot = require('snap-shot-it');

const fixturesPath = './test/updaters/fixtures';

describe('Ruby README.md', () => {
  describe('updateContent', () => {
    const versions = ['2.1.0', '0.6.0-alpha.1', '0.6.0-beta.2'];

    for (const ver of versions) {
      it(`updates ruby version in README.md - ${ver}`, async () => {
        const oldContent = readFileSync(
          resolve(fixturesPath, './README-ruby-version.md'),
          'utf8'
        ).replace(/\r\n/g, '\n');
        const version = new RubyReadMeUpdater({
          version: Version.parse(ver),
        });
        const newContent = version.updateContent(oldContent);
        snapshot(newContent);
      });
    }
  });
});
