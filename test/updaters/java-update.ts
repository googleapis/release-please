// Copyright 2021 Google LLC
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
import snapshot = require('snap-shot-it');
import {describe, it} from 'mocha';
import {JavaUpdate} from '../../src/updaters/java/java-update';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('JavaUpdate', () => {
  describe('updateContent', () => {
    it('updates an LTS snapshot version', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './pom-java-lts-snapshot.xml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map<string, Version>();
      versions.set('google-auth-library-parent', Version.parse('v0.16.2-sp.1'));
      const updater = new JavaUpdate({
        versionsMap: versions,
        version: Version.parse('v0.16.2-sp.1'),
      });
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
    it('only updates current versions for snapshots', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './java-replacements-test.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map<string, Version>();
      versions.set('module-name', Version.parse('3.3.3'));
      const updater = new JavaUpdate({
        versionsMap: versions,
        version: Version.parse('3.3.3'),
        isSnapshot: true,
      });
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
    it('updates all versions for non snapshots', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './java-replacements-test.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map<string, Version>();
      versions.set('module-name', Version.parse('3.3.3'));
      const updater = new JavaUpdate({
        versionsMap: versions,
        version: Version.parse('3.3.3'),
      });
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
