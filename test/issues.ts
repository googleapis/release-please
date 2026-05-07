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

/* eslint-disable node/no-unsupported-features/node-builtins */

import * as assert from 'assert';
import {describe, it, before, afterEach} from 'mocha';
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';
import {addLabels} from '../src/util/code-suggester/github/labels';

type AddLabelsResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.issues.addLabels
>;

before(() => {
  setup();
});

describe('Adding labels', async () => {
  const sandbox = sinon.createSandbox();
  const upstream = {owner: 'upstream-owner', repo: 'upstream-repo'};
  const origin = {
    owner: 'origin-owner',
    repo: 'origin-repo',
    branch: 'issues-test-branch',
  };
  const issue_number = 1;
  const labels = ['enhancement'];
  afterEach(() => {
    sandbox.restore();
  });

  it('Invokes octokit issues add labels on an existing pull request', async () => {
    // setup
    const responseAddLabelsData = await import(
      './fixtures/add-labels-response.json'
    );
    const addLabelsResponse: AddLabelsResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: responseAddLabelsData,
    };
    const stub = sandbox
      .stub(octokit.issues, 'addLabels')
      .resolves(addLabelsResponse);
    // tests
    const resultingLabels = await addLabels(
      octokit,
      upstream,
      origin,
      issue_number,
      labels
    );
    sandbox.assert.calledOnceWithExactly(stub, {
      owner: upstream.owner,
      repo: origin.repo,
      issue_number: issue_number,
      labels: labels,
    });
    assert.deepStrictEqual(resultingLabels, ['bug', 'enhancement']);
  });

  it('No-op undefined labels', async () => {
    // setup
    const stub = sandbox.stub(octokit.issues, 'addLabels').resolves();
    // tests
    const resultingLabels = await addLabels(
      octokit,
      upstream,
      origin,
      issue_number
    );
    sandbox.assert.neverCalledWith(stub, sinon.match.any);
    assert.deepStrictEqual(resultingLabels, []);
  });

  it('No-op with empty labels', async () => {
    // setup
    const stub = sandbox.stub(octokit.issues, 'addLabels').resolves();
    // tests
    const resultingLabels = await addLabels(
      octokit,
      upstream,
      origin,
      issue_number,
      []
    );
    sandbox.assert.neverCalledWith(stub, sinon.match.any);
    assert.deepStrictEqual(resultingLabels, []);
  });

  it('Passes up the error message with a throw when octokit issues add labels fails', async () => {
    // setup
    const error = new Error('Error message');
    sandbox.stub(octokit.issues, 'addLabels').rejects(error);
    await assert.rejects(
      addLabels(octokit, upstream, origin, issue_number, labels),
      error
    );
  });
});
