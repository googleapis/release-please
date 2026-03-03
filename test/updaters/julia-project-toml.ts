// Copyright 2025 Google LLC
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
import {JuliaProjectToml} from '../../src/updaters/julia/project-toml';
import {expect} from 'chai';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('ProjectToml', () => {
  it('refuses to update something that is not a valid project', async () => {
    const oldContent = '[woops]\nindeed = true';
    const juliaProject = new JuliaProjectToml({
      version: Version.parse('0.6.0'),
    });
    expect(() => {
      juliaProject.updateContent(oldContent);
    }).to.throw();
  });

  it('refuses to update when version is missing', async () => {
    const oldContent = "[project]\nname = 'project'";
    const juliaProject = new JuliaProjectToml({
      version: Version.parse('0.6.0'),
    });
    expect(() => {
      juliaProject.updateContent(oldContent);
    }).to.throw();
  });
});

describe('JuliaProject.toml', () => {
  describe('updateContent', () => {
    it('updates version in JuliaProject.toml', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './JuliaProject.toml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new JuliaProjectToml({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
