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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {expect} from 'chai';
import {GitHub} from '../../src/github';
import {Julia} from '../../src/strategies/julia';
import * as sinon from 'sinon';
import {
  buildGitHubFileContent,
  assertHasUpdate,
  assertNoHasUpdate,
} from '../helpers';
import {buildMockConventionalCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {JuliaProjectToml} from '../../src/updaters/julia/project-toml';
import {Changelog} from '../../src/updaters/changelog';
import {ChangelogJson} from '../../src/updaters/changelog-json';
import * as snapshot from 'snap-shot-it';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/julia';

const UUID_REGEX =
  /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
const ISO_DATE_REGEX =
  /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z/g; // 2023-01-05T16:42:33.446Z

const COMMITS = [
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
  ),
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
  ),
  ...buildMockConventionalCommit('chore: update common templates'),
];

describe('Julia', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'julia-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.1.0';
      const strategy = new Julia({
        targetBranch: 'main',
        github,
        component: 'ReleasePleaseJuliaStrategy',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new Julia({
        targetBranch: 'main',
        github,
        component: 'ReleasePleaseJuliaStrategy',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = {
        tag: new TagName(
          Version.parse('0.123.4'),
          'ReleasePleaseJuliaStrategy'
        ),
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
      const strategy = new Julia({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'Project.toml', JuliaProjectToml);
    });

    it('omits changelog if skipChangelog=true', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
        component: 'ReleasePleaseJuliaStrategy',
        skipChangelog: true,
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertNoHasUpdate(updates, 'CHANGELOG.md');
      assertHasUpdate(updates, 'Project.toml', JuliaProjectToml);
    });

    it('finds and updates a Project.toml', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
        component: 'ReleasePleaseJuliaStrategy',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(
          buildGitHubFileContent('./test/updaters/fixtures', 'Project.toml')
        );
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'Project.toml', JuliaProjectToml);
    });
    it('finds and updates a JuliaProject.toml', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
        component: 'ReleasePleaseJuliaStrategy',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(
          buildGitHubFileContent(
            './test/updaters/fixtures',
            'JuliaProject.toml'
          )
        );
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'JuliaProject.toml', JuliaProjectToml);
    });
  });
});
