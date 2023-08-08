"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const nock = require("nock");
const sinon = require("sinon");
const snapshot = require("snap-shot-it");
const fs_1 = require("fs");
const path_1 = require("path");
const src_1 = require("../../src");
const pull_request_overflow_handler_1 = require("../../src/util/pull-request-overflow-handler");
const pull_request_body_1 = require("../../src/util/pull-request-body");
const pull_request_title_1 = require("../../src/util/pull-request-title");
const helpers_1 = require("../helpers");
nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/release-notes';
(0, mocha_1.describe)('FilePullRequestOverflowHandler', () => {
    let github;
    let overflowHandler;
    (0, mocha_1.beforeEach)(async () => {
        github = await src_1.GitHub.create({
            owner: 'test-owner',
            repo: 'test-repo',
            defaultBranch: 'main',
        });
        overflowHandler = new pull_request_overflow_handler_1.FilePullRequestOverflowHandler(github);
    });
    afterEach(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('handleOverflow', () => {
        const data = [];
        for (let i = 0; i < 10; i++) {
            data.push({
                notes: `release notes: ${i}`,
            });
        }
        const body = new pull_request_body_1.PullRequestBody(data);
        (0, mocha_1.it)('writes large pull request body contents to a file', async () => {
            const createFileStub = sandbox
                .stub(github, 'createFileOnNewBranch')
                .resolves('https://github.com/test-owner/test-repo/blob/my-head-branch--release-notes/release-notes.md');
            const newContents = await overflowHandler.handleOverflow({
                title: pull_request_title_1.PullRequestTitle.ofTargetBranch('main'),
                body,
                labels: [],
                updates: [],
                draft: false,
                headRefName: 'my-head-branch',
            }, 50);
            snapshot(newContents);
            sinon.assert.calledOnce(createFileStub);
        });
        (0, mocha_1.it)('ignores small pull request body contents', async () => {
            const newContents = await overflowHandler.handleOverflow({
                title: pull_request_title_1.PullRequestTitle.ofTargetBranch('main'),
                body,
                labels: [],
                updates: [],
                draft: false,
                headRefName: 'my-head-branch',
            });
            (0, chai_1.expect)(newContents).to.eql(body.toString());
        });
    });
    (0, mocha_1.describe)('parseOverflow', () => {
        (0, mocha_1.it)('parses overflow body and reads file contents', async () => {
            const body = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './overflow.txt'), 'utf8');
            const overflowBody = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './multiple.txt'), 'utf8');
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('release-notes.md', 'my-head-branch--release-notes')
                .resolves((0, helpers_1.buildGitHubFileRaw)(overflowBody));
            const pullRequestBody = await overflowHandler.parseOverflow({
                title: 'chore: release main',
                body,
                headBranchName: 'release-please--branches--main',
                baseBranchName: 'main',
                number: 123,
                labels: [],
                files: [],
            });
            (0, chai_1.expect)(pullRequestBody).to.not.be.undefined;
            snapshot(pullRequestBody.toString());
        });
        (0, mocha_1.it)('ignores small pull request body contents', async () => {
            const body = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './multiple.txt'), 'utf8');
            const pullRequestBody = await overflowHandler.parseOverflow({
                title: 'chore: release main',
                body,
                headBranchName: 'release-please--branches--main',
                baseBranchName: 'main',
                number: 123,
                labels: [],
                files: [],
            });
            (0, chai_1.expect)(pullRequestBody).to.not.be.undefined;
            snapshot(pullRequestBody.toString());
        });
    });
});
//# sourceMappingURL=pull-request-overflow-handler.js.map