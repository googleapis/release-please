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
import {GoLibrarian} from '../../src/strategies/go-librarian';
import * as sinon from 'sinon';
import {assertHasUpdate} from '../helpers';
import {buildMockConventionalCommit} from '../helpers';
import {Changelog} from '../../src/updaters/changelog';
import {VersionGo} from '../../src/updaters/go/version-go';
import {LibrarianYamlUpdater} from '../../src/updaters/librarian-yaml';
import {Update} from '../../src/update';

const sandbox = sinon.createSandbox();

const COMMITS = [
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
  ),
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
  ),
  ...buildMockConventionalCommit('chore: update common templates'),
];

describe('GoLibrarian', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'go-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const strategy = new GoLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });

    it('returns custom initial release version if initialVersion option is specified', async () => {
      const expectedVersion = '2.0.0';
      const strategy = new GoLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        initialVersion: '2.0.0',
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
    it('builds common files including version file and librarian.yaml', async () => {
      const strategy = new GoLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        versionFile: 'internal/version.go',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGES.md', Changelog);
      assertHasUpdate(updates, 'internal/version.go', VersionGo);
      assertHasUpdate(updates, 'librarian.yaml', LibrarianYamlUpdater);
    });

    it('defaults version file to internal/version.go when not specified', async () => {
      const strategy = new GoLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGES.md', Changelog);
      assertHasUpdate(updates, 'internal/version.go', VersionGo);
      assertHasUpdate(updates, 'librarian.yaml', LibrarianYamlUpdater);
    });

    it('supports custom versionFile paths', async () => {
      const strategy = new GoLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        versionFile: 'custom-version.go',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGES.md', Changelog);
      assertHasUpdate(updates, 'custom-version.go', VersionGo);
      assertHasUpdate(updates, 'librarian.yaml', LibrarianYamlUpdater);
    });

    it('supports custom changelogPath', async () => {
      const strategy = new GoLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        changelogPath: 'CUSTOM_CHANGELOG.md',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CUSTOM_CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'internal/version.go', VersionGo);
      assertHasUpdate(updates, 'librarian.yaml', LibrarianYamlUpdater);
    });

    it('integration: LibrarianYamlUpdater successfully updates librarian.yaml when path is empty (root) by matching component name', async () => {
      const strategy = new GoLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        path: '', // Root level strategy
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

      const originalYaml = `language: go
libraries:
  - name: google-cloud-automl
    version: 1.19.0
`;
      const expectedYaml = `language: go
libraries:
  - name: google-cloud-automl
    version: 1.0.0
`;
      const updatedYaml = librarianUpdate!.updater.updateContent(originalYaml);
      expect(updatedYaml).to.equal(expectedYaml);
    });
  });

  describe('postProcessCommits', () => {
    it('does not filter out commits without a scope', async () => {
      const customGithub = await GitHub.create({
        owner: 'googleapis',
        repo: 'google-cloud-go',
        defaultBranch: 'main',
      });
      const strategy = new GoLibrarian({
        targetBranch: 'main',
        github: customGithub,
        component: 'google-cloud-automl',
      });

      const commitsWithoutScope = [
        ...buildMockConventionalCommit(
          'fix: some root level bugfix without scope'
        ),
      ];

      const processedCommits = await (strategy as any).postProcessCommits(
        commitsWithoutScope
      );
      // Assert that the commit is preserved (unlike GoYoshi which filters it out)
      expect(processedCommits.length).to.equal(1);
      expect(processedCommits[0].message).to.equal(
        'fix: some root level bugfix without scope'
      );
    });
  });
});
