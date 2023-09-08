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
import {Expo} from '../../src/strategies/expo';
import {
  buildMockConventionalCommit,
  buildGitHubFileContent,
  assertHasUpdate,
} from '../helpers';
import * as nock from 'nock';
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';
import {Version} from '../../src/version';
import {TagName} from '../../src/util/tag-name';
import {expect} from 'chai';
import {PackageLockJson} from '../../src/updaters/node/package-lock-json';
import {SamplesPackageJson} from '../../src/updaters/node/samples-package-json';
import {Changelog} from '../../src/updaters/changelog';
import {PackageJson} from '../../src/updaters/node/package-json';
import {AppJson} from '../../src/updaters/expo/app-json';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const expoFixturesPath = './test/fixtures/strategies/expo';

describe('Expo', () => {
  let github: GitHub;
  const commits = [
    ...buildMockConventionalCommit(
      'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
    ),
  ];

  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'node-test-repo',
      defaultBranch: 'main',
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.0.1';

      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(buildGitHubFileContent(expoFixturesPath, 'package.json'));

      const strategy = new Expo({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        packageName: 'google-cloud-automl',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits,
        latestRelease,
      });
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });

    it('builds a release pull request', async () => {
      const expectedVersion = '0.123.5';

      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(buildGitHubFileContent(expoFixturesPath, 'package.json'));

      const strategy = new Expo({
        targetBranch: 'main',
        github,
        component: 'some-node-package',
        packageName: 'some-node-package',
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'some-node-package'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const pullRequest = await strategy.buildReleasePullRequest({
        commits,
        latestRelease,
      });
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
    });

    it('detects a default component', async () => {
      const expectedVersion = '0.123.5';

      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(buildGitHubFileContent(expoFixturesPath, 'package.json'));

      const strategy = new Expo({
        targetBranch: 'main',
        github,
      });
      const commits = [
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
        ),
      ];
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'node-test-repo'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const pullRequest = await strategy.buildReleasePullRequest({
        commits,
        latestRelease,
      });
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
    });

    it('detects a default packageName', async () => {
      const expectedVersion = '0.123.5';

      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(buildGitHubFileContent(expoFixturesPath, 'package.json'));

      const strategy = new Expo({
        targetBranch: 'main',
        github,
        component: 'abc-123',
      });
      const commits = [
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
        ),
      ];
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'node-test-repo'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const pullRequest = await strategy.buildReleasePullRequest({
        commits,
        latestRelease,
      });
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
    });
  });

  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(buildGitHubFileContent(expoFixturesPath, 'package.json'));

      const strategy = new Expo({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        packageName: 'google-cloud-automl-pkg',
      });
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits,
        latestRelease,
      });
      const updates = release!.updates;

      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'package-lock.json', PackageLockJson);
      assertHasUpdate(updates, 'npm-shrinkwrap.json', PackageLockJson);
      const update = assertHasUpdate(
        updates,
        'samples/package.json',
        SamplesPackageJson
      );
      const updater = update.updater as SamplesPackageJson;
      expect(updater.packageName).to.equal('google-cloud-automl-pkg');
      assertHasUpdate(updates, 'package.json', PackageJson);

      const appUpdate = assertHasUpdate(updates, 'app.json', AppJson);
      const expoSDKVersion = (appUpdate.updater as AppJson).expoSDKVersion;
      expect(expoSDKVersion.major).to.equal(44);
      expect(expoSDKVersion.minor).to.equal(0);
      expect(expoSDKVersion.patch).to.equal(0);
    });
  });
});
