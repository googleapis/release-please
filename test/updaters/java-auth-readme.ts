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
import {Readme} from '../../src/updaters/java/readme';

const fixturesPath = './test/updaters/fixtures';

describe('JavaAuthReadme', () => {
  describe('updateContent', () => {
    it('updates version examples in README.md', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './java-auth-readme.md'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const javaAuthReadme = new Readme({
        path: 'README.md',
        changelogEntry: '',
        version: '0.20.0',
        packageName: 'google-auth-library-oauth2-http',
      });
      const newContent = javaAuthReadme.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates multiple version examples in README.md', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './java-multiple-versions-readme.md'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map<string, string>();
      versions.set('google-auth-library-oauth2-http', '0.20.0');
      versions.set('google-auth-library-credentials', '0.30.0');
      const javaAuthReadme = new Readme({
        path: 'README.md',
        changelogEntry: '',
        versions,
        version: 'unused',
        packageName: 'unused',
      });
      const newContent = javaAuthReadme.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
