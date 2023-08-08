"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const helpers_1 = require("../helpers");
const default_1 = require("../../src/changelog-notes/default");
const commit_1 = require("../../src/commit");
const pull_request_body_1 = require("../../src/util/pull-request-body");
const version_1 = require("../../src/version");
(0, mocha_1.describe)('DefaultChangelogNotes', () => {
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
            notes: [{ title: 'BREAKING CHANGE', text: 'some bugfix' }],
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
    (0, mocha_1.describe)('buildNotes', () => {
        const notesOptions = {
            owner: 'googleapis',
            repository: 'java-asset',
            version: '1.2.3',
            previousTag: 'v1.2.2',
            currentTag: 'v1.2.3',
            targetBranch: 'main',
        };
        (0, mocha_1.it)('should build default release notes', async () => {
            const changelogNotes = new default_1.DefaultChangelogNotes();
            const notes = await changelogNotes.buildNotes(commits, notesOptions);
            (0, chai_1.expect)(notes).to.is.string;
            (0, helpers_1.safeSnapshot)(notes);
        });
        (0, mocha_1.it)('should build with custom changelog sections', async () => {
            const changelogNotes = new default_1.DefaultChangelogNotes();
            const notes = await changelogNotes.buildNotes(commits, {
                ...notesOptions,
                changelogSections: [
                    { type: 'feat', section: 'Features' },
                    { type: 'fix', section: 'Bug Fixes' },
                    { type: 'docs', section: 'Documentation' },
                ],
            });
            (0, chai_1.expect)(notes).to.is.string;
            (0, helpers_1.safeSnapshot)(notes);
        });
        (0, mocha_1.it)('should handle BREAKING CHANGE notes', async () => {
            const commits = [
                {
                    sha: 'sha2',
                    message: 'fix: some bugfix',
                    files: ['path1/file1.rb'],
                    type: 'fix',
                    scope: null,
                    bareMessage: 'some bugfix',
                    notes: [{ title: 'BREAKING CHANGE', text: 'some bugfix' }],
                    references: [],
                    breaking: true,
                },
            ];
            const changelogNotes = new default_1.DefaultChangelogNotes();
            const notes = await changelogNotes.buildNotes(commits, notesOptions);
            (0, chai_1.expect)(notes).to.is.string;
            (0, helpers_1.safeSnapshot)(notes);
        });
        (0, mocha_1.it)('should ignore RELEASE AS notes', async () => {
            const commits = [
                {
                    sha: 'sha2',
                    message: 'fix!: some bugfix',
                    files: ['path1/file1.rb'],
                    type: 'fix',
                    scope: null,
                    bareMessage: 'some bugfix',
                    notes: [{ title: 'BREAKING CHANGE', text: 'some bugfix' }],
                    references: [],
                    breaking: true,
                },
            ];
            const changelogNotes = new default_1.DefaultChangelogNotes();
            const notes = await changelogNotes.buildNotes(commits, notesOptions);
            (0, chai_1.expect)(notes).to.is.string;
            (0, helpers_1.safeSnapshot)(notes);
        });
        (0, mocha_1.describe)('with commit parsing', () => {
            (0, mocha_1.it)('should handle a breaking change', async () => {
                const commits = [(0, helpers_1.buildMockCommit)('fix!: some bugfix')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should handle a breaking change with reference', async () => {
                const commits = [(0, helpers_1.buildMockCommit)('fix!: some bugfix (#1234)')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should parse multiple commit messages from a single commit', async () => {
                const commits = [(0, helpers_1.buildCommitFromFixture)('multiple-messages')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should handle BREAKING CHANGE body', async () => {
                const commits = [(0, helpers_1.buildCommitFromFixture)('breaking-body')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should handle bug links', async () => {
                const commits = [(0, helpers_1.buildCommitFromFixture)('bug-link')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should handle inline bug links', async () => {
                const commits = [(0, helpers_1.buildMockCommit)('fix: some bugfix (#1234)')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should handle git trailers', async () => {
                const commits = [(0, helpers_1.buildCommitFromFixture)('git-trailers-with-breaking')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should handle meta commits', async () => {
                const commits = [(0, helpers_1.buildCommitFromFixture)('meta')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should handle multi-line breaking changes', async () => {
                const commits = [(0, helpers_1.buildCommitFromFixture)('multi-line-breaking-body')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should handle multi-line breaking change, if prefixed with list', async () => {
                const commits = [
                    (0, helpers_1.buildCommitFromFixture)('multi-line-breaking-body-list'),
                ];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should not include content two newlines after BREAKING CHANGE', async () => {
                const commits = [(0, helpers_1.buildCommitFromFixture)('breaking-body-content-after')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('handles Release-As footers', async () => {
                const commits = [(0, helpers_1.buildCommitFromFixture)('release-as')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should allow customizing sections', async () => {
                const commits = [(0, helpers_1.buildMockCommit)('chore: some chore')];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), {
                    ...notesOptions,
                    changelogSections: [
                        { type: 'chore', section: 'Miscellaneous Chores' },
                    ],
                });
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
            });
            (0, mocha_1.it)('should handle html tags', async () => {
                const commits = [
                    (0, helpers_1.buildMockCommit)('feat: render all imagesets as <picture>'),
                ];
                const changelogNotes = new default_1.DefaultChangelogNotes();
                const notes = await changelogNotes.buildNotes((0, commit_1.parseConventionalCommits)(commits), notesOptions);
                (0, chai_1.expect)(notes).to.is.string;
                (0, helpers_1.safeSnapshot)(notes);
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
    (0, mocha_1.describe)('pull request compatibility', () => {
        (0, mocha_1.it)('should build parseable notes', async () => {
            var _a;
            const notesOptions = {
                owner: 'googleapis',
                repository: 'java-asset',
                version: '1.2.3',
                previousTag: 'v1.2.2',
                currentTag: 'v1.2.3',
                targetBranch: 'main',
            };
            const changelogNotes = new default_1.DefaultChangelogNotes();
            const notes = await changelogNotes.buildNotes(commits, notesOptions);
            const pullRequestBody = new pull_request_body_1.PullRequestBody([
                {
                    version: version_1.Version.parse('1.2.3'),
                    notes,
                },
            ]);
            const pullRequestBodyContent = pullRequestBody.toString();
            const parsedPullRequestBody = pull_request_body_1.PullRequestBody.parse(pullRequestBodyContent);
            (0, chai_1.expect)(parsedPullRequestBody).to.not.be.undefined;
            (0, chai_1.expect)(parsedPullRequestBody.releaseData).lengthOf(1);
            (0, chai_1.expect)((_a = parsedPullRequestBody.releaseData[0].version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
        });
    });
});
//# sourceMappingURL=default-changelog-notes.js.map