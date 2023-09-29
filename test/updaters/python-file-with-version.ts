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
import snapshot = require('snap-shot-it');
import {describe, it} from 'mocha';
import {PythonFileWithVersion} from '../../src/updaters/python/python-file-with-version';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('version.py', () => {
  describe('updateContent', () => {
    it('updates version in version.py', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './version.py'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new PythonFileWithVersion({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
    it('updates long patch versions in version.py', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './version-with-long-patch.py'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new PythonFileWithVersion({
        version: Version.parse('0.5.11'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});

describe('project/__init__.py', () => {
  describe('updateContent', () => {
    it('updates version in project/__init__.py', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './project/__init__.py'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new PythonFileWithVersion({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});

describe('src/project/__init__.py', () => {
  describe('updateContent', () => {
    it('updates version in src/project/__init__.py', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './src/project/__init__.py'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new PythonFileWithVersion({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
