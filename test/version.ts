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
import {Version} from '../src/version';

describe('Version', () => {
  describe('parse', () => {
    it('can read a plain semver', async () => {
      const input = '1.23.45';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).is.undefined;
      expect(version.build).is.undefined;
      expect(version.toString()).to.equal(input);
    });
    it('can read a SNAPSHOT version', async () => {
      const input = '1.23.45-SNAPSHOT';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).to.equal('SNAPSHOT');
      expect(version.build).is.undefined;
      expect(version.toString()).to.equal(input);
    });
    it('can read a beta version', async () => {
      const input = '1.23.45-beta';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).to.equal('beta');
      expect(version.build).is.undefined;
      expect(version.toString()).to.equal(input);
    });
    it('can read a beta SNAPSHOT version', async () => {
      const input = '1.23.45-beta-SNAPSHOT';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).to.equal('beta-SNAPSHOT');
      expect(version.build).is.undefined;
      expect(version.toString()).to.equal(input);
    });
    it('can read an lts version', async () => {
      const input = '1.23.45-sp.1';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).to.equal('sp.1');
      expect(version.build).is.undefined;
      expect(version.toString()).to.equal(input);
    });
    it('can read an lts beta version', async () => {
      const input = '1.23.45-beta-sp.1';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).to.equal('beta-sp.1');
      expect(version.build).is.undefined;
      expect(version.toString()).to.equal(input);
    });
    it('can read an lts snapshot version', async () => {
      const input = '1.23.45-sp.1-SNAPSHOT';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).to.equal('sp.1-SNAPSHOT');
      expect(version.build).is.undefined;
      expect(version.toString()).to.equal(input);
    });
    it('can read an lts beta snapshot version', async () => {
      const input = '1.23.45-beta-sp.1-SNAPSHOT';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).to.equal('beta-sp.1-SNAPSHOT');
      expect(version.toString()).to.equal(input);
    });
    it('can read a plain semver with build', async () => {
      const input = '1.23.45+678';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).is.undefined;
      expect(version.build).to.equal('678');
      expect(version.toString()).to.equal(input);
    });
    it('can read a plain semver with alphanumeric build', async () => {
      const input = '1.23.45+678abc';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).is.undefined;
      expect(version.build).to.equal('678abc');
      expect(version.toString()).to.equal(input);
    });
    it('can read a semver with pre-release and build', async () => {
      const input = '1.23.45-beta.123+678';
      const version = Version.parse(input);
      expect(version.major).to.equal(1);
      expect(version.minor).to.equal(23);
      expect(version.patch).to.equal(45);
      expect(version.preRelease).to.equal('beta.123');
      expect(version.build).to.equal('678');
      expect(version.toString()).to.equal(input);
    });
  });
  describe('compare', () => {
    it('should handle pre-release versions', () => {
      const comparison = Version.parse('1.2.3').compare(
        Version.parse('1.2.3-alpha')
      );
      expect(comparison).to.eql(1);
    });
    it('should sort in ascending order using compare', () => {
      const input = [
        Version.parse('1.2.3'),
        Version.parse('1.2.3-alpha'),
        Version.parse('2.2.0'),
      ];
      const output = input.sort((a, b) => a.compare(b));
      expect(output.map(version => version.toString())).to.eql([
        '1.2.3-alpha',
        '1.2.3',
        '2.2.0',
      ]);
    });
  });
  describe('isPreMajor', () => {
    it('should return true for versions < 1.0.0', () => {
      expect(Version.parse('0.1.0').isPreMajor).to.be.true;
    });
    it('should return false for versions >= 1.0.0', () => {
      expect(Version.parse('1.0.0').isPreMajor).to.be.false;
    });
  });
});
