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
import {RubyYoshi} from '../../src/strategies/ruby-yoshi';
import * as sinon from 'sinon';
import {assertHasUpdate, safeSnapshot} from '../helpers';
import {buildMockConventionalCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import {VersionRB} from '../../src/updaters/ruby/version-rb';

const sandbox = sinon.createSandbox();

const COMMITS = [
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0 (#1234)',
    ['path1/foo.rb']
  ),
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0',
    ['path1/foo.rb', 'path2/bar.rb']
  ),
  ...buildMockConventionalCommit('chore: update common templates'),
];

describe('RubyYoshi', () => {
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
      const expectedVersion = '0.0.1';
      const strategy = new RubyYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = undefined;
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new RubyYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'google-cloud-automl'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
      safeSnapshot(pullRequest!.body.toString());
    });
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new RubyYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = undefined;
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = pullRequest!.updates;
      expect(updates).lengthOf(2);
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'lib/google/cloud/automl/version.rb', VersionRB);
    });
    it('does not add summary to changelog', async () => {
      const strategy = new RubyYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = {
        tag: new TagName(Version.parse('v1.2.3')),
        sha: 'abc123',
        notes: 'some notes',
      };
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = pullRequest!.updates;
      expect(updates).lengthOf(2);
      const {updater} = assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      expect((updater as Changelog).changelogEntry).not.to.contain(
        'Files edited since'
      );
    });
    it('allows overriding version file', async () => {
      const strategy = new RubyYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        versionFile: 'lib/foo/version.rb',
      });
      const latestRelease = undefined;
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = pullRequest!.updates;
      expect(updates).lengthOf(2);
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'lib/foo/version.rb', VersionRB);
    });
    // TODO: add tests for tag separator
    // TODO: add tests for post-processing commit messages
  });
});
