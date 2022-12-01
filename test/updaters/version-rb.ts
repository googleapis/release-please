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
import {VersionRB} from '../../src/updaters/ruby/version-rb';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('version.rb', () => {
  describe('updateContent', () => {
    it('updates version in version.rb', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './version.rb'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new VersionRB({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates content with single quotes in version.rb', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './version.rb'),
        'utf8'
      )
        .replace(/\r\n/g, '\n')
        .replace(/"/g, "'");
      const version = new VersionRB({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates long patch versions in version.rb', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './version-with-long-patch.rb'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new VersionRB({
        version: Version.parse('0.6.11'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
