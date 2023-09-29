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
import {CargoToml} from '../../src/updaters/rust/cargo-toml';
import {expect} from 'chai';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';
const FAKE_VERSION = Version.parse('1.2.3');

describe('CargoToml', () => {
  describe('updateContent', () => {
    it('refuses to update without versions', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Cargo.toml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const cargoToml = new CargoToml({
        version: FAKE_VERSION,
      });
      expect(() => {
        cargoToml.updateContent(oldContent);
      }).to.throw();
    });

    it('refuses to update non-package manifests', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Cargo-workspace.toml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map();
      const cargoToml = new CargoToml({
        version: FAKE_VERSION,
        versionsMap: versions,
      });
      expect(() => {
        cargoToml.updateContent(oldContent);
      }).to.throw();
    });

    it('updates the crate version while preserving formatting', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Cargo.toml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const newVersion = Version.parse('14.0.0');
      const versions = new Map();
      versions.set('rust-test-repo', newVersion);
      const cargoToml = new CargoToml({
        version: newVersion,
        versionsMap: versions,
      });
      const newContent = cargoToml.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates (only) path dependencies', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Cargo.toml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const newVersion = Version.parse('12.0.0');
      const versions = new Map();
      versions.set('normal-dep', '2.0.0');
      versions.set('dev-dep', '2.0.0');
      versions.set('dev-dep-2', '2.0.0');
      versions.set('build-dep', '2.0.0');
      versions.set('windows-dep', '2.0.0');
      versions.set('unix-dep', '2.0.0');
      versions.set('x86-dep', '2.0.0');
      versions.set('x86-64-dep', '2.0.0');
      versions.set('foobar-dep', '2.0.0');
      const cargoToml = new CargoToml({
        version: newVersion,
        versionsMap: versions,
      });
      const newContent = cargoToml.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
