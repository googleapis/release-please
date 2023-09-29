// Copyright 2022 Google LLC
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

import {describe, it, beforeEach} from 'mocha';
import {expect} from 'chai';
import nock = require('nock');
import * as sinon from 'sinon';
import snapshot = require('snap-shot-it');
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {GitHub} from '../../src';
import {
  PullRequestOverflowHandler,
  FilePullRequestOverflowHandler,
} from '../../src/util/pull-request-overflow-handler';
import {PullRequestBody} from '../../src/util/pull-request-body';
import {PullRequestTitle} from '../../src/util/pull-request-title';
import {buildGitHubFileRaw} from '../helpers';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/release-notes';

describe('FilePullRequestOverflowHandler', () => {
  let github: GitHub;
  let overflowHandler: PullRequestOverflowHandler;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'test-owner',
      repo: 'test-repo',
      defaultBranch: 'main',
    });
    overflowHandler = new FilePullRequestOverflowHandler(github);
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('handleOverflow', () => {
    const data = [];
    for (let i = 0; i < 10; i++) {
      data.push({
        notes: `release notes: ${i}`,
      });
    }
    const body = new PullRequestBody(data);
    it('writes large pull request body contents to a file', async () => {
      const createFileStub = sandbox
        .stub(github, 'createFileOnNewBranch')
        .resolves(
          'https://github.com/test-owner/test-repo/blob/my-head-branch--release-notes/release-notes.md'
        );
      const newContents = await overflowHandler.handleOverflow(
        {
          title: PullRequestTitle.ofTargetBranch('main', 'next'),
          body,
          labels: [],
          updates: [],
          draft: false,
          headRefName: 'my-head-branch',
          conventionalCommits: [],
        },
        'next',
        50
      );
      snapshot(newContents);
      sinon.assert.calledOnce(createFileStub);
    });
    it('ignores small pull request body contents', async () => {
      const newContents = await overflowHandler.handleOverflow(
        {
          title: PullRequestTitle.ofTargetBranch('main', 'next'),
          body,
          labels: [],
          updates: [],
          draft: false,
          headRefName: 'my-head-branch',
          conventionalCommits: [],
        },
        'next'
      );
      expect(newContents).to.eql(body.toString());
    });
  });
  describe('parseOverflow', () => {
    it('parses overflow body and reads file contents', async () => {
      const body = readFileSync(
        resolve(fixturesPath, './overflow.txt'),
        'utf8'
      );
      const overflowBody = readFileSync(
        resolve(fixturesPath, './multiple.txt'),
        'utf8'
      );
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-notes.md', 'my-head-branch--release-notes')
        .resolves(buildGitHubFileRaw(overflowBody));
      const pullRequestBody = await overflowHandler.parseOverflow({
        title: 'chore: release main',
        body,
        headBranchName: 'release-please--branches--main',
        baseBranchName: 'main',
        number: 123,
        labels: [],
        files: [],
      });
      expect(pullRequestBody).to.not.be.undefined;
      snapshot(pullRequestBody!.toString());
    });
    it('ignores small pull request body contents', async () => {
      const body = readFileSync(
        resolve(fixturesPath, './multiple.txt'),
        'utf8'
      );
      const pullRequestBody = await overflowHandler.parseOverflow({
        title: 'chore: release main',
        body,
        headBranchName: 'release-please--branches--main',
        baseBranchName: 'main',
        number: 123,
        labels: [],
        files: [],
      });
      expect(pullRequestBody).to.not.be.undefined;
      snapshot(pullRequestBody!.toString());
    });
  });
});
