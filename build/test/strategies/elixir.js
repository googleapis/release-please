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
const elixir_1 = require("../../src/strategies/elixir");
const helpers_1 = require("../helpers");
const nock = require("nock");
const sinon = require("sinon");
const github_1 = require("../../src/github");
const version_1 = require("../../src/version");
const tag_name_1 = require("../../src/util/tag-name");
const chai_1 = require("chai");
const changelog_1 = require("../../src/updaters/changelog");
const elixir_mix_exs_1 = require("../../src/updaters/elixir/elixir-mix-exs");
nock.disableNetConnect();
const sandbox = sinon.createSandbox();
(0, mocha_1.describe)('Elixir', () => {
    let github;
    const commits = [
        ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
    ];
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'elixir-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.it)('returns release PR changes with defaultInitialVersion', async () => {
            var _a;
            const expectedVersion = '1.0.0';
            const strategy = new elixir_1.Elixir({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('builds a release pull request', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new elixir_1.Elixir({
                targetBranch: 'main',
                github,
                component: 'some-elixir-package',
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'some-elixir-package'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new elixir_1.Elixir({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'mix.exs', elixir_mix_exs_1.ElixirMixExs);
        });
    });
});
//# sourceMappingURL=elixir.js.map