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
import {Changelog} from '../../src/updaters/changelog';

const fixturesPath = './test/updaters/fixtures';

describe('ChangelogUpdater', () => {
  describe('updateContent', () => {
    it('inserts content at appropriate location if CHANGELOG exists', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './CHANGELOG.md'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const changelog = new Changelog({
        path: 'CHANGELOG.md',
        changelogEntry: '## 2.0.0\n\n* added a new foo to bar.',
        version: '1.0.0',
        packageName: '@google-cloud/foo',
      });
      const newContent = changelog.updateContent(oldContent);
      snapshot(newContent);
    });

    it('inserts content at appropriate location if CHANGELOG exists, and last release was a patch', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './CHANGELOG-fix.md'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const changelog = new Changelog({
        path: 'CHANGELOG.md',
        changelogEntry: '## 2.0.0\n\n* added a new foo to bar.',
        version: '1.0.0',
        packageName: '@google-cloud/foo',
      });
      const newContent = changelog.updateContent(oldContent);
      snapshot(newContent);
    });

    it('inserts content at appropriate location in yoshi-ruby style CHANGELOG', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './CHANGELOG-ruby.md'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const changelog = new Changelog({
        path: 'CHANGELOG.md',
        changelogEntry: '## 0.7.0\n\n* added a new foo to bar.',
        version: '0.7.0',
        packageName: '@google-cloud/foo',
      });
      const newContent = changelog.updateContent(oldContent);
      snapshot(newContent);
    });

    it('populates a new CHANGELOG if none exists', async () => {
      const changelog = new Changelog({
        path: 'CHANGELOG.md',
        changelogEntry: '## 2.0.0\n\n* added a new foo to bar.',
        version: '1.0.0',
        packageName: 'foo-package',
      });
      const newContent = changelog.updateContent(undefined);
      snapshot(newContent);
    });
  });
});
