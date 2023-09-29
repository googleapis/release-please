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
import {expect, assert} from 'chai';
import {GenericYaml} from '../../src/updaters/generic-yaml';

const fixturesPath = './test/updaters/fixtures';

describe('GenericYaml', () => {
  describe('updateContent', () => {
    it('updates matching entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './helm/Chart.yaml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericYaml('$.version', Version.parse('v2.3.4'));
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
    it('updates deep entry in json', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './package-lock-v2.json'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericYaml(
        '$.packages..version',
        Version.parse('v2.3.4')
      );
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
    it('updates deep entry in yaml', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './helm/Chart.yaml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericYaml(
        '$.dependencies..version',
        Version.parse('v2.3.4')
      );
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
    it('ignores non-matching entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './helm/Chart.yaml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericYaml('$.nonExistent', Version.parse('v2.3.4'));
      const newContent = updater.updateContent(oldContent);
      expect(newContent).to.eql(oldContent);
    });
    it('warns on invalid jsonpath', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './helm/Chart.yaml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericYaml('bad jsonpath', Version.parse('v2.3.4'));
      assert.throws(() => {
        updater.updateContent(oldContent);
      });
    });
    it('ignores invalid file', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './yaml/invalid.txt'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericYaml('$.boo', Version.parse('v2.3.4'));
      const newContent = updater.updateContent(oldContent);
      expect(newContent).to.eql(oldContent);
    });
    it('updates multi-document yaml', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './yaml/multi.yaml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new GenericYaml('$.version', Version.parse('v2.3.4'));
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
