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

import {readFileSync} from 'fs';
import {resolve} from 'path';
import snapshot = require('snap-shot-it');
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {GemfileLock} from '../../src/updaters/ruby/gemfile-lock';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('Gemfile.lock', () => {
  describe('updateContent', () => {
    // gemName, newVersion, existingContent, expected, shouldUpdate, description
    // prettier-ignore
    const testTable: [string, string, string, string, boolean, string][] = [
      ['foo', '0.2.0', 'foo (0.1.0)', 'foo (0.2.0)', true, 'minor'],
      ['foo', '0.2.1', 'foo (0.2.0)', 'foo (0.2.1)', true, 'patch'],
      ['foo', '0.2.11', 'foo (0.2.1)', 'foo (0.2.11)', true, 'long patch'],
      ['foo', '0.3.0-alpha1', 'foo (0.2.0)', 'foo (0.3.0.pre.alpha1)', true, 'prerelease'],
      ['foo', '0.3.0-alpha2', 'foo (0.3.0.pre.alpha1)', 'foo (0.3.0.pre.alpha2)', true, 'prerelease bump'],
      ['foo', '1.0.0-beta', 'foo (0.3.0.pre.alpha2)', 'foo (1.0.0.pre.beta)', true, 'beta'],
      ['foo', '1.0.0', 'foo (1.0.0.beta)', 'foo (1.0.0)', true, 'major'],
      ['foo', '2.0.22', 'foo (1.0.0)', 'foo (2.0.22)', true, 'major bump with long patch'],
      ['foo', '2.0.22', 'foo (1.0.0-alpha1)', 'foo (2.0.22)', true, 'update semantic version'],
      ['foo', '1.0.0', 'something', 'something', false, 'text to ignore'],
      ['foo', '1.0.0', 'foo 1.0.0', 'foo 1.0.0', false, 'no parantheses around version'],
      ['foo', '1.0.0', 'barfoo (1.0.0)', 'barfoo (1.0.0)', false, 'prefixed gem name'],
      ['foo', '1.0.0', 'foobar (0.1.0)', 'foobar (0.1.0)', false, 'suffixed gem name'],
      ['', '1.0.0', 'foobar (0.1.0)', 'foobar (0.1.0)', false, 'empty gem name'],
    ];

    testTable.forEach(
      ([
        gemName,
        newVersion,
        existingContent,
        expected,
        shouldUpdate,
        description,
      ]) => {
        it(`should ${
          shouldUpdate ? 'update' : 'not update'
        } for ${description}`, () => {
          const version = new GemfileLock({
            version: Version.parse(newVersion),
            gemName,
          });
          const result = version.updateContent(existingContent);
          expect(result).to.equal(expected);
        });
      }
    );

    it('does not update anything if gem name is not provided', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Gemfile.lock'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new GemfileLock({
        version: Version.parse('0.2.0'),
        gemName: '',
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates version in Gemfile.lock', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Gemfile.lock'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new GemfileLock({
        version: Version.parse('0.2.0'),
        gemName: 'foo',
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates prerelease in Gemfile.lock', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Gemfile.lock'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new GemfileLock({
        version: Version.parse('0.2.0-alpha'),
        gemName: 'foo',
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
