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
import {expect} from 'chai';
import {CargoToml, parseCargoManifest} from '../../src/updaters/cargo-toml';

const fixturesPath = './test/updaters/fixtures';

describe('CargoToml', () => {
  describe('updateContent', () => {
    it('updates the crate version', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Cargo.toml'),
        'utf8'
      );
      const versions = new Map();
      versions.set('rust-test-repo', '14.0.0');
      const cargoToml = new CargoToml({
        path: 'Cargo.toml',
        changelogEntry: '',
        version: 'unused',
        versions,
        packageName: 'rust-test-repo',
      });
      const newContent = cargoToml.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates (only) path dependencies', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Cargo.toml'),
        'utf8'
      );
      const versions = new Map();
      versions.set('normal-dep', '2.0.0');
      versions.set('dev-dep', '2.0.0');
      versions.set('build-dep', '2.0.0');
      const cargoToml = new CargoToml({
        path: 'Cargo.toml',
        changelogEntry: '',
        version: 'unused',
        versions,
        packageName: 'rust-test-repo',
      });
      const newContent = cargoToml.updateContent(oldContent);
      const parsed = parseCargoManifest(newContent);
      expect(parsed).to.deep.include({
        'build-dependencies': {
          'build-dep': {path: '..', registry: 'private', version: '2.0.0'},
        },
      });
      snapshot(newContent);
    });
  });
});
