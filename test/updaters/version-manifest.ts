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
import {VersionsManifest} from '../../src/updaters/java/versions-manifest';
import {expect} from 'chai';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('VersionManifest', () => {
  describe('parseVersions', () => {
    it('parses multiple versions in versions.txt', async () => {
      const content = readFileSync(
        resolve(fixturesPath, './versions.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versionsMap = VersionsManifest.parseVersions(content);
      expect(versionsMap.get('google-cloud-trace')?.toString()).to.equal(
        '0.108.0-beta'
      );
      expect(
        versionsMap.get('grpc-google-cloud-trace-v1')?.toString()
      ).to.equal('0.73.0');
      expect(
        versionsMap.get('grpc-google-cloud-trace-v2')?.toString()
      ).to.equal('0.73.0');
      expect(
        versionsMap.get('proto-google-cloud-trace-v1')?.toString()
      ).to.equal('0.73.0');
      expect(
        versionsMap.get('grpc-google-cloud-trace-v2')?.toString()
      ).to.equal('0.73.0');
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
    });
  });

  describe('updateContent', () => {
    it('updates versions.txt with snapshot released version', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './versions-double-snapshot.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map<string, Version>();
      versions.set('google-cloud-trace', Version.parse('0.109.0'));
      versions.set('grpc-google-cloud-trace-v1', Version.parse('0.74.0'));
      const javaAuthVersions = new VersionsManifest({
        versionsMap: versions,
        version: Version.parse('1.2.3'),
      });
      const newContent = javaAuthVersions.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
