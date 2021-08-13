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
import {RootComposerUpdatePackage} from '../../src/updaters/root-composer-update-package';

const fixturesPath = './test/updaters/fixtures';

describe('composer-update-package.json', () => {
  describe('updateContent', () => {
    it('update version in root composer file', async () => {
      const versions = new Map<string, string>();
      versions.set('version', '0.8.0');
      const oldContent = readFileSync(
        resolve(fixturesPath, './composer-update-package.json'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const composer = new RootComposerUpdatePackage({
        path: 'version',
        version: '0.8.0',
        changelogEntry: '',
        versions,
        packageName: '',
      });
      const newContent = composer.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
