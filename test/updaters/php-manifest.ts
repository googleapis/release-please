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
import {PHPManifest} from '../../src/updaters/php/php-manifest';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures/php';

describe('PHPManifest', () => {
  describe('updateContent', () => {
    it('update version in docs manifest', async () => {
      const versions = new Map<string, Version>();
      versions.set('google/access-context-manager', Version.parse('0.2.0'));
      const oldContent = readFileSync(
        resolve(fixturesPath, './manifest.json'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const composer = new PHPManifest({
        version: Version.parse('0.8.0'),
        versionsMap: versions,
      });
      const newContent = composer.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
