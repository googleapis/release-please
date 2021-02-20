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

import {PHPYoshi} from '../../src/releasers/php-yoshi';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {buildGitHubFileRaw} from './utils';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {GitHub} from '../../src/github';
import {buildMockCommit, stringifyExpectedChanges} from '../helpers';
import {
  FileData,
  CreatePullRequestUserOptions,
} from 'code-suggester/build/src/types';
import {Octokit} from '@octokit/rest';

const sandbox = sinon.createSandbox();

let expectedChanges: [string, FileData][] = [];
let expectedOptions: CreatePullRequestUserOptions = {} as CreatePullRequestUserOptions;
function replaceSuggester() {
  sandbox.replace(
    suggester,
    'createPullRequest',
    (
      _octokit: Octokit,
      changes: suggester.Changes | null | undefined,
      options: CreatePullRequestUserOptions
    ): Promise<number> => {
      expectedChanges = [...changes!]; // Convert map to key/value pairs.
      expectedOptions = options;
      return Promise.resolve(22);
    }
  );
}

const fixturesPath = './test/fixtures';

describe('PHPYoshi', () => {
  afterEach(() => {
    expectedChanges = [];
    expectedOptions = {} as CreatePullRequestUserOptions;
    sandbox.restore();
  });

  it('generates CHANGELOG and aborts if duplicate', async () => {
    const releasePR = new PHPYoshi({
      github: new GitHub({owner: 'googleapis', repo: 'release-please'}),
      packageName: 'yoshi-php',
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
      readFileSync(
        resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
        'utf8'
      )
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
    getFileContentsStub
      .withArgs('AutoMl/composer.json', 'master')
      .resolves(buildGitHubFileRaw('{"name": "automl"}'));
    getFileContentsStub
      .withArgs('AutoMl/VERSION', 'master')
      .resolves(buildGitHubFileRaw('1.8.3'));
    getFileContentsStub
      .withArgs('Datastore/composer.json', 'master')
      .resolves(buildGitHubFileRaw('{"name": "datastore"}'));
    getFileContentsStub
      .withArgs('Datastore/VERSION', 'master')
      .resolves(buildGitHubFileRaw('2.0.0'));
    getFileContentsStub
      .withArgs('PubSub/composer.json', 'master')
      .resolves(buildGitHubFileRaw('{"name": "pubsub"}'));
    getFileContentsStub
      .withArgs('PubSub/VERSION', 'master')
      .resolves(buildGitHubFileRaw('1.0.1'));
    getFileContentsStub
      .withArgs('Speech/composer.json', 'master')
      .resolves(buildGitHubFileRaw('{"name": "speech"}'));
    getFileContentsStub
      .withArgs('Speech/VERSION', 'master')
      .resolves(buildGitHubFileRaw('1.0.0'));
    getFileContentsStub
      .withArgs('WebSecurityScanner/composer.json', 'master')
      .resolves(buildGitHubFileRaw('{"name": "websecurityscanner"}'));
    getFileContentsStub
      .withArgs('WebSecurityScanner/VERSION', 'master')
      .resolves(buildGitHubFileRaw('0.8.0'));
    getFileContentsStub
      .withArgs('composer.json', 'master')
      .resolves(buildGitHubFileRaw('{"replace": {}}'));
    getFileContentsStub
      .withArgs('docs/manifest.json', 'master')
      .resolves(
        buildGitHubFileRaw(
          '{"modules": [{"name": "google/cloud", "versions": []}, {"name": "datastore", "versions": []}]}'
        )
      );
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    const addLabelStub = sandbox
      .stub(releasePR.gh, 'addLabels')
      .withArgs(['autorelease: pending'], 22)
      .resolves();

    replaceSuggester();

    await releasePR.run();
    req.done();
    snapshot(stringifyExpectedChanges(expectedChanges));
    expect(expectedOptions.title).to.eql('chore: release 0.21.0');
    expect(addLabelStub.callCount).to.eql(1);
  });
});
