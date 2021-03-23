// Copyright 2020 Google LLC
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

import {describe, it, beforeEach} from 'mocha';

import {expect} from 'chai';
import {Version} from '../../../src/releasers/java/version';

describe('Version', () => {
  describe('parse', () => {
    it('can read a plain semver', async () => {
      const input = '1.23.45';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.extra).to.equal('');
      expect(version.snapshot).to.equal(false);
    });
    it('can read a SNAPSHOT version', async () => {
      const input = '1.23.45-SNAPSHOT';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.extra).to.equal('');
      expect(version.snapshot).to.equal(true);
    });
    it('can read a beta version', async () => {
      const input = '1.23.45-beta';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.extra).to.equal('-beta');
      expect(version.snapshot).to.equal(false);
    });
    it('can read a beta SNAPSHOT version', async () => {
      const input = '1.23.45-beta-SNAPSHOT';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.extra).to.equal('-beta');
      expect(version.snapshot).to.equal(true);
    });
    it('can read an lts version', async () => {
      const input = '1.23.45-sp.1';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.extra).to.equal('');
      expect(version.lts).to.equal(1);
      expect(version.snapshot).to.equal(false);
    });
    it('can read an lts beta version', async () => {
      const input = '1.23.45-beta-sp.1';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.extra).to.equal('-beta');
      expect(version.lts).to.equal(1);
      expect(version.snapshot).to.equal(false);
    });
    it('can read an lts snapshot version', async () => {
      const input = '1.23.45-sp.1-SNAPSHOT';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.extra).to.equal('');
      expect(version.lts).to.equal(1);
      expect(version.snapshot).to.equal(true);
    });
    it('can read an lts beta snapshot version', async () => {
      const input = '1.23.45-beta-sp.1-SNAPSHOT';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.extra).to.equal('-beta');
      expect(version.lts).to.equal(1);
      expect(version.snapshot).to.equal(true);
    });
  });

  describe('bump', () => {
    let version: Version;
    describe('for snapshot version', () => {
      beforeEach(() => {
        version = Version.parse('1.23.45-beta-SNAPSHOT');
      });
      it('should handle major bumps', async () => {
        version.bump('major');
        expect(version.major).to.equal(2);
        expect(version.minor).to.equal(0);
        expect(version.patch).to.equal(0);
        expect(version.extra).to.equal('-beta');
        expect(version.snapshot).to.equal(false);
      });
      it('should handle minor bumps', async () => {
        version.bump('minor');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(24);
        expect(version.patch).to.equal(0);
        expect(version.extra).to.equal('-beta');
        expect(version.snapshot).to.equal(false);
      });
      it('should handle patch bumps', async () => {
        version.bump('patch');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(23);
        expect(version.patch).to.equal(46);
        expect(version.extra).to.equal('-beta');
        expect(version.snapshot).to.equal(false);
      });
      it('should handle snapshot bumps', async () => {
        version.bump('snapshot');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(23);
        expect(version.patch).to.equal(46);
        expect(version.extra).to.equal('-beta');
        expect(version.snapshot).to.equal(true);
      });
    });
    describe('for non-snapshot version', () => {
      beforeEach(() => {
        version = Version.parse('1.23.45-beta');
      });
      it('should handle major bumps', async () => {
        version.bump('major');
        expect(version.major).to.equal(2);
        expect(version.minor).to.equal(0);
        expect(version.patch).to.equal(0);
        expect(version.extra).to.equal('-beta');
        expect(version.snapshot).to.equal(false);
      });
      it('should handle minor bumps', async () => {
        version.bump('minor');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(24);
        expect(version.patch).to.equal(0);
        expect(version.extra).to.equal('-beta');
        expect(version.snapshot).to.equal(false);
      });
      it('should handle patch bumps', async () => {
        version.bump('patch');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(23);
        expect(version.patch).to.equal(46);
        expect(version.extra).to.equal('-beta');
        expect(version.snapshot).to.equal(false);
      });
      it('should handle snapshot bumps', async () => {
        version.bump('snapshot');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(23);
        expect(version.patch).to.equal(46);
        expect(version.extra).to.equal('-beta');
        expect(version.snapshot).to.equal(true);
      });
    });

    describe('LTS', () => {
      it('should make an initial LTS bump', async () => {
        const version = Version.parse('1.23.45').bump('lts');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(23);
        expect(version.patch).to.equal(46);
        expect(version.extra).to.equal('');
        expect(version.lts).to.equal(1);
        expect(version.snapshot).to.equal(false);
        expect(version.toString()).to.equal('1.23.46-sp.1');
      });
      it('should make an initial LTS bump on a SNAPSHOT', async () => {
        const version = Version.parse('1.23.45-SNAPSHOT').bump('lts');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(23);
        expect(version.patch).to.equal(45);
        expect(version.extra).to.equal('');
        expect(version.lts).to.equal(1);
        expect(version.snapshot).to.equal(false);
        expect(version.toString()).to.equal('1.23.45-sp.1');
      });
      it('should make an initial LTS bump on beta version', async () => {
        const version = Version.parse('1.23.45-beta').bump('lts');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(23);
        expect(version.patch).to.equal(46);
        expect(version.extra).to.equal('-beta');
        expect(version.lts).to.equal(1);
        expect(version.snapshot).to.equal(false);
        expect(version.toString()).to.equal('1.23.46-beta-sp.1');
      });
      it('should make a snapshot on an LTS version', async () => {
        const version = Version.parse('1.23.45-beta-sp.1').bump('snapshot');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(23);
        expect(version.patch).to.equal(45);
        expect(version.extra).to.equal('-beta');
        expect(version.lts).to.equal(2);
        expect(version.snapshot).to.equal(true);
        expect(version.toString()).to.equal('1.23.45-beta-sp.2-SNAPSHOT');
      });
      it('should make an LTS bump on an LTS version', async () => {
        const version = Version.parse('1.23.45-beta-sp.1-SNAPSHOT').bump('lts');
        expect(version.major).to.equal(1);
        expect(version.minor).to.equal(23);
        expect(version.patch).to.equal(45);
        expect(version.extra).to.equal('-beta');
        expect(version.lts).to.equal(2);
        expect(version.snapshot).to.equal(false);
        expect(version.toString()).to.equal('1.23.45-beta-sp.2');
      });
    });
  });
});
