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
import {Rust} from '../../src/strategies/rust';
import * as sinon from 'sinon';
import {buildGitHubFileContent, assertHasUpdate, dateSafe} from '../helpers';
import {buildMockConventionalCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import {CargoLock} from '../../src/updaters/rust/cargo-lock';
import {CargoToml} from '../../src/updaters/rust/cargo-toml';
import snapshot = require('snap-shot-it');

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

describe('Rust', () => {
  const fixturesPath = './test/fixtures/strategies/rust-workspace';
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'rust-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.0.1';
      const strategy = new Rust({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });

    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new Rust({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'google-cloud-automl'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });

    it('detects a default component', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new Rust({
        targetBranch: 'main',
        github,
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'rust-test-repo'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('Cargo.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Cargo-crate1.toml'));
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
      snapshot(dateSafe(pullRequest!.body.toString()));
    });
  });
});

describe('Rust Crate', () => {
  const fixturesPath = './test/fixtures/strategies/rust';
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'rust-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new Rust({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('Cargo.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Cargo.toml'))
        .withArgs('Cargo.lock', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Cargo.lock'));
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'Cargo.toml', CargoToml);
      const lockUpdate = assertHasUpdate(updates, 'Cargo.lock', CargoLock);

      const lockUpdater = lockUpdate.updater as CargoLock;
      const versionsMaps = lockUpdater.versionsMap;
      expect(versionsMaps.get('rust_test_repo')).to.eql(release?.version);
    });
  });
});

describe('Rust Workspace', () => {
  const fixturesPath = './test/fixtures/strategies/rust-workspace';
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'rust-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new Rust({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('Cargo.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Cargo-workspace.toml'));
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'Cargo.toml', CargoToml);
      assertHasUpdate(updates, 'Cargo.lock', CargoLock);
    });

    it('finds crates from workspace manifest', async () => {
      const strategy = new Rust({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('Cargo.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Cargo-workspace.toml'))
        .withArgs('crates/crate1/Cargo.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Cargo-crate1.toml'))
        .withArgs('crates/crate2/Cargo.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Cargo-crate2.toml'));
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = release!.updates;
      assertHasUpdate(updates, 'crates/crate1/Cargo.toml', CargoToml);
      assertHasUpdate(updates, 'crates/crate2/Cargo.toml', CargoToml);
      assertHasUpdate(updates, 'Cargo.toml', CargoToml);
      assertHasUpdate(updates, 'Cargo.lock', CargoLock);
    });
  });
});
