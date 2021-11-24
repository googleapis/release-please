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
import {JavaYoshi} from '../../src/strategies/java-yoshi';
import * as sinon from 'sinon';
import {buildGitHubFileContent, assertHasUpdate} from '../helpers';
import {buildMockCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import {JavaUpdate} from '../../src/updaters/java/java-update';
import {VersionsManifest} from '../../src/updaters/java/versions-manifest';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/java-yoshi';

const COMMITS = [
  buildMockCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
  ),
  buildMockCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
  ),
  buildMockCommit('chore: update common templates'),
];

describe('JavaYoshi', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'java-yoshi-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.1.0';
      const strategy = new JavaYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilename').resolves([]);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('versions.txt', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'versions.txt'));
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new JavaYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilename').resolves([]);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('versions.txt', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'versions.txt'));
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'google-cloud-automl'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
    it('returns a snapshot bump PR', async () => {
      const expectedVersion = '0.123.5-SNAPSHOT';
      const strategy = new JavaYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilename').resolves([]);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('versions.txt', 'main')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'versions-released.txt')
        );
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'google-cloud-automl'),
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
      const strategy = new JavaYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilename').resolves([]);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('versions.txt', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'versions.txt'));
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'versions.txt', VersionsManifest);
    });

    it('finds and updates standard files', async () => {
      const strategy = new JavaYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const findFilesStub = sandbox.stub(github, 'findFilesByFilename');
      findFilesStub
        .withArgs('pom.xml', '.')
        .resolves(['path1/pom.xml', 'path2/pom.xml']);
      findFilesStub
        .withArgs('build.gradle', '.')
        .resolves(['path1/build.gradle', 'path2/build.gradle']);
      findFilesStub
        .withArgs('dependencies.properties', '.')
        .resolves(['dependencies.properties']);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('versions.txt', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'versions.txt'));
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'path1/pom.xml', JavaUpdate);
      assertHasUpdate(updates, 'path2/pom.xml', JavaUpdate);
      assertHasUpdate(updates, 'path1/build.gradle', JavaUpdate);
      assertHasUpdate(updates, 'path1/build.gradle', JavaUpdate);
      assertHasUpdate(updates, 'dependencies.properties', JavaUpdate);
      assertHasUpdate(updates, 'versions.txt', VersionsManifest);
    });

    it('finds and updates extra files', async () => {
      const strategy = new JavaYoshi({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: ['foo/bar.java', 'src/version.java'],
      });
      sandbox.stub(github, 'findFilesByFilename').resolves([]);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('versions.txt', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'versions.txt'));
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'foo/bar.java', JavaUpdate);
      assertHasUpdate(updates, 'src/version.java', JavaUpdate);
      assertHasUpdate(updates, 'versions.txt', VersionsManifest);
    });
  });
});
