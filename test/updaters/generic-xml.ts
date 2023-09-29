// Copyright 2022 Google LLC
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
import {Version} from '../../src/version';
import {GenericXml} from '../../src/updaters/generic-xml';
import {expect} from 'chai';

const fixturesPath = './test/updaters/fixtures';

describe('GenericXml', () => {
  describe('updateContent', () => {
    it('updates matching entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Foo.csproj'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericXml(
        '//Project/PropertyGroup/Version',
        Version.parse('v2.3.4')
      );
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
    it('ignores non-matching entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Foo.csproj'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericXml(
        '//project/nonExistent',
        Version.parse('v2.3.4')
      );
      const newContent = updater.updateContent(oldContent);
      expect(newContent).to.eql(oldContent);
    });
    it('updates matching attribute', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Foo.csproj'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericXml('//Project/@Sdk', Version.parse('v2.3.4'));
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
