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

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {
  buildCommitFromFixture,
  buildMockCommit,
  safeSnapshot,
} from '../helpers';
import {DefaultChangelogNotes} from '../../src/changelog-notes/default';
import {parseConventionalCommits} from '../../src/commit';
import {PullRequestBody} from '../../src/util/pull-request-body';
import {Version} from '../../src/version';

describe('DefaultChangelogNotes', () => {
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
    it('should build default release notes', async () => {
      const changelogNotes = new DefaultChangelogNotes();
      const notes = await changelogNotes.buildNotes(commits, notesOptions);
      expect(notes).to.is.string;
      safeSnapshot(notes);
    });
    it('should build with custom changelog sections', async () => {
      const changelogNotes = new DefaultChangelogNotes();
      const notes = await changelogNotes.buildNotes(commits, {
        ...notesOptions,
        changelogSections: [
          {type: 'feat', section: 'Features'},
          {type: 'fix', section: 'Bug Fixes'},
          {type: 'docs', section: 'Documentation'},
        ],
      });
      expect(notes).to.is.string;
      safeSnapshot(notes);
    });
    it('should handle BREAKING CHANGE notes', async () => {
      const commits = [
        {
          sha: 'sha2',
          message: 'fix: some bugfix',
          files: ['path1/file1.rb'],
          type: 'fix',
          scope: null,
          bareMessage: 'some bugfix',
          notes: [{title: 'BREAKING CHANGE', text: 'some bugfix'}],
          references: [],
          breaking: true,
        },
      ];
      const changelogNotes = new DefaultChangelogNotes();
      const notes = await changelogNotes.buildNotes(commits, notesOptions);
      expect(notes).to.is.string;
      safeSnapshot(notes);
    });
    it('should ignore RELEASE AS notes', async () => {
      const commits = [
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
      ];
      const changelogNotes = new DefaultChangelogNotes();
      const notes = await changelogNotes.buildNotes(commits, notesOptions);
      expect(notes).to.is.string;
      safeSnapshot(notes);
    });
    it('should ignore "chore: release" commits', async () => {
      const commits = [
        {
          sha: 'sha1',
          message: 'chore: some chore',
          files: ['path1/file1.rb'],
          type: 'chore',
          scope: null,
          bareMessage: 'some chore',
          notes: [],
          references: [],
          breaking: false,
        },
        {
          sha: 'sha2',
          message: 'chore: release main',
          files: ['path1/file1.rb'],
          type: 'chore',
          scope: null,
          bareMessage: 'release main',
          notes: [],
          references: [],
          breaking: false,
        },
      ];
      const changelogNotes = new DefaultChangelogNotes();
      const notes = await changelogNotes.buildNotes(commits, {
        ...notesOptions,
        changelogSections: [{type: 'chore', section: 'Chores', hidden: false}],
      });
      expect(notes).to.is.string;
      safeSnapshot(notes);
    });
    describe('with commit parsing', () => {
      it('should handle a breaking change', async () => {
        const commits = [buildMockCommit('fix!: some bugfix')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should handle a breaking change with reference', async () => {
        const commits = [buildMockCommit('fix!: some bugfix (#1234)')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should parse multiple commit messages from a single commit', async () => {
        const commits = [buildCommitFromFixture('multiple-messages')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should handle BREAKING CHANGE body', async () => {
        const commits = [buildCommitFromFixture('breaking-body')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should handle bug links', async () => {
        const commits = [buildCommitFromFixture('bug-link')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should handle inline bug links', async () => {
        const commits = [buildMockCommit('fix: some bugfix (#1234)')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should handle git trailers', async () => {
        const commits = [buildCommitFromFixture('git-trailers-with-breaking')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should handle meta commits', async () => {
        const commits = [buildCommitFromFixture('meta')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should handle multi-line breaking changes', async () => {
        const commits = [buildCommitFromFixture('multi-line-breaking-body')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should handle multi-line breaking change, if prefixed with list', async () => {
        const commits = [
          buildCommitFromFixture('multi-line-breaking-body-list'),
        ];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should not include content two newlines after BREAKING CHANGE', async () => {
        const commits = [buildCommitFromFixture('breaking-body-content-after')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('handles Release-As footers', async () => {
        const commits = [buildCommitFromFixture('release-as')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should allow customizing sections', async () => {
        const commits = [buildMockCommit('chore: some chore')];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          {
            ...notesOptions,
            changelogSections: [
              {type: 'chore', section: 'Miscellaneous Chores'},
            ],
          }
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      it('should handle html tags', async () => {
        const commits = [
          buildMockCommit('feat: render all imagesets as <picture>'),
        ];
        const changelogNotes = new DefaultChangelogNotes();
        const notes = await changelogNotes.buildNotes(
          parseConventionalCommits(commits),
          notesOptions
        );
        expect(notes).to.is.string;
        safeSnapshot(notes);
      });
      // it('ignores reverted commits', async () => {
      //   const commits = [buildCommitFromFixture('multiple-messages')];
      //   const changelogNotes = new DefaultChangelogNotes();
      //   const notes = await changelogNotes.buildNotes(parseConventionalCommits(commits), notesOptions);
      //   expect(notes).to.is.string;
      //   safeSnapshot(notes);
      // });
    });
  });
  describe('pull request compatibility', () => {
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
      const changelogNotes = new DefaultChangelogNotes();
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
    });
  });
});
