// Copyright 2024 Google LLC
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
import {describe, it} from 'mocha';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import {ModuleBazel} from '../../src/updaters/bazel/module-bazel';
import {Version} from '../../src/version';
import {assert} from 'chai';

const fixturesPath = './test/updaters/fixtures';

describe('ModuleBazel', () => {
  describe('updateContent', () => {
    it('updates version in MODULE.bazel file', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './MODULE.bazel'),
        'utf8'
      ).replace(/\r\n/g, '\n'); // required for windows
      const version = new ModuleBazel({
        version: Version.parse('0.0.5'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates version when inline', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './MODULE-inline.bazel'),
        'utf8'
      ).replace(/\r\n/g, '\n'); // required for windows
      const version = new ModuleBazel({
        version: Version.parse('0.0.5'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates version when ordered improperly', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './MODULE-order.bazel'),
        'utf8'
      ).replace(/\r\n/g, '\n'); // required for windows
      const version = new ModuleBazel({
        version: Version.parse('0.0.5'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('leaves the version file alone if the version is missing', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './MODULE-missing.bazel'),
        'utf8'
      ).replace(/\r\n/g, '\n'); // required for windows
      const version = new ModuleBazel({
        version: Version.parse('0.0.5'),
      });
      const newContent = version.updateContent(oldContent);
      assert(oldContent === newContent);
    });
  });
});
