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
import snapshot = require('snap-shot-it');
import {describe, it} from 'mocha';
import {Version} from '../../../src/version';
import {CsProj} from '../../../src/updaters/dotnet/csproj';

const fixturesPath = './test/updaters/fixtures';
const FAKE_VERSION = Version.parse('1.2.3');

describe('CsProj', () => {
  describe('updateContent', () => {
    it('updates a csproj file', () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Foo.csproj'),
        'utf-8'
      ).replace(/\r\n/g, '\n');
      const updater = new CsProj({
        version: FAKE_VERSION,
      });
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
    it('updates a prerelease version', () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Prerelease.csproj'),
        'utf-8'
      ).replace(/\r\n/g, '\n');
      const updater = new CsProj({
        version: FAKE_VERSION,
      });
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
