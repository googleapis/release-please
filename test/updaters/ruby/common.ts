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

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {
  resolveRubyGemfileLockVersion,
  stringifyRubyVersion,
} from '../../../src/updaters/ruby/common';
import {Version} from '../../../src/version';

describe('ruby-common', () => {
  describe('resolveRubyGemfileLockVersion', () => {
    // input, expected
    const testTable: [string, string][] = [
      ['0.0.0', '0.0.0'],
      ['1.2.3', '1.2.3'],
      ['15.10.22', '15.10.22'],
      ['1.0.0-alpha', '1.0.0.pre.alpha'],
      ['1.0.0-alpha1', '1.0.0.pre.alpha1'],
      ['2.0.0-rc1', '2.0.0.pre.rc1'],
    ];

    testTable.forEach(([input, expected]) => {
      it(`${input} should resolve to ${expected}`, () => {
        expect(
          resolveRubyGemfileLockVersion(Version.parse(input).toString())
        ).to.equal(expected);
      });
    });
  });

  describe('stringifyRubyVersion', () => {
    // input, expected
    const testTable: [string, string][] = [
      ['0.2.0', '0.2.0'],
      ['1.2.3', '1.2.3'],
      ['1.2.10', '1.2.10'],
      ['15.10.22', '15.10.22'],
      ['1.0.0-alpha', '1.0.0.pre.alpha'],
      ['1.0.0-alpha1', '1.0.0.pre.alpha1'],
      ['2.0.0-rc1', '2.0.0.pre.rc1'],
    ];

    testTable.forEach(([input, expected]) => {
      it(`${input} should equal ${expected}`, () => {
        expect(stringifyRubyVersion(Version.parse(input))).to.equal(expected);
      });
    });

    describe('combined with resolve resolveRubyGemfileLockVersion', () => {
      // input, expected
      const testTable: [string, string][] = [
        ['0.2.0', '0.2.0'],
        ['1.2.3', '1.2.3'],
        ['1.2.10', '1.2.10'],
        ['15.10.22', '15.10.22'],
        ['1.0.0-alpha', '1.0.0.pre.alpha'],
        ['1.0.0-alpha1', '1.0.0.pre.alpha1'],
        ['2.0.0-rc1', '2.0.0.pre.rc1'],
      ];

      testTable.forEach(([input, expected]) => {
        it(`${input} combined with resolveRubyGemfileLockVersion should equal ${expected}`, () => {
          const versionString = stringifyRubyVersion(Version.parse(input));
          expect(resolveRubyGemfileLockVersion(versionString)).to.equal(
            expected
          );
        });
      });
    });

    describe('with dot prelease seperator', () => {
      const testTable: [string, string][] = [
        ['0.2.0', '0.2.0'],
        ['1.2.3', '1.2.3'],
        ['1.2.10', '1.2.10'],
        ['15.10.22', '15.10.22'],
        ['1.0.0-alpha', '1.0.0.pre.alpha'],
        ['1.0.0-alpha1', '1.0.0.pre.alpha1'],
        ['2.0.0-beta', '2.0.0.pre.beta'],
        ['2.0.0-rc1', '2.0.0.pre.rc1'],
      ];

      testTable.forEach(([input, expected]) => {
        it(`${input} should equal ${expected}`, () => {
          expect(stringifyRubyVersion(Version.parse(input), true)).to.equal(
            expected
          );
        });

        it(`${input} combined with resolveRubyGemfileLockVersion should equal ${expected}`, () => {
          const versionString = stringifyRubyVersion(
            Version.parse(input),
            true
          );
          expect(resolveRubyGemfileLockVersion(versionString)).to.equal(
            expected
          );
        });
      });
    });
  });
});
