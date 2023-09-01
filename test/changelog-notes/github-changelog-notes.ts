// Copyright 2023 Google LLC
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
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {safeSnapshot} from '../helpers';
import {PullRequestBody} from '../../src/util/pull-request-body';
import {Version} from '../../src/version';
import {GitHubChangelogNotes} from '../../src/changelog-notes/github';
import {GitHub} from '../../src/github';

nock.disableNetConnect();

describe('GitHubChangelogNotes', () => {
  const commits = [
    {
      sha: 'sha1',
      message: 'feat: some feature',
      files: ['path1/file1.txt'],
      type: 'feat',
      scope: null,
      bareMessage: 'some feature',
      notes: [],
      references: [],
      breaking: false,
    },
    {
      sha: 'sha2',
      message: 'fix!: some bugfix',
      files: ['path1/file1.rb'],
      type: 'fix',
      scope: null,
      bareMessage: 'some bugfix',
      notes: [{title: 'BREAKING CHANGE', text: 'some bugfix'}],
      references: [],
      breaking: true,
    },
    {
      sha: 'sha3',
      message: 'docs: some documentation',
      files: ['path1/file1.java'],
      type: 'docs',
      scope: null,
      bareMessage: 'some documentation',
      notes: [],
      references: [],
      breaking: false,
    },
  ];
  describe('buildNotes', () => {
    const notesOptions = {
      owner: 'googleapis',
      repository: 'java-asset',
      version: '1.2.3',
      previousTag: 'v1.2.2',
      currentTag: 'v1.2.3',
      targetBranch: 'main',
      changesBranch: 'main',
    };
    let github: GitHub;
    let req: nock.Scope;
    beforeEach(async () => {
      github = await GitHub.create({
        owner: 'fake-owner',
        repo: 'fake-repo',
        defaultBranch: 'main',
        token: 'fake-token',
      });
      req = nock('https://api.github.com/')
        .post('/repos/fake-owner/fake-repo/releases/generate-notes')
        .reply(200, {
          name: 'Release v1.0.0 is now available!',
          body: '##Changes in Release v1.0.0 ... ##Contributors @monalisa',
        });
    });
    it('should build release notes from GitHub', async () => {
      const changelogNotes = new GitHubChangelogNotes(github);
      const notes = await changelogNotes.buildNotes(commits, notesOptions);
      expect(notes).to.is.string;
      safeSnapshot(notes);
      req.done();
    });

    it('should build parseable notes', async () => {
      const notesOptions = {
        owner: 'googleapis',
        repository: 'java-asset',
        version: '1.2.3',
        previousTag: 'v1.2.2',
        currentTag: 'v1.2.3',
        targetBranch: 'main',
        changesBranch: 'main',
      };
      const changelogNotes = new GitHubChangelogNotes(github);
      const notes = await changelogNotes.buildNotes(commits, notesOptions);
      const pullRequestBody = new PullRequestBody([
        {
          version: Version.parse('1.2.3'),
          notes,
        },
      ]);
      const pullRequestBodyContent = pullRequestBody.toString();
      const parsedPullRequestBody = PullRequestBody.parse(
        pullRequestBodyContent
      );
      expect(parsedPullRequestBody).to.not.be.undefined;
      expect(parsedPullRequestBody!.releaseData).lengthOf(1);
      expect(parsedPullRequestBody!.releaseData[0].version?.toString()).to.eql(
        '1.2.3'
      );
      req.done();
    });
  });
});
