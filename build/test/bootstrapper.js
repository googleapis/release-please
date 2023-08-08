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
const sinon = require("sinon");
const chai_1 = require("chai");
const bootstrapper_1 = require("../src/bootstrapper");
const github_1 = require("../src/github");
const helpers_1 = require("./helpers");
const release_please_manifest_1 = require("../src/updaters/release-please-manifest");
const release_please_config_1 = require("../src/updaters/release-please-config");
const snapshot = require("snap-shot-it");
const sandbox = sinon.createSandbox();
(0, mocha_1.describe)('Bootstrapper', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'fake-owner',
            repo: 'fake-repo',
            defaultBranch: 'main',
            token: 'fake-token',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.it)('should open a PR', async () => {
        const expectedTitle = 'chore: bootstrap releases for path: .';
        const expectedHeadBranchName = 'release-please/bootstrap/default';
        const createPullRequestStub = sinon
            .stub(github, 'createPullRequest')
            .resolves({
            headBranchName: expectedHeadBranchName,
            baseBranchName: 'main',
            title: expectedTitle,
            body: 'body',
            files: [],
            labels: [],
            number: 123,
        });
        const bootstapper = new bootstrapper_1.Bootstrapper(github, 'main');
        const pullRequest = await bootstapper.bootstrap('.', {
            releaseType: 'node',
        });
        (0, chai_1.expect)(pullRequest.number).to.eql(123);
        sinon.assert.calledOnceWithExactly(createPullRequestStub, sinon.match({
            headBranchName: expectedHeadBranchName,
            baseBranchName: 'main',
        }), 'main', expectedTitle, sinon.match.array, sinon.match.any);
        const updates = createPullRequestStub.firstCall.args[3];
        (0, helpers_1.assertHasUpdate)(updates, '.release-please-manifest.json', release_please_manifest_1.ReleasePleaseManifest);
        const update = (0, helpers_1.assertHasUpdate)(updates, 'release-please-config.json', release_please_config_1.ReleasePleaseConfig);
        (0, chai_1.expect)(update.createIfMissing).to.be.true;
        const newContent = update.updater.updateContent(undefined);
        snapshot(newContent);
    });
});
//# sourceMappingURL=bootstrapper.js.map