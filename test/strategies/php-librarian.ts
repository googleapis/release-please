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
import {PHPLibrarian} from '../../src/strategies/php-librarian';
import * as sinon from 'sinon';
import {
  assertHasUpdate,
  assertNoHasUpdate,
  buildGitHubFileRaw,
  buildMockCommit,
  buildMockConventionalCommit,
} from '../helpers';
import {Changelog} from '../../src/updaters/changelog';
import {RootComposerUpdatePackages} from '../../src/updaters/php/root-composer-update-packages';
import {DefaultUpdater} from '../../src/updaters/default';
import {LibrarianYamlUpdater} from '../../src/updaters/librarian-yaml';
import {Update} from '../../src/update';

const sandbox = sinon.createSandbox();

const COMMITS = [
  ...buildMockConventionalCommit('fix: resolve issue in php client'),
];

describe('PHPLibrarian', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'php-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const strategy = new PHPLibrarian({
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

    it('filters commits by component directory scope across multi-component commits', async () => {
      const getFileStub = sandbox.stub(github, 'getFileContentsOnBranch');
      getFileStub
        .withArgs('Client1/VERSION', 'main')
        .resolves(buildGitHubFileRaw('1.2.3'));
      getFileStub
        .withArgs('Client2/VERSION', 'main')
        .resolves(buildGitHubFileRaw('2.0.0'));
      getFileStub
        .withArgs('Client3/VERSION', 'main')
        .resolves(buildGitHubFileRaw('0.1.2'));
      getFileStub
        .withArgs('Client1/composer.json', 'main')
        .resolves(buildGitHubFileRaw('{"name": "google/client1"}'));
      getFileStub
        .withArgs('Client2/composer.json', 'main')
        .resolves(buildGitHubFileRaw('{"name": "google/client2"}'));
      getFileStub
        .withArgs('Client3/composer.json', 'main')
        .resolves(buildGitHubFileRaw('{"name": "google/client3"}'));

      const commit = buildMockCommit(
        'feat: update API sources and regenerate',
        ['Client1/foo.php', 'Client2/bar.php', 'Client3/baz.php']
      );
      commit.pullRequest = {
        headBranchName: 'chore-update-libraries',
        baseBranchName: 'main',
        number: 9748,
        title: 'feat: update API sources and regenerate',
        labels: [],
        files: [],
        body: [
          'BEGIN_COMMIT_OVERRIDE',
          'feat(Client1): add new RPC to Client1',
          '',
          'docs(Client2): update comments in Client2',
          'END_COMMIT_OVERRIDE',
        ].join('\n'),
      };

      const strategy = new PHPLibrarian({
        targetBranch: 'main',
        github,
      });
      const release = await strategy.buildReleasePullRequest([commit]);
      const updates = release!.updates;

      // Client1 has a feat commit -> minor bump (1.2.3 -> 1.3.0)
      const client1Version = assertHasUpdate(updates, 'Client1/VERSION');
      expect(client1Version.updater.updateContent('')).to.eql('1.3.0\n');

      // Client2 only has a docs commit -> patch bump (2.0.0 -> 2.0.1)
      const client2Version = assertHasUpdate(updates, 'Client2/VERSION');
      expect(client2Version.updater.updateContent('')).to.eql('2.0.1\n');

      // Client3 had no matching scoped commits -> falls back to default feat commit (0.1.2 -> 0.2.0)
      const client3Version = assertHasUpdate(updates, 'Client3/VERSION');
      expect(client3Version.updater.updateContent('')).to.eql('0.2.0\n');

      // Untouched component -> no update
      assertNoHasUpdate(updates, 'Client4/VERSION');

      // Verify release notes do not bleed across components
      const bodyStr = release!.body.toString();
      expect(bodyStr).to.include('<summary>google/client1 1.3.0</summary>');
      expect(bodyStr).to.include('<summary>google/client2 2.0.1</summary>');
      expect(bodyStr).to.include('<summary>google/client3 0.2.0</summary>');

      const client1Section = bodyStr
        .split('<summary>google/client1 1.3.0</summary>')[1]
        .split('</details>')[0];
      expect(client1Section).to.include('add new RPC to Client1');
      expect(client1Section).to.not.include('update comments in Client2');

      const client2Section = bodyStr
        .split('<summary>google/client2 2.0.1</summary>')[1]
        .split('</details>')[0];
      expect(client2Section).to.include('update comments in Client2');
      expect(client2Section).to.not.include('add new RPC to Client1');

      const client3Section = bodyStr
        .split('<summary>google/client3 0.2.0</summary>')[1]
        .split('</details>')[0];
      expect(client3Section).to.include('update API sources and regenerate');
      expect(client3Section).to.not.include('add new RPC to Client1');
      expect(client3Section).to.not.include('update comments in Client2');
    });
  });

  describe('buildUpdates', () => {
    it('builds common php-yoshi files and appends librarian.yaml correctly', async () => {
      const strategy = new PHPLibrarian({
        targetBranch: 'main',
        github,
        component: 'google/cloud-asset',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;

      // Verify standard php-yoshi updates (inherited from PHPYoshi strategy)
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'VERSION', DefaultUpdater);
      assertHasUpdate(updates, 'composer.json', RootComposerUpdatePackages);

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

    it('integration: LibrarianYamlUpdater updates librarian.yaml with new version for matching php component', async () => {
      const strategy = new PHPLibrarian({
        targetBranch: 'main',
        github,
        component: 'google/cloud-asset',
        path: 'Asset',
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

      const originalYaml = `language: php
libraries:
  - name: Asset
    version: 0.8.0
  - name: AutoMl
    version: 0.5.0
`;
      const expectedYaml = `language: php
libraries:
  - name: Asset
    version: 1.0.0
  - name: AutoMl
    version: 0.5.0
`;
      const updatedYaml = librarianUpdate!.updater.updateContent(originalYaml);
      expect(updatedYaml).to.equal(expectedYaml);
    });
  });
});
