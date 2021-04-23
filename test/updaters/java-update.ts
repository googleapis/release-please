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
import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {JavaUpdate} from '../../src/updaters/java/java_update';

const fixturesPath = './test/updaters/fixtures';

describe('JavaUpdate', () => {
  describe('updateContent', () => {
    it('updates an LTS snapshot version', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './pom-java-lts-snapshot.xml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map<string, string>();
      versions.set('google-auth-library-parent', 'v0.16.2-sp.1');
      const pom = new JavaUpdate({
        path: 'pom.xml',
        changelogEntry: '',
        versions,
        version: 'unused',
        packageName: 'unused',
      });
      const newContent = pom.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
