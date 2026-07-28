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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {expect} from 'chai';
import {GitHub} from '../../src/github';
import {RubyLibrarian} from '../../src/strategies/ruby-librarian';
import * as sinon from 'sinon';
import {assertHasUpdate, buildMockConventionalCommit} from '../helpers';
import {Changelog} from '../../src/updaters/changelog';
import {VersionRB} from '../../src/updaters/ruby/version-rb';
import {GemfileLock} from '../../src/updaters/ruby/gemfile-lock';
import {LibrarianYamlUpdater} from '../../src/updaters/librarian-yaml';
import {Update} from '../../src/update';

const sandbox = sinon.createSandbox();

const COMMITS = [
  ...buildMockConventionalCommit('fix: resolve issue in ruby client'),
];

describe('RubyLibrarian', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'ruby-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const strategy = new RubyLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-asset',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
  });

  describe('buildUpdates', () => {
    it('builds common ruby files and appends librarian.yaml correctly', async () => {
      const strategy = new RubyLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-asset',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;

      // Verify standard ruby updates (inherited from Ruby strategy)
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'lib/google/cloud/asset/version.rb', VersionRB);
      assertHasUpdate(updates, 'Gemfile.lock', GemfileLock);

      // Verify librarian.yaml is correctly registered as an update
      const update = assertHasUpdate(
        updates,
        'librarian.yaml',
        LibrarianYamlUpdater
      );
      expect(update.createIfMissing).to.be.false;

      // Verify updater is correctly configured
      const updater = update.updater as LibrarianYamlUpdater;
      expect(updater.version?.toString()).to.eql('1.0.0');
      expect((updater as any).packagePath).to.eql('.');
    });

    it('integration: LibrarianYamlUpdater updates librarian.yaml with new version for matching gem component', async () => {
      const strategy = new RubyLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-asset-v1',
        path: 'google-cloud-asset-v1',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      const librarianUpdate = updates.find(
        (u: Update) => u.path === 'librarian.yaml'
      );
      expect(librarianUpdate).to.not.be.undefined;

      const originalYaml = `language: ruby
libraries:
  - name: google-cloud-asset-v1
    version: 0.5.0
`;
      const expectedYaml = `language: ruby
libraries:
  - name: google-cloud-asset-v1
    version: 1.0.0
`;
      const updatedYaml = librarianUpdate!.updater.updateContent(originalYaml);
      expect(updatedYaml).to.equal(expectedYaml);
    });
  });
});
