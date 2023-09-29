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
import {SamplesPackageJson} from '../../src/updaters/node/samples-package-json';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('SamplesPackageJson', () => {
  describe('updateContent', () => {
    it('updates package version in dependencies', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './samples-package.json'),
        'utf8'
      );
      const samplesPackageJson = new SamplesPackageJson({
        version: Version.parse('14.0.0'),
        packageName: '@google-cloud/firestore',
      });
      const newContent = samplesPackageJson.updateContent(oldContent);
      snapshot(newContent.replace(/\r\n/g, '\n'));
    });

    it('does not fail when top level package does not exist in dependencies', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './samples-package-json-no-dep.json'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const samplesPackageJson = new SamplesPackageJson({
        version: Version.parse('14.0.0'),
        packageName: '@google-cloud/firestore',
      });
      const newContent = samplesPackageJson.updateContent(oldContent);
      snapshot(newContent.replace(/\r\n/g, '\n'));
    });
  });
});
