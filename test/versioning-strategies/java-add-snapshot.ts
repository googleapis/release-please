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

import {describe, it} from 'mocha';

import {expect} from 'chai';
import {Version} from '../../src/version';
import {JavaAddSnapshot} from '../../src/versioning-strategies/java-add-snapshot';
import {DefaultVersioningStrategy} from '../../src/versioning-strategies/default';
import {ServicePackVersioningStrategy} from '../../src/versioning-strategies/service-pack';
import {AlwaysBumpPatch} from '../../src/versioning-strategies/always-bump-patch';

describe('JavaAddSnapshot', () => {
  describe('with DefaultVersioning', () => {
    it('should bump to snapshot', async () => {
      const strategy = new JavaAddSnapshot(new DefaultVersioningStrategy({}));
      const oldVersion = Version.parse('1.2.3');
      const newVersion = await strategy.bump(oldVersion, []);
      expect(newVersion.toString()).to.equal('1.2.4-SNAPSHOT');
    });
  });

  describe('with ServicePack', () => {
    it('should bump to snapshot', async () => {
      const strategy = new JavaAddSnapshot(
        new ServicePackVersioningStrategy({})
      );
      const oldVersion = Version.parse('1.2.3');
      const newVersion = await strategy.bump(oldVersion, []);
      expect(newVersion.toString()).to.equal('1.2.3-sp.1-SNAPSHOT');
    });

    it('can bump to next snapshot', async () => {
      const strategy = new JavaAddSnapshot(
        new ServicePackVersioningStrategy({})
      );
      const oldVersion = Version.parse('1.2.3-sp.1');
      const newVersion = await strategy.bump(oldVersion, []);
      expect(newVersion.toString()).to.equal('1.2.3-sp.2-SNAPSHOT');
    });
  });

  describe('with AlwaysBumpPatch', () => {
    it('should bump to snapshot', async () => {
      const strategy = new JavaAddSnapshot(new AlwaysBumpPatch({}));
      const oldVersion = Version.parse('1.2.3');
      const newVersion = await strategy.bump(oldVersion, []);
      expect(newVersion.toString()).to.equal('1.2.4-SNAPSHOT');
    });
  });
});
