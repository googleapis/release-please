// Copyright 2024 Google LLC
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
import {afterEach, beforeEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';
import {Bazel} from '../../src/strategies/bazel';
import {ModuleBazel} from '../../src/updaters/bazel/module-bazel';
import {Changelog} from '../../src/updaters/changelog';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {assertHasUpdate, buildMockConventionalCommit} from '../helpers';

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

describe('Bazel', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'bazel-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const strategy = new Bazel({
        targetBranch: 'main',
        github,
        component: 'rules_cc',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new Bazel({
        targetBranch: 'main',
        github,
        component: 'rules_cc',
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'rules_cc'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new Bazel({
        targetBranch: 'main',
        github,
        component: 'rules_cc',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'MODULE.bazel', ModuleBazel);
    });
    it('allows configuring the version file', async () => {
      const strategy = new Bazel({
        targetBranch: 'main',
        github,
        component: 'rules_cc',
        versionFile: 'some-path/MODULE.bazel',
        path: 'packages',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'packages/CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'packages/some-path/MODULE.bazel', ModuleBazel);
    });
  });
});
