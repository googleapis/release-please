// Copyright 2020 Google LLC
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

import * as assert from 'assert';
import {describe, it, afterEach} from 'mocha';
import {expect} from 'chai';
import {GitHub, GitHubFileContents} from '../../src/github';
import {Node} from '../../src/releasers/node';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {buildGitHubFileContent, buildMockCommit} from './utils';

const sandbox = sinon.createSandbox();

function buildFileContent(fixture: string): GitHubFileContents {
  return buildGitHubFileContent('./test/releasers/fixtures/node', fixture);
}

function mockRequest(releasePR: Node) {
  sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('master');

  // No open release PRs, so create a new release PR
  sandbox.stub(releasePR.gh, 'findOpenReleasePRs').returns(Promise.resolve([]));

  sandbox
    .stub(releasePR.gh, 'findMergedReleasePR')
    .returns(Promise.resolve(undefined));

  sandbox.stub(releasePR.gh, 'latestTag').returns(
    Promise.resolve({
      name: 'v0.123.4',
      sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
      version: '0.123.4',
    })
  );

  sandbox
    .stub(releasePR.gh, 'commitsSinceSha')
    .resolves([
      buildMockCommit(
        'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
      ),
      buildMockCommit(
        'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
      ),
      buildMockCommit('chore: update common templates'),
    ]);

  sandbox.stub(releasePR.gh, 'addLabels');
}

describe('Node', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('creates a release PR without package-lock.json', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-testno-package-lock-repo',
        apiUrl: 'https://api.github.com',
      });

      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      mockRequest(releasePR);
      const getFileContentsStub = sandbox.stub(
        releasePR.gh,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'master')
        .resolves(buildFileContent('package.json'));
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('creates a release PR with package-lock.json', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
      });

      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );

      mockRequest(releasePR);
      const getFileContentsStub = sandbox.stub(
        releasePR.gh,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'master')
        .resolves(buildFileContent('package.json'));
      getFileContentsStub
        .withArgs('package-lock.json', 'master')
        .resolves(buildFileContent('package-lock.json'));
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      await releasePR.run();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('creates release PR relative to a path', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
        path: 'packages/foo',
      });

      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      mockRequest(releasePR);

      const getFileContentsStub = sandbox.stub(
        releasePR.gh,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('packages/foo/package.json', 'master')
        .resolves(buildFileContent('package.json'));
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );
      await releasePR.run();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('does not support snapshot releases', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
        snapshot: true,
      });
      const pr = await releasePR.run();
      assert.strictEqual(pr, undefined);
    });
  });

  describe('lookupPackageName', () => {
    it('finds package name in package.json', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});

      sandbox.stub(github, 'getDefaultBranch').resolves('master');
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'master')
        .resolves(buildFileContent('package.json'));
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      const expectedPackageName = await Node.lookupPackageName(github);
      expect(expectedPackageName).to.equal('node-test-repo');
    });

    it('finds package name in submodule package.json', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});

      sandbox.stub(github, 'getDefaultBranch').resolves('master');
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('some-path/package.json', 'master')
        .resolves(buildFileContent('package.json'));
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      const expectedPackageName = await Node.lookupPackageName(
        github,
        'some-path'
      );
      expect(expectedPackageName).to.equal('node-test-repo');
    });
  });
});
