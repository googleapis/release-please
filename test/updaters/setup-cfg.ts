// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {SetupCfg} from '../../src/updaters/python/setup-cfg';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('setup.cfg', () => {
  describe('updateContent', () => {
    it('updates version in setup.cfg', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './setup.cfg'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new SetupCfg({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
    it('updates big version in setup.cfg', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './setup-big-version.cfg'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new SetupCfg({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
    it('updates dot-separated prerelease versions in setup.cfg', async () => {
      const oldContent = '[metadata]\nname = my-pkg\nversion = 1.1.0-alpha.1\n';
      const prerelease = new SetupCfg({
        version: Version.parse('1.1.0-alpha.2'),
      });
      expect(prerelease.updateContent(oldContent)).to.equal(
        '[metadata]\nname = my-pkg\nversion = 1.1.0-alpha.2\n'
      );
      const release = new SetupCfg({
        version: Version.parse('1.1.0'),
      });
      expect(release.updateContent(oldContent)).to.equal(
        '[metadata]\nname = my-pkg\nversion = 1.1.0\n'
      );
    });
  });
});
