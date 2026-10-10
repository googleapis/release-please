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
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';
import {fork} from '../src/util/code-suggester/github/fork';

type CreateRefResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.repos.createFork
>;

before(() => {
  setup();
});

describe('Forking function', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
  const upstream = {owner: 'upstream-owner', repo: 'upstream-repo'};
  it('Calls Octokit with the correct values', async () => {
    const responseData = await import('./fixtures/create-fork-response.json');
    const createRefResponse = {
      headers: {},
      status: 202,
      url: 'http://fake-url.com',
      data: responseData,
    } as unknown as CreateRefResponse;
    // setup
    const stub = sandbox
      .stub(octokit.repos, 'createFork')
      .resolves(createRefResponse);
    // tests
    await fork(octokit, upstream);
    sandbox.assert.calledOnceWithExactly(stub, {
      owner: upstream.owner,
      repo: upstream.repo,
    });
  });
  it('Returns correct values on success', async () => {
    const responseData = await import('./fixtures/create-fork-response.json');
    const createRefResponse = {
      headers: {},
      status: 202,
      url: 'http://fake-url.com',
      data: responseData,
    } as unknown as CreateRefResponse;
    // setup
    sandbox.stub(octokit.repos, 'createFork').resolves(createRefResponse);
    // tests
    const res = await fork(octokit, upstream);
    assert.strictEqual(res.owner, responseData.owner.login);
    assert.strictEqual(res.repo, responseData.name);
  });
  it('Passes the error message with a throw when octokit fails', async () => {
    // setup
    const errorMsg = 'Error message';
    sandbox.stub(octokit.repos, 'createFork').rejects(errorMsg);
    await assert.rejects(
      fork(octokit, upstream),
      'The fork function should have failed because Octokit failed.'
    );
  });
});
