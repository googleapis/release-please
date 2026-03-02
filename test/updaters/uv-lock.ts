// Copyright 2025 Google LLC
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
import * as TOML from '@iarna/toml';
import {UvLock} from '../../src/updaters/python/uv-lock';
import {Version} from '../../src/version';
import {Logger} from '../../src/util/logger';

const fixturesPath = './test/updaters/fixtures';

function loadFixture(): string {
  return readFileSync(resolve(fixturesPath, 'uv.lock'), 'utf8').replace(
    /\r\n/g,
    '\n'
  );
}

function parsedPackages(content: string): {name?: string; version?: string}[] {
  const parsed = TOML.parse(content) as {
    package?: {name?: string; version?: string}[];
  };
  return parsed.package ?? [];
}

describe('UvLock', () => {
  describe('updateContent', () => {
    it('updates the package version while preserving formatting', () => {
      const oldContent = loadFixture();
      const uvLock = new UvLock({
        packageName: 'socketry',
        version: Version.parse('0.3.0'),
      });
      const newContent = uvLock.updateContent(oldContent);
      const pkg = parsedPackages(newContent).find(p => p.name === 'socketry');
      expect(pkg).to.deep.include({name: 'socketry', version: '0.3.0'});
      snapshot(newContent);
    });

    it('normalizes package name per PEP 508 when matching', () => {
      const oldContent = loadFixture();
      // 'Socketry' should match 'socketry' (case-insensitive)
      const uvLock = new UvLock({
        packageName: 'Socketry',
        version: Version.parse('0.3.0'),
      });
      const newContent = uvLock.updateContent(oldContent);
      const pkg = parsedPackages(newContent).find(p => p.name === 'socketry');
      expect(pkg?.version).to.eql('0.3.0');
    });

    it('warns and returns unchanged content for virtual packages without a version field', () => {
      const oldContent = loadFixture();
      // 'virtual-workspace-member' has no version field in the fixture
      const warnings: string[] = [];
      const mockLogger: Logger = {
        warn: (msg: string) => warnings.push(msg),
        info: () => {},
        error: () => {},
        debug: () => {},
        trace: () => {},
      };
      const uvLock = new UvLock({
        packageName: 'virtual-workspace-member',
        version: Version.parse('1.0.0'),
      });
      const newContent = uvLock.updateContent(oldContent, mockLogger);
      expect(newContent).to.eql(oldContent);
      expect(warnings).to.deep.include(
        'virtual-workspace-member is in uv.lock but has no version field (virtual package); skipping'
      );
    });

    it('normalizes underscores in package name when matching', () => {
      const oldContent = loadFixture();
      // 'my-cool-package' in the lockfile should match 'my_cool_package'
      // after PEP 503 normalization (runs of [-_.] collapse to '-')
      const uvLock = new UvLock({
        packageName: 'my_cool_package',
        version: Version.parse('2.0.0'),
      });
      const newContent = uvLock.updateContent(oldContent);
      const pkg = parsedPackages(newContent).find(
        p => p.name === 'my-cool-package'
      );
      expect(pkg?.version).to.eql('2.0.0');
    });

    it('normalizes dots in package name when matching', () => {
      const oldContent = loadFixture();
      // 'my-cool-package' in the lockfile should match 'my.cool.package'
      // after PEP 503 normalization
      const uvLock = new UvLock({
        packageName: 'my.cool.package',
        version: Version.parse('2.0.0'),
      });
      const newContent = uvLock.updateContent(oldContent);
      const pkg = parsedPackages(newContent).find(
        p => p.name === 'my-cool-package'
      );
      expect(pkg?.version).to.eql('2.0.0');
    });

    it('does not update unrelated dependency entries', () => {
      const oldContent = loadFixture();
      const uvLock = new UvLock({
        packageName: 'socketry',
        version: Version.parse('0.3.0'),
      });
      const newContent = uvLock.updateContent(oldContent);
      const aiohttp = parsedPackages(newContent).find(
        p => p.name === 'aiohttp'
      );
      expect(aiohttp?.version).to.eql('3.13.3');
    });

    it('returns content unchanged when uv.lock has no packages', () => {
      const emptyLockfile = 'version = 1\nrequires-python = ">=3.11"\n';
      const uvLock = new UvLock({
        packageName: 'socketry',
        version: Version.parse('0.3.0'),
      });
      const newContent = uvLock.updateContent(emptyLockfile);
      expect(newContent).to.eql(emptyLockfile);
    });

    it('returns content unchanged when target package is not found', () => {
      const oldContent = loadFixture();
      const uvLock = new UvLock({
        packageName: 'nonexistent-package',
        version: Version.parse('1.0.0'),
      });
      const newContent = uvLock.updateContent(oldContent);
      expect(newContent).to.eql(oldContent);
    });
  });
});
