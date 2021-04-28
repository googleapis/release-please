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
import {PackageLockJson} from '../../src/updaters/package-lock-json';

const fixturesPath = './test/updaters/fixtures';

describe('PackageLockJson', () => {
  describe('updateContent v1', () => {
    it('updates the package version', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './package-lock-v1.json'),
        'utf8'
      );
      const packageJson = new PackageLockJson({
        path: 'package-lock.json',
        changelogEntry: '',
        version: '14.0.0',
        packageName: '@google-cloud/foo',
      });
      const newContent = packageJson.updateContent(oldContent);
      snapshot(newContent);
    });
  });

  describe('updateContent v2', () => {
    it('updates the package version', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './package-lock-v2.json'),
        'utf8'
      );
      const packageJson = new PackageLockJson({
        path: 'package-lock.json',
        changelogEntry: '',
        version: '14.0.0',
        packageName: '@google-cloud/foo',
      });
      const newContent = packageJson.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
