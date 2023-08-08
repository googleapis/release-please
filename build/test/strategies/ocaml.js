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
const ocaml_1 = require("../../src/strategies/ocaml");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const helpers_2 = require("../helpers");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const changelog_1 = require("../../src/updaters/changelog");
const esy_json_1 = require("../../src/updaters/ocaml/esy-json");
const opam_1 = require("../../src/updaters/ocaml/opam");
const dune_project_1 = require("../../src/updaters/ocaml/dune-project");
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/ocaml';
const COMMITS = [
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
];
(0, mocha_1.describe)('OCaml', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'ocaml-test-repo',
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
            const strategy = new ocaml_1.OCaml({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByExtension').resolves([]);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new ocaml_1.OCaml({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByExtension').resolves([]);
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
            const strategy = new ocaml_1.OCaml({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByExtension').resolves([]);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, chai_1.expect)(updates).lengthOf(2);
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'dune-project', dune_project_1.DuneProject);
        });
        (0, mocha_1.it)('finds and updates a project files', async () => {
            const strategy = new ocaml_1.OCaml({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const findFilesStub = sandbox.stub(github, 'findFilesByExtension');
            findFilesStub.withArgs('json', '.').resolves(['esy.json', 'other.json']);
            findFilesStub.withArgs('opam', '.').resolves(['sample.opam']);
            findFilesStub
                .withArgs('opam.locked', '.')
                .resolves(['sample.opam.locked']);
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                targetBranch: 'main',
                fixturePath: fixturesPath,
                files: ['esy.json', 'other.json', 'sample.opam', 'sample.opam.locked'],
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, chai_1.expect)(updates).lengthOf(5);
            (0, helpers_1.assertHasUpdate)(updates, 'esy.json', esy_json_1.EsyJson);
            (0, helpers_1.assertNoHasUpdate)(updates, 'other.json');
            (0, helpers_1.assertHasUpdate)(updates, 'sample.opam', opam_1.Opam);
            (0, helpers_1.assertHasUpdate)(updates, 'sample.opam.locked', opam_1.Opam);
        });
    });
});
//# sourceMappingURL=ocaml.js.map