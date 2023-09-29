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
import {expect} from 'chai';
import {CargoLock} from '../../src/updaters/rust/cargo-lock';
import {parseCargoLockfile} from '../../src/updaters/rust/common';

const fixturesPath = './test/updaters/fixtures';

describe('CargoLock', () => {
  describe('updateContent', () => {
    it('refuses to update something that is not a lockfile', async () => {
      const oldContent = '[woops]\nindeed = true';
      const cargoLock = new CargoLock(new Map());
      expect(() => {
        cargoLock.updateContent(oldContent);
      }).to.throw();
    });

    it('updates the crate version while preserving formatting', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Cargo.lock'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map();
      versions.set('delf', '0.2.0');
      const cargoLock = new CargoLock(versions);
      const newContent = cargoLock.updateContent(oldContent);
      const pkg = parseCargoLockfile(newContent).package![4];
      expect(pkg).to.deep.include({
        name: 'delf',
        version: '0.2.0',
      });
      snapshot(newContent);
    });

    it('silently ignores invalid [[package]] entries', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Cargo-invalid.lock'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map();
      versions.set('delf', '0.2.0');
      const cargoLock = new CargoLock(versions);
      const newContent = cargoLock.updateContent(oldContent);
      const pkg = parseCargoLockfile(newContent).package![0];
      expect(pkg).to.deep.include({
        name: 'delf',
        version: '0.2.0',
      });
      snapshot(newContent);
    });
  });
});
