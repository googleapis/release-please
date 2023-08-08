"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const nock = require("nock");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const helpers_1 = require("../helpers");
const pull_request_body_1 = require("../../src/util/pull-request-body");
const version_1 = require("../../src/version");
const github_1 = require("../../src/changelog-notes/github");
const github_2 = require("../../src/github");
nock.disableNetConnect();
(0, mocha_1.describe)('GitHubChangelogNotes', () => {
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
        let github;
        beforeEach(async () => {
            github = await github_2.GitHub.create({
                owner: 'fake-owner',
                repo: 'fake-repo',
                defaultBranch: 'main',
                token: 'fake-token',
            });
            nock('https://api.github.com/')
                .post('/repos/fake-owner/fake-repo/releases/generate-notes')
                .reply(200, {
                name: 'Release v1.0.0 is now available!',
                body: '##Changes in Release v1.0.0 ... ##Contributors @monalisa',
            });
        });
        (0, mocha_1.it)('should build release notes from GitHub', async () => {
            const changelogNotes = new github_1.GitHubChangelogNotes(github);
            const notes = await changelogNotes.buildNotes(commits, notesOptions);
            (0, chai_1.expect)(notes).to.is.string;
            (0, helpers_1.safeSnapshot)(notes);
        });
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
            const changelogNotes = new github_1.GitHubChangelogNotes(github);
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
//# sourceMappingURL=github-changelog-notes.js.map