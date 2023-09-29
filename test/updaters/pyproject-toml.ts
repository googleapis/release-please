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
import {PyProjectToml} from '../../src/updaters/python/pyproject-toml';
import {expect} from 'chai';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('PyProjectToml', () => {
  it('refuses to update something that is not a valid pyproject', async () => {
    const oldContent = '[woops]\nindeed = true';
    const pyProject = new PyProjectToml({
      version: Version.parse('0.6.0'),
    });
    expect(() => {
      pyProject.updateContent(oldContent);
    }).to.throw();
  });

  it('refuses to update when version is missing', async () => {
    const oldContent = "[project]\nname = 'project'";
    const pyProject = new PyProjectToml({
      version: Version.parse('0.6.0'),
    });
    expect(() => {
      pyProject.updateContent(oldContent);
    }).to.throw();
  });
});

describe('pyproject-project.toml', () => {
  describe('updateContent', () => {
    it('updates version in pyproject-project.toml', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './pyproject-project.toml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new PyProjectToml({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});

describe('pyproject-poetry.toml', () => {
  describe('updateContent', () => {
    it('updates version in pyproject-poetry.toml', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './pyproject-poetry.toml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new PyProjectToml({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
