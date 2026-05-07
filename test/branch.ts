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

import {describe, it, before, afterEach} from 'mocha';
import * as assert from 'assert';
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {promises as fsp} from 'fs';
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';
import {getBranchHead, branch, createRef} from '../src/util/code-suggester/github/branch';

type GetBranchResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.repos.getBranch
>;

type GetRefResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.git.getRef
>;

type CreateRefResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.git.createRef
>;

before(() => {
  setup();
});

describe('Branch', () => {
  const testErrorMessage = 'test-error-message';
  const sandbox = sinon.createSandbox();
  const origin = {owner: 'octocat', repo: 'HelloWorld'};
  const upstream = {owner: 'octocat-upstream', repo: 'HelloWorld-upstream'};
  const branchName = 'test-branch';
  afterEach(() => {
    sandbox.restore();
  });
  it('invokes octokit get branch with correct parameters, invokes octokit correctly, and returns the HEAD sha', async () => {
    // setup
    const branchResponseBody = JSON.parse(
      (
        await fsp.readFile('./test/fixtures/get-branch-response.json')
      ).toString()
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    } as GetBranchResponse;

    const getBranchStub = sandbox
      .stub(octokit.repos, 'getBranch')
      .resolves(branchResponse);
    // // tests
    const headSHA = await getBranchHead(octokit, origin, 'main');
    assert.strictEqual(headSHA, branchResponse.data.commit.sha);
    sandbox.assert.calledOnceWithExactly(getBranchStub, {
      owner: origin.owner,
      repo: origin.repo,
      branch: 'main',
    });
  });

  it('The create branch function returns the primary SHA when create branching is successful', async () => {
    // setup
    const branchResponseBody = JSON.parse(
      (
        await fsp.readFile('./test/fixtures/get-branch-response.json')
      ).toString()
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    } as GetBranchResponse;
    const createRefResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: {
        ref: 'refs/heads/test-branch',
        node_id: 'MDM6UmVmMjc0NzM5ODIwOnJlZnMvaGVhZHMvVGVzdC1icmFuY2gtNQ==',
        url: 'https://api.github.com/repos/fake-Owner/HelloWorld/git/refs/heads/Test-branch-5',
        object: {
          sha: 'f826b1caabafdffec3dc45a08e41d7021c68db41',
          type: 'commit',
          url: 'https://api.github.com/repos/fake-Owner/HelloWorld/git/commits/f826b1caabafdffec3dc45a08e41d7021c68db41',
        },
      },
    } as unknown as CreateRefResponse;
    const getBranchStub = sandbox
      .stub(octokit.repos, 'getBranch')
      .resolves(branchResponse);
    const getRefError = Error('Not Found');
    Object.assign(getRefError, {status: 404});
    const listBranchStub = sandbox
      .stub(octokit.git, 'getRef')
      .rejects(getRefError);
    const createRefStub = sandbox
      .stub(octokit.git, 'createRef')
      .resolves(createRefResponse);
    // tests
    const sha = await branch(octokit, origin, upstream, branchName, 'main');
    assert.strictEqual(sha, branchResponse.data.commit.sha);
    sandbox.assert.calledOnceWithExactly(getBranchStub, {
      owner: upstream.owner,
      repo: upstream.repo,
      branch: 'main',
    });
    sandbox.assert.calledOnceWithExactly(listBranchStub, {
      owner: origin.owner,
      repo: origin.repo,
      ref: `heads/${branchName}`,
    });
    sandbox.assert.calledOnceWithExactly(createRefStub, {
      owner: origin.owner,
      repo: origin.repo,
      ref: `refs/heads/${branchName}`,
      sha: branchResponse.data.commit.sha,
    });
  });

  it('When there is an existing branch the primary HEAD sha is still returned and no new branch is created', async () => {
    // setup
    const branchResponseBody = JSON.parse(
      (
        await fsp.readFile('./test/fixtures/get-branch-response.json')
      ).toString()
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    } as GetBranchResponse;
    const getRefResponseBody = JSON.parse(
      (await fsp.readFile('./test/fixtures/get-ref-response.json')).toString()
    );
    const getRefResponse = {
      headers: {},
      status: 404,
      url: 'http://fake-url.com',
      data: getRefResponseBody,
    } as unknown as GetRefResponse;
    const getBranchStub = sandbox
      .stub(octokit.repos, 'getBranch')
      .resolves(branchResponse);
    const listBranchStub = sandbox
      .stub(octokit.git, 'getRef')
      .resolves(getRefResponse);
    const createRefStub = sandbox.stub(octokit.git, 'createRef');
    // tests
    const sha = await branch(
      octokit,
      origin,
      upstream,
      'existing-branch',
      'main'
    );
    assert.strictEqual(sha, branchResponse.data.commit.sha);
    sandbox.assert.calledOnceWithExactly(getBranchStub, {
      owner: upstream.owner,
      repo: upstream.repo,
      branch: 'main',
    });
    sandbox.assert.calledOnceWithExactly(listBranchStub, {
      owner: origin.owner,
      repo: origin.repo,
      ref: 'heads/existing-branch',
    });
    sandbox.assert.notCalled(createRefStub);
  });

  it('Branching fails when Octokit get branch fails', async () => {
    const error = new Error(testErrorMessage);
    sandbox.stub(octokit.repos, 'getBranch').rejects(error);
    await assert.rejects(
      branch(octokit, origin, upstream, branchName, 'main'),
      error
    );
  });
  it('Branching fails when Octokit list branch fails', async () => {
    const branchResponseBody = JSON.parse(
      (
        await fsp.readFile('./test/fixtures/get-branch-response.json')
      ).toString()
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    } as GetBranchResponse;
    const error = new Error(testErrorMessage);
    sandbox.stub(octokit.repos, 'getBranch').resolves(branchResponse);
    sandbox.stub(octokit.git, 'getRef').rejects(error);
    await assert.rejects(
      branch(octokit, origin, upstream, branchName, 'main'),
      error
    );
  });
  it('Branching fails when Octokit create ref fails', async () => {
    const branchResponseBody = JSON.parse(
      (
        await fsp.readFile('./test/fixtures/get-branch-response.json')
      ).toString()
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    } as GetBranchResponse;
    sandbox.stub(octokit.repos, 'getBranch').resolves(branchResponse);
    const getRefError = Error('Not Found');
    const createRefError = Error(testErrorMessage);
    Object.assign(getRefError, {status: 404});
    sandbox.stub(octokit.git, 'getRef').rejects(getRefError);
    sandbox.stub(octokit.git, 'createRef').rejects(createRefError);
    await assert.rejects(
      branch(octokit, origin, upstream, branchName, 'main'),
      createRefError
    );
  });
  it('Branching fails when primary branch specified did not match any of the branches returned', async () => {
    const branchResponseBody = JSON.parse(
      (
        await fsp.readFile('./test/fixtures/get-branch-response.json')
      ).toString()
    );
    const branchResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: branchResponseBody,
    } as GetBranchResponse;
    sandbox.stub(octokit.repos, 'getBranch').resolves(branchResponse);
    await assert.rejects(
      branch(octokit, origin, upstream, branchName, 'non-main-branch')
    );
  });
  it('the reference string parsing function correctly appends branch name to reference prefix', () => {
    assert.strictEqual(createRef('main'), 'refs/heads/main');
    assert.strictEqual(createRef('foo/bar/baz'), 'refs/heads/foo/bar/baz');
    assert.strictEqual(createRef('+++'), 'refs/heads/+++');
  });
});
