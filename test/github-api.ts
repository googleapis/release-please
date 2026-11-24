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

import * as nock from 'nock';
import {expect} from 'chai';
import {afterEach, beforeEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import {RequestError} from '@octokit/request-error';

import {GitHub} from '../src/github';
import {isIssueNotFoundLabelError} from '../src/github-api';
import {GitHubAPIError} from '../src/errors';

const fetch = require('node-fetch');
const sandbox = sinon.createSandbox();

describe('isIssueNotFoundLabelError', () => {
  it('returns true for 422 with Issue not found', () => {
    const err = new RequestError('Validation Failed ... Issue not found', {
      request: {method: 'POST', url: 'https://api.github.com', headers: {}},
      response: {
        status: 422,
        data: {
          message: 'Validation Failed',
          errors: [
            {
              resource: 'Label',
              code: 'unprocessable',
              field: 'data',
              message: 'Issue not found',
            },
          ],
        },
        headers: {},
        url: 'https://api.github.com',
      },
    });
    expect(isIssueNotFoundLabelError(err)).to.be.true;
  });

  it('returns false for other 422 errors', () => {
    const err = new RequestError('Validation Failed', {
      request: {method: 'POST', url: 'https://api.github.com', headers: {}},
      response: {
        status: 422,
        data: {
          message: 'Validation Failed',
          errors: [
            {
              resource: 'Release',
              code: 'already_exists',
              field: 'tag_name',
            },
          ],
        },
        headers: {},
        url: 'https://api.github.com',
      },
    });
    expect(isIssueNotFoundLabelError(err)).to.be.false;
  });
});

describe('GitHub addIssueLabels retry', () => {
  let github: GitHub;
  let clock: sinon.SinonFakeTimers;

  beforeEach(async () => {
    nock('https://api.github.com/')
      .get('/repos/fake/fake')
      .optionally()
      .reply(200, {default_branch: 'main'});
    github = await GitHub.create({
      owner: 'fake',
      repo: 'fake',
      defaultBranch: 'main',
      fetch,
    });
    clock = sandbox.useFakeTimers();
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  const issueNotFound422 = {
    message: 'Validation Failed',
    errors: [
      {
        resource: 'Label',
        code: 'unprocessable',
        field: 'data',
        message: 'Issue not found',
      },
    ],
  };

  it('retries on 422 Issue not found then succeeds', async () => {
    const scope = nock('https://api.github.com/')
      .post('/repos/fake/fake/issues/42/labels', ['autorelease: pending'])
      .reply(422, issueNotFound422)
      .post('/repos/fake/fake/issues/42/labels', ['autorelease: pending'])
      .reply(200, []);

    const promise = github.addIssueLabels(['autorelease: pending'], 42);
    await clock.tickAsync(1000);
    await promise;
    scope.done();
  });

  it('throws GitHubAPIError after retries are exhausted', async () => {
    const scope = nock('https://api.github.com/')
      .post('/repos/fake/fake/issues/42/labels')
      .times(3)
      .reply(422, issueNotFound422);

    const promise = github.addIssueLabels(['autorelease: pending'], 42);
    const assertPromise = expect(promise).to.be.rejectedWith(GitHubAPIError);
    await clock.tickAsync(1000);
    await clock.tickAsync(2000);
    await assertPromise;
    scope.done();
  });
});
