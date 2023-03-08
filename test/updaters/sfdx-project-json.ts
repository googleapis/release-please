// Copyright 2023 Google LLC
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
import {Version} from '../../src/version';
import {
  SfdxProjectJson,
  SfdxProjectFile,
} from '../../src/updaters/sfdx/sfdx-project-json';
import {expect} from 'chai';

const fixturesPath = './test/updaters/fixtures/';

describe('SfdxProjectJson', () => {
  describe('updateContent', () => {
    it('updates version in sfdx-project.json', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, 'sfdx-project.json'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map<string, Version>();
      const pom = new SfdxProjectJson({
        versionsMap: versions,
        version: Version.parse('v2.3.4'),
      });
      const newContent = pom.updateContent(oldContent);
      snapshot(newContent);
      const parsedNewContent = JSON.parse(newContent) as SfdxProjectFile;
      expect(parsedNewContent.packageDirectories[0].versionNumber).to.equal(
        '2.3.4.NEXT'
      );
    });
  });
});
