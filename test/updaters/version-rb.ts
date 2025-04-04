// Copyright 2019 Google LLC
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

import {expect} from 'chai';
import {readFileSync} from 'fs';
import {describe, it} from 'mocha';
import {resolve} from 'path';
import {VersionRB} from '../../src/updaters/ruby/version-rb';
import {Version} from '../../src/version';
import snapshot = require('snap-shot-it');

const fixturesPath = './test/updaters/fixtures';

describe('version.rb', () => {
  describe('updateContent', () => {
    // newVersion, existingContent, expected, shouldUpdate, description
    const testTable: [string, string, string, boolean, string][] = [
      ['0.2.0', "'0.1.0'", "'0.2.0'", true, 'single quotes'],
      ['0.2.0', '"0.1.0"', '"0.2.0"', true, 'double quotes'],
      ['0.2.0', '"0.1.0"', '"0.2.0"', true, 'minor'],
      ['0.2.1', '"0.2.0"', '"0.2.1"', true, 'patch'],
      ['0.2.11', '"0.2.10"', '"0.2.11"', true, 'long patch'],
      ['1.0.0-alpha1', '"0.9.0"', '"1.0.0.pre.alpha1"', true, 'prerelease'],
      [
        '1.0.0-beta',
        '"1.0.0-alpha1"',
        '"1.0.0.pre.beta"',
        true,
        'prerelease bump',
      ],
      ['1.0.0', '"1.0.0.beta"', '"1.0.0"', true, 'major'],
      ['1.0.1', '"1.0.0"', '"1.0.1"', true, 'major patch'],
      ['1.0.0', '"1.0"', '"1.0"', false, 'ignored'],
      ['1.0.0', 'something', 'something', false, 'random text'],
      ['1.0.0', "'0.1'", "'0.1'", false, 'invalid version single quoted'],
      ['1.0.0', '"0.1"', '"0.1"', false, 'invalid version double quoted'],
    ];

    testTable.forEach(
      ([newVersion, existingContent, expected, shouldUpdate, description]) => {
        it(`should ${
          shouldUpdate ? 'update' : 'not update'
        } for ${description}`, () => {
          const version = new VersionRB({
            version: Version.parse(newVersion),
          });
          const result = version.updateContent(existingContent);
          expect(result).to.equal(expected);
        });
      }
    );

    it('updates version in version.rb', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './version.rb'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new VersionRB({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates content with single quotes in version.rb', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './version.rb'),
        'utf8'
      )
        .replace(/\r\n/g, '\n')
        .replace(/"/g, "'");
      const version = new VersionRB({
        version: Version.parse('0.6.0'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates long patch versions in version.rb', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './version-with-long-patch.rb'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new VersionRB({
        version: Version.parse('0.6.11'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('updates prerelease versions in version.rb', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './version-with-prerelease.rb'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new VersionRB({
        version: Version.parse('10.0.0-alpha1'),
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
