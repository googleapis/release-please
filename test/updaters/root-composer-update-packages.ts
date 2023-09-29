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
import snapshot = require('snap-shot-it');
import {describe, it} from 'mocha';
import {RootComposerUpdatePackages} from '../../src/updaters/php/root-composer-update-packages';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('composer-update-package.json', () => {
  describe('updateContent', () => {
    it('updates all versions in root composer file', async () => {
      const versions = new Map<string, Version>();
      versions.set('google/cloud-automl', Version.parse('0.8.0'));
      versions.set('google/cloud-talent', Version.parse('1.0.0'));
      const oldContent = readFileSync(
        resolve(fixturesPath, './composer-update-packages.json'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const composer = new RootComposerUpdatePackages({
        version: Version.parse('1.0.0'),
        versionsMap: versions,
      });
      const newContent = composer.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
