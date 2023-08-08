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
const github_1 = require("../../src/github");
const terraform_module_1 = require("../../src/strategies/terraform-module");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const changelog_1 = require("../../src/updaters/changelog");
const readme_1 = require("../../src/updaters/terraform/readme");
const module_version_1 = require("../../src/updaters/terraform/module-version");
const sandbox = sinon.createSandbox();
const COMMITS = [
    ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
    ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
    ...(0, helpers_1.buildMockConventionalCommit)('chore: update common templates'),
];
(0, mocha_1.describe)('TerraformModule', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'terraform-module-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.it)('returns release PR changes with defaultInitialVersion', async () => {
            var _a;
            const expectedVersion = '0.1.0';
            const strategy = new terraform_module_1.TerraformModule({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new terraform_module_1.TerraformModule({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'google-cloud-automl'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new terraform_module_1.TerraformModule({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
        });
        (0, mocha_1.it)('finds and updates README files', async () => {
            const strategy = new terraform_module_1.TerraformModule({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const findFilesStub = sandbox.stub(github, 'findFilesByFilenameAndRef');
            findFilesStub
                .withArgs('readme.md', 'main', '.')
                .resolves(['path1/readme.md', 'path2/readme.md']);
            findFilesStub
                .withArgs('README.md', 'main', '.')
                .resolves(['README.md', 'path3/README.md']);
            findFilesStub
                .withArgs('versions.tf', 'main', '.')
                .resolves(['path1/versions.tf', 'path2/versions.tf']);
            findFilesStub
                .withArgs('versions.tf.tmpl', 'main', '.')
                .resolves(['path1/versions.tf.tmpl', 'path2/versions.tf.tmpl']);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'path1/readme.md', readme_1.ReadMe);
            (0, helpers_1.assertHasUpdate)(updates, 'path2/readme.md', readme_1.ReadMe);
            (0, helpers_1.assertHasUpdate)(updates, 'README.md', readme_1.ReadMe);
            (0, helpers_1.assertHasUpdate)(updates, 'path3/README.md', readme_1.ReadMe);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/versions.tf', module_version_1.ModuleVersion);
            (0, helpers_1.assertHasUpdate)(updates, 'path2/versions.tf', module_version_1.ModuleVersion);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/versions.tf.tmpl', module_version_1.ModuleVersion);
            (0, helpers_1.assertHasUpdate)(updates, 'path2/versions.tf.tmpl', module_version_1.ModuleVersion);
        });
    });
});
//# sourceMappingURL=terraform-module.js.map