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
import * as sinon from 'sinon';
import {expect} from 'chai';
import {BaseStrategy} from '../../src/strategies/base';
import {Update} from '../../src/update';
import {GitHub} from '../../src/github';
import {PullRequestBody} from '../../src/util/pull-request-body';
import snapshot = require('snap-shot-it');
import {dateSafe} from '../helpers';

const sandbox = sinon.createSandbox();

class TestStrategy extends BaseStrategy {
  async buildUpdates(): Promise<Update[]> {
    return [];
  }
}

describe('Strategy', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'base-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('should ignore empty commits', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const pullRequest = await strategy.buildReleasePullRequest([]);
      expect(pullRequest).to.be.undefined;
    });
    it('allows overriding initial version', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const commits = [
        {
          sha: 'abc123',
          message: 'chore: initial commit\n\nRelease-As: 2.3.4',
        },
      ];
      const pullRequest = await strategy.buildReleasePullRequest(commits);
      expect(pullRequest).to.not.be.undefined;
      expect(pullRequest?.version?.toString()).to.eql('2.3.4');
      snapshot(dateSafe(pullRequest!.body.toString()));
    });
  });
  describe('buildRelease', () => {
    it('builds a release tag', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('google-cloud-automl-v1.2.3');
    });
    it('overrides the tag separator', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        tagSeparator: '/',
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('google-cloud-automl/v1.2.3');
    });
    it('skips component in release tag', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        includeComponentInTag: false,
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('v1.2.3');
    });
  });
});
