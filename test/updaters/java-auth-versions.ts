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

import { readFileSync } from 'fs';
import { basename, resolve } from 'path';
import * as snapshot from 'snap-shot-it';

import { VersionsManifest } from '../../src/updaters/java/versions-manifest';
import { UpdateOptions } from '../../src/updaters/update';

const fixturesPath = './test/updaters/fixtures';

describe('JavaAuthVersions', () => {
  describe('updateContent', () => {
    it('updates versions.txt appropriately for non-SNAPSHOT release', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './java-auth-versions.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const javaAuthVersions = new VersionsManifest({
        path: 'versions.txt',
        changelogEntry: '',
        version: '0.25.0',
        packageName: 'google-auth-library',
      });
      const newContent = javaAuthVersions.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates versions.txt appropriately for SNAPSHOT release', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './java-auth-versions.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const javaAuthVersions = new VersionsManifest({
        path: 'versions.txt',
        changelogEntry: '',
        version: '0.16.2-SNAPSHOT',
        packageName: 'google-auth-library-oauth2-http',
      });
      const newContent = javaAuthVersions.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates multiple versions in versions.txt', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './java-auth-versions.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map<string, string>();
      versions.set('google-auth-library', '0.25.0');
      versions.set('google-auth-library-oauth2-http', '0.16.2-SNAPSHOT');
      const javaAuthVersions = new VersionsManifest({
        path: 'versions.txt',
        changelogEntry: '',
        versions,
        version: 'unused',
        packageName: 'used',
      });
      const newContent = javaAuthVersions.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
