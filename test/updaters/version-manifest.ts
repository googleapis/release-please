/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as snapshot from 'snap-shot-it';

import { VersionsManifest } from '../../src/updaters/java/versions-manifest';
import { expect } from 'chai';

const fixturesPath = './test/updaters/fixtures';

describe('VersionManifest', () => {
  describe('parseVersions', () => {
    it('parses multiple versions in versions.txt', async () => {
      const content = readFileSync(
        resolve(fixturesPath, './versions.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versionsMap = VersionsManifest.parseVersions(content);
      snapshot(versionsMap);
    });
  });

  describe('needsSnapshot', () => {
    it('parses detects a release version', async () => {
      const content = readFileSync(
        resolve(fixturesPath, './versions-release.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      expect(VersionsManifest.needsSnapshot(content)).to.equal(true);
    });

    it('parses detects an existing snapshot version', async () => {
      const content = readFileSync(
        resolve(fixturesPath, './versions.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      expect(VersionsManifest.needsSnapshot(content)).to.equal(false);
    })
  });
});
