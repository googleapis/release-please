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

/* eslint-disable node/no-unsupported-features/node-builtins */

import * as assert from 'assert';
import {describe, it, before, afterEach} from 'mocha';
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {
  Changes,
  FileData,
  CreatePullRequestUserOptions,
} from '../src/util/code-suggester/types';
import {Octokit} from '@octokit/rest';
import {createPullRequest} from '../src/util/code-suggester/index';
import * as branchHandler from '../src/util/code-suggester/github/branch';
import * as forkHandler from '../src/util/code-suggester/github/fork';
import * as commitAndPushHandler from '../src/util/code-suggester/github/commit-and-push';
import * as openPullRequestHandler from '../src/util/code-suggester/github/open-pull-request';
import * as labelsHandler from '../src/util/code-suggester/github/labels';

const sandbox = sinon.createSandbox();

before(() => {
  setup();
});

/* eslint-disable  @typescript-eslint/no-unused-vars */
describe('Make PR main function', () => {
  const upstreamOwner = 'owner';
  const upstreamRepo = 'Hello-World';
  const description = 'custom pr description';
  const branch = 'custom-code-suggestion-branch';
  const title = 'chore: code suggestions custom PR title';
  const force = true;
  const maintainersCanModify = true;
  const message = 'chore: code suggestions custom commit message';
  const primary = 'custom-primary';
  const originRepo = 'Hello-World';
  const originOwner = 'octocat';
  const labelsToAdd = ['automerge'];
  const options: CreatePullRequestUserOptions = {
    upstreamOwner,
    upstreamRepo,
    branch,
    description,
    title,
    force,
    message,
    primary,
    labels: labelsToAdd,
    retry: 0,
  };
  const oldHeadSha = '7fd1a60b01f91b314f59955a4e4d4e80d8edf11d';
  const changes: Changes = new Map();
  changes.set('src/index.ts', new FileData("console.log('new file')"));

  let forkStub: sinon.SinonStub;
  let branchStub: sinon.SinonStub;
  let openPullRequestStub: sinon.SinonStub;
  let commitAndPushStub: sinon.SinonStub;
  let addLabelsStub: sinon.SinonStub;

  beforeEach(() => {
    forkStub = sandbox.stub(forkHandler, 'fork');
    branchStub = sandbox.stub(branchHandler, 'branch');
    commitAndPushStub = sandbox.stub(commitAndPushHandler, 'commitAndPush');
    openPullRequestStub = sandbox.stub(
      openPullRequestHandler,
      'openPullRequest'
    );
    addLabelsStub = sandbox.stub(labelsHandler, 'addLabels');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Returns correct values on success', async () => {
    forkStub.resolves({
      owner: originOwner,
      repo: originRepo,
    });
    branchStub.resolves(oldHeadSha);
    commitAndPushStub.resolves();
    openPullRequestStub.resolves(123);
    addLabelsStub.resolves();

    await createPullRequest(octokit, changes, options);

    sinon.assert.calledWith(forkStub, sinon.match.instanceOf(Octokit), {
      owner: upstreamOwner,
      repo: upstreamRepo,
    });
    sinon.assert.calledWith(
      branchStub,
      sinon.match.instanceOf(Octokit),
      {
        owner: originOwner,
        repo: originRepo,
      },
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
      },
      branch,
      primary
    );
    sinon.assert.calledWith(
      commitAndPushStub,
      sinon.match.instanceOf(Octokit),
      oldHeadSha,
      changes,
      {
        owner: originOwner,
        repo: originRepo,
        branch: branch,
      },
      message
    );
    sinon.assert.calledWith(
      openPullRequestStub,
      sinon.match.instanceOf(Octokit),
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
      },
      {
        owner: originOwner,
        repo: originRepo,
        branch: branch,
      },
      {
        title: title,
        body: description,
      },
      maintainersCanModify,
      primary
    );
    sinon.assert.calledWith(
      addLabelsStub,
      sinon.match.instanceOf(Octokit),
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
      },
      {
        owner: originOwner,
        repo: originRepo,
        branch: branch,
      },
      123,
      labelsToAdd
    );
  });

  it('does not create fork when fork is false', async () => {
    forkStub.rejects('should not call fork');
    branchStub.resolves(oldHeadSha);
    commitAndPushStub.resolves();
    openPullRequestStub.resolves(123);
    addLabelsStub.resolves();

    await createPullRequest(
      octokit,
      changes,
      Object.assign({fork: false}, options)
    );

    sinon.assert.notCalled(forkStub);
    sinon.assert.calledWith(
      branchStub,
      sinon.match.instanceOf(Octokit),
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
      },
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
      },
      branch,
      primary
    );
    sinon.assert.calledWith(
      commitAndPushStub,
      sinon.match.instanceOf(Octokit),
      oldHeadSha,
      changes,
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
        branch: branch,
      },
      message
    );
    sinon.assert.calledWith(
      openPullRequestStub,
      sinon.match.instanceOf(Octokit),
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
      },
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
        branch: branch,
      },
      {
        title: title,
        body: description,
      },
      maintainersCanModify,
      primary
    );
    sinon.assert.calledWith(
      addLabelsStub,
      sinon.match.instanceOf(Octokit),
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
      },
      {
        owner: upstreamOwner,
        repo: upstreamRepo,
        branch: branch,
      },
      123,
      labelsToAdd
    );
  });

  it('Passes up the error message with a throw when create fork helper function fails', async () => {
    const error = new Error('Create fork helper failed');
    forkStub.rejects(error);
    await assert.rejects(createPullRequest(octokit, changes, options), error);
  });
  it('Passes up the error message with a throw when create branch helper fails', async () => {
    forkStub.resolves({
      owner: originOwner,
      repo: originRepo,
    });
    const error = new Error('Create branch helper failed');
    branchStub.rejects(error);
    await assert.rejects(createPullRequest(octokit, changes, options), error);
  });

  it('should respect the retry flag', async () => {
    branchStub.throws('boop');
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    await assert.rejects(
      createPullRequest(octokit, changes, {
        title: 'hello',
        message: 'hello',
        description: 'hello',
        fork: false,
        upstreamOwner: 'googleapis',
        upstreamRepo: 'nodejs-storage',
        retry: 0,
      }),
      /boop/
    );
    sinon.assert.calledOnce(branchStub);
  });

  it('Passes up the error message with a throw when helper commit and push helper function fails', async () => {
    forkStub.resolves({
      owner: originOwner,
      repo: originRepo,
    });
    branchStub.resolves(oldHeadSha);
    const error = new Error('Commit and push helper failed');
    commitAndPushStub.rejects(error);

    await assert.rejects(createPullRequest(octokit, changes, options), error);
  });

  it('Passes up the error message with a throw when helper create pr helper function fails', async () => {
    forkStub.resolves({
      owner: originOwner,
      repo: originRepo,
    });
    branchStub.resolves(oldHeadSha);
    commitAndPushStub.resolves();
    const error = new Error('Create PR helper failed');
    openPullRequestStub.rejects(error);
    await assert.rejects(createPullRequest(octokit, changes, options), error);
  });

  it('Does not execute any GitHub API calls when there are no changes to commit', async () => {
    await createPullRequest(octokit, null, options);
    await createPullRequest(octokit, undefined, options);
    await createPullRequest(octokit, new Map(), options);

    sinon.assert.notCalled(forkStub);
    sinon.assert.notCalled(branchStub);
    sinon.assert.notCalled(commitAndPushStub);
    sinon.assert.notCalled(openPullRequestStub);
    sinon.assert.notCalled(addLabelsStub);
  });
});
