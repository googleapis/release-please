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
import {buildMockCommit} from '../helpers';
import {BaseStrategy} from '../../src/strategies/base';
import {Update} from '../../src/update';
import {GitHub} from '../../src/github';
import {PullRequestBody} from '../../src/util/pull-request-body';

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
    it('updates extra files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: [
          '0',
          '/1.java',
          '~/2.md',
          '~/./3',
          'foo/4.~csv',
          'foo/5.bak',
          'foo/bar/../baz',
          'foo/baz/bar/',
        ],
      });
      const pullRequest = await strategy.buildReleasePullRequest(
        [
          buildMockCommit('fix: a bugfix'),
          buildMockCommit('feat: a feature'),
          buildMockCommit('docs: update README.md'),
        ],
        undefined
      );
      expect(pullRequest).to.not.be.undefined;
      expect(pullRequest?.updates).to.be.an('array');
      expect(pullRequest?.updates.map(update => update.path))
        .to.include.members([
          '0',
          '1.java',
          '2.md',
          '3',
          'foo/4.~csv',
          'foo/5.bak',
          'foo/baz',
          'foo/baz/bar',
        ])
        .and.not.include('/1.java', 'expected file at repo root')
        .and.not.include('~/2.md', 'expected file at repo root')
        .and.not.include('foo/bar/baz', 'expected file up one level')
        .and.not.include('foo/baz/bar/', 'expected file but got directory');
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
