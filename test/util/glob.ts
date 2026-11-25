// Copyright 2026 Google LLC
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
  globToRegex,
  normalizePathPrefix,
  relativizePaths,
} from '../../src/util/glob';

describe('glob', () => {
  describe('normalizePathPrefix', () => {
    it('strips leading and trailing slashes', () => {
      expect(normalizePathPrefix('/packages/a/')).to.eql('packages/a');
      expect(normalizePathPrefix('packages\\a\\')).to.eql('packages\\a');
    });
    it('treats missing and root prefixes as empty', () => {
      expect(normalizePathPrefix()).to.eql('');
      expect(normalizePathPrefix('')).to.eql('');
      expect(normalizePathPrefix('.')).to.eql('');
    });
  });

  describe('relativizePaths', () => {
    it('keeps paths without a prefix', () => {
      expect(relativizePaths(['a', 'b/c'], '')).to.eql(['a', 'b/c']);
    });
    it('filters and relativizes paths under the prefix', () => {
      expect(
        relativizePaths(['pkg', 'pkg/a.json', 'pkg2/b.json', 'pkg/c/d'], 'pkg')
      ).to.eql(['a.json', 'c/d']);
    });
  });

  describe('globToRegex', () => {
    it('matches single path segments with *', () => {
      const regex = globToRegex('*.json');
      expect(regex.test('package.json')).to.be.true;
      expect(regex.test('a/package.json')).to.be.false;
    });
    it('matches nested paths with **', () => {
      const regex = globToRegex('**/*.xml');
      expect(regex.test('pom.xml')).to.be.true;
      expect(regex.test('a/b/pom.xml')).to.be.true;
      expect(regex.test('a/b/pom.json')).to.be.false;
    });
    it('matches single characters with ?', () => {
      const regex = globToRegex('v?.txt');
      expect(regex.test('v1.txt')).to.be.true;
      expect(regex.test('v10.txt')).to.be.false;
    });
    it('escapes regular expression characters', () => {
      expect(globToRegex('a+b.(c)').test('a+b.(c)')).to.be.true;
      expect(globToRegex('a+b.(c)').test('aab.c')).to.be.false;
    });
  });
});
