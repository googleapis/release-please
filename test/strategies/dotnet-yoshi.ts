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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {expect} from 'chai';
import {GitHub} from '../../src/github';
import {DotnetYoshi} from '../../src/strategies/dotnet-yoshi';
import * as sinon from 'sinon';
import {assertHasUpdate, safeSnapshot} from '../helpers';
import {buildMockCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Changelog} from '../../src/updaters/changelog';
import {PullRequestBody} from '../../src/util/pull-request-body';
import {Apis} from '../../src/updaters/dotnet/apis';
import {CsProj} from '../../src/updaters/dotnet/csproj';

const sandbox = sinon.createSandbox();

const COMMITS = [
  buildMockCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
  ),
  buildMockCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
  ),
  buildMockCommit('chore: update common templates'),
];

describe('DotnetYoshi', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'google-cloud-dotnet',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const expectedTitle =
        'Release Google.Cloud.SecurityCenter.V1 version 1.0.0';
      const strategy = new DotnetYoshi({
        targetBranch: 'main',
        github,
        component: 'Google.Cloud.SecurityCenter.V1',
      });
      const latestRelease = undefined;
      const pullRequest = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
      expect(pullRequest?.title.toString()).to.eql(expectedTitle);
      safeSnapshot(pullRequest!.body.toString());
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const expectedTitle =
        'Release Google.Cloud.SecurityCenter.V1 version 0.123.5';
      const strategy = new DotnetYoshi({
        targetBranch: 'main',
        github,
        component: 'Google.Cloud.SecurityCenter.V1',
      });
      const latestRelease = {
        tag: TagName.parse('Google.Cloud.SecurityCenter.V1-0.123.4')!,
        sha: 'abc123',
        notes: 'some notes',
      };
      const pullRequest = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
      expect(pullRequest?.title.toString()).to.eql(expectedTitle);
      safeSnapshot(pullRequest!.body.toString());
    });
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new DotnetYoshi({
        targetBranch: 'main',
        github,
        path: 'apis/Google.Cloud.SecurityCenter.V1',
        component: 'Google.Cloud.SecurityCenter.V1',
      });
      const latestRelease = undefined;
      const pullRequest = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = pullRequest!.updates;
      expect(updates).lengthOf(3);
      const changelogUpdate = assertHasUpdate(
        updates,
        'apis/Google.Cloud.SecurityCenter.V1/docs/history.md',
        Changelog
      );
      assertHasUpdate(
        updates,
        'apis/Google.Cloud.SecurityCenter.V1/Google.Cloud.SecurityCenter.V1.csproj',
        CsProj
      );
      assertHasUpdate(updates, 'apis/apis.json', Apis);
      safeSnapshot((changelogUpdate.updater as Changelog).changelogEntry);
    });
  });
  describe('buildRelease', () => {
    it('overrides the tag separator', async () => {
      const expectedReleaseTag = 'Google.Cloud.SecurityCenter.V1-0.123.5';
      const strategy = new DotnetYoshi({
        targetBranch: 'main',
        github,
        path: 'apis/Google.Cloud.SecurityCenter.V1',
        component: 'Google.Cloud.SecurityCenter.V1',
      });
      const release = await strategy.buildRelease({
        title: 'Release Google.Cloud.SecurityCenter.V1 version 0.123.5',
        headBranchName:
          'release-please--branches--main--component--Google.Cloud.SecurityCenter.V1',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql(expectedReleaseTag);
    });
  });
});
