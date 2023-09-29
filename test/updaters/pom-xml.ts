// Copyright 2022 Google LLC
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
import {Version} from '../../src/version';
import {PomXml} from '../../src/updaters/java/pom-xml';

const fixturesPath = './test/updaters/fixtures';

describe('PomXml', () => {
  describe('updateContent', () => {
    it('updates project.version', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './pom.xml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new PomXml(Version.parse('v2.3.4'));
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates project.parent.version', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './pom-submodule.xml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new PomXml(Version.parse('v2.3.4'));
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates dependencies', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './pom-with-dependencies.xml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updatedVersions = new Map();
      updatedVersions.set(
        'com.google.auth:google-auth-library-credentials',
        Version.parse('v2.1.3')
      );
      updatedVersions.set('com.google.guava:guava', Version.parse('v1.2.4'));

      const updater = new PomXml(Version.parse('v2.3.4'), updatedVersions);
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });

    it('preserves trailing newlines', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './pom-trailing-newline.xml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new PomXml(Version.parse('v2.3.4'));
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
