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

import {describe, it, afterEach} from 'mocha';
import * as nock from 'nock';
nock.disableNetConnect();

import {PHP} from '../../src/releasers/php';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {buildGitHubFileRaw} from './utils';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {GitHub} from '../../src/github';
import {stubSuggesterWithSnapshot} from '../helpers';

const sandbox = sinon.createSandbox();

const fixturesPath = './test/fixtures';

describe('PHP', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('generates php CHANGELOG and aborts if duplicate', async function () {
    const releasePR = new PHP({
      github: new GitHub({owner: 'googleapis', repo: 'release-please'}),
      packageName: 'php',
    });

    sandbox
      .stub(releasePR.gh, 'getDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    sandbox.stub(releasePR, 'latestTag').returns(
      Promise.resolve({
        name: 'v0.20.3',
        sha: 'bf69d0f204474b88b3f8b5a72a392129d16a3929',
        version: '0.20.3',
      })
    );

    const graphql = JSON.parse(
      readFileSync(resolve(fixturesPath, 'commits-php.json'), 'utf8')
    );
    const req = nock('https://api.github.com')
      // now we fetch the commits via the graphql API;
      // note they will be truncated to just before the tag's sha.
      .post('/graphql', () => {
        return true;
      })
      .reply(200, {
        data: graphql,
      });
    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    // Return composer.json if ./composer.json requested.
    getFileContentsStub
      .withArgs('composer.json', 'master')
      .resolves(buildGitHubFileRaw('{"replace": {}}'));
    // Return 404 if ./CHANGELOG.md requested.
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    const addLabelStub = sandbox
      .stub(releasePR.gh, 'addLabels')
      .withArgs(['autorelease: pending'], 22)
      .resolves();

    stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
    await releasePR.run();
    req.done();
    expect(addLabelStub.callCount).to.eql(1);
  });
});
