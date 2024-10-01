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
import {Go} from '../../src/strategies/go';
import * as sinon from 'sinon';
import {assertHasUpdate, buildGitHubFileContent} from '../helpers';
import {buildMockConventionalCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import {GithubImportsGo} from '../../src/updaters/go/github-imports-go';

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

describe('Go', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'go-test-repo',
      defaultBranch: 'main',
    });

    sandbox
      .stub(github, 'findFilesByGlobAndRef')
      .withArgs('**/*.go', 'main')
      .resolves(['file-with-imports-v2.go'])
      .withArgs('**/*.md', 'main')
      .resolves([]);
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.0.1';
      const strategy = new Go({
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
      const strategy = new Go({
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
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new Go({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
    });

    it('finds and updates a go file with an import', async () => {
      const strategy = new Go({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(
          buildGitHubFileContent(
            './test/updaters/fixtures',
            'file-with-imports-v2.go'
          )
        );
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = release!.updates;
      assertHasUpdate(updates, 'file-with-imports-v2.go', GithubImportsGo);
    });
  });
});
