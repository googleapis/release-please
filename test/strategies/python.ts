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
import {Python} from '../../src/strategies/python';
import * as sinon from 'sinon';
import {buildGitHubFileContent, assertHasUpdate} from '../helpers';
import {buildMockCommit} from '../helpers';
import {PythonFileWithVersion} from '../../src/updaters/python/python-file-with-version';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {PyProjectToml} from '../../src/updaters/python/pyproject-toml';
import {SetupCfg} from '../../src/updaters/python/setup-cfg';
import {SetupPy} from '../../src/updaters/python/setup-py';
import {Changelog} from '../../src/updaters/changelog';

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

describe('Python', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'py-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.1.0';
      const strategy = new Python({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilename').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new Python({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilename').resolves([]);
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
      const strategy = new Python({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilename').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'setup.cfg', SetupCfg);
      assertHasUpdate(updates, 'setup.py', SetupPy);
      assertHasUpdate(
        updates,
        'google-cloud-automl/__init__.py',
        PythonFileWithVersion
      );
      assertHasUpdate(
        updates,
        'src/google-cloud-automl/__init__.py',
        PythonFileWithVersion
      );
    });

    it('finds and updates a pyproject.toml', async () => {
      const strategy = new Python({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .resolves(
          buildGitHubFileContent('./test/updaters/fixtures', 'pyproject.toml')
        );
      sandbox.stub(github, 'findFilesByFilename').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'pyproject.toml', PyProjectToml);
    });

    it('finds and updates a version.py file', async () => {
      const strategy = new Python({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilename').resolves(['src/version.py']);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'src/version.py', PythonFileWithVersion);
    });
  });
});
