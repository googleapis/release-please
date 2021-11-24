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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {expect} from 'chai';
import {GitHub} from '../../src/github';
import {PHPYoshi} from '../../src/strategies/php-yoshi';
import * as sinon from 'sinon';
import {assertHasUpdate, buildGitHubFileRaw, dateSafe} from '../helpers';
import {buildMockCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import {RootComposerUpdatePackages} from '../../src/updaters/php/root-composer-update-packages';
import {PHPManifest} from '../../src/updaters/php/php-manifest';
import {PHPClientVersion} from '../../src/updaters/php/php-client-version';
import {DefaultUpdater} from '../../src/updaters/default';
import snapshot = require('snap-shot-it');

const sandbox = sinon.createSandbox();

describe('PHPYoshi', () => {
  let github: GitHub;
  let getFileStub: sinon.SinonStub;
  const commits = [
    buildMockCommit(
      'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0',
      ['Client1/foo.php']
    ),
    buildMockCommit(
      'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0',
      ['Client2/foo.php', 'Client3/bar.php']
    ),
    buildMockCommit('chore: update common templates'),
  ];
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'php-yoshi-test-repo',
      defaultBranch: 'main',
    });
    getFileStub = sandbox.stub(github, 'getFileContentsOnBranch');
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
      .resolves(
        buildGitHubFileRaw(
          '{"name": "google/client3", "extra": {"component": {"entry": "src/Entry.php"}}}'
        )
      );
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const strategy = new PHPYoshi({
        targetBranch: 'main',
        github,
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
      snapshot(dateSafe(release!.body.toString()));
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new PHPYoshi({
        targetBranch: 'main',
        github,
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'google-cloud-automl'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
      snapshot(dateSafe(release!.body.toString()));
    });
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new PHPYoshi({
        targetBranch: 'main',
        github,
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'composer.json', RootComposerUpdatePackages);
      assertHasUpdate(updates, 'docs/manifest.json', PHPManifest);
      assertHasUpdate(updates, 'src/Version.php', PHPClientVersion);
      assertHasUpdate(updates, 'src/ServiceBuilder.php', PHPClientVersion);
    });
    it('finds touched components', async () => {
      const strategy = new PHPYoshi({
        targetBranch: 'main',
        github,
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'Client1/VERSION', DefaultUpdater);
      assertHasUpdate(updates, 'Client2/VERSION', DefaultUpdater);
      assertHasUpdate(updates, 'Client3/VERSION', DefaultUpdater);
      assertHasUpdate(updates, 'Client3/src/Entry.php', PHPClientVersion);
    });
  });
});
