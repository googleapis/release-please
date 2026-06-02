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
import {PythonLibrarian} from '../../src/strategies/python-librarian';
import * as sinon from 'sinon';
import {buildGitHubFileContent, assertHasUpdate} from '../helpers';
import {buildMockConventionalCommit} from '../helpers';
import {SetupPy} from '../../src/updaters/python/setup-py';
import {LibrarianYamlUpdater} from '../../src/updaters/python/librarian-yaml';
import {Version} from '../../src/version';
import {TagName} from '../../src/util/tag-name';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/python';
const COMMITS = [
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
  ),
];

describe('PythonLibrarian', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'python-librarian-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.1.0';
      const strategy = new PythonLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(buildGitHubFileContent(fixturesPath, 'setup.py'));
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
      const strategy = new PythonLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(buildGitHubFileContent(fixturesPath, 'setup.py'));
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
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
    it('builds common files and appends librarian.yaml correctly', async () => {
      const strategy = new PythonLibrarian({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(buildGitHubFileContent(fixturesPath, 'setup.py'));
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;

      // Verify that standard python updates are generated (inherited from Python strategy)
      assertHasUpdate(updates, 'setup.py', SetupPy);

      // Verify that librarian.yaml is correctly registered as an update
      const update = assertHasUpdate(
        updates,
        'librarian.yaml',
        LibrarianYamlUpdater
      );
      expect(update.createIfMissing).to.be.false;

      // Verify updater is correctly configured
      const updater = update.updater as LibrarianYamlUpdater;
      expect(updater.version?.toString()).to.eql('0.1.0');
      expect((updater as any).packagePath).to.eql('.');
    });
  });
});
