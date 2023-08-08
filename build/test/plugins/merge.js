"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const mocha_1 = require("mocha");
const sinon = require("sinon");
const github_1 = require("../../src/github");
const merge_1 = require("../../src/plugins/merge");
const chai_1 = require("chai");
const helpers_1 = require("../helpers");
const snapshot = require("snap-shot-it");
const raw_content_1 = require("../../src/updaters/raw-content");
const composite_1 = require("../../src/updaters/composite");
const sandbox = sinon.createSandbox();
(0, mocha_1.describe)('Merge plugin', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'node-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('run', () => {
        (0, mocha_1.it)('ignores no pull requests', async () => {
            const candidates = [];
            const plugin = new merge_1.Merge(github, 'main', {});
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(0);
        });
        (0, mocha_1.it)('merges a single pull request', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('python', 'python', '1.0.0'),
            ];
            const plugin = new merge_1.Merge(github, 'main', {});
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            (0, chai_1.expect)(newCandidates[0].pullRequest.title.toString()).to.eql('chore: release main');
        });
        (0, mocha_1.it)('merges multiple pull requests into an aggregate', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('python', 'python', '1.0.0', {
                    component: 'python-pkg',
                    updates: [
                        {
                            path: 'path1/foo',
                            createIfMissing: false,
                            updater: new raw_content_1.RawContent('foo'),
                        },
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('node', 'node', '3.3.4', {
                    component: '@here/pkgA',
                    updates: [
                        {
                            path: 'path1/foo',
                            createIfMissing: false,
                            updater: new raw_content_1.RawContent('bar'),
                        },
                        {
                            path: 'path2/foo',
                            createIfMissing: false,
                            updater: new raw_content_1.RawContent('asdf'),
                        },
                    ],
                }),
            ];
            const plugin = new merge_1.Merge(github, 'main', {});
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const candidate = newCandidates[0];
            const updates = candidate.pullRequest.updates;
            (0, chai_1.expect)(updates).lengthOf(2);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/foo', composite_1.CompositeUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'path2/foo', raw_content_1.RawContent);
            snapshot((0, helpers_1.dateSafe)(candidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('merges multiple pull requests as a draft', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('python', 'python', '1.0.0', {
                    component: 'python-pkg',
                    updates: [
                        {
                            path: 'path1/foo',
                            createIfMissing: false,
                            updater: new raw_content_1.RawContent('foo'),
                        },
                    ],
                    notes: 'python notes',
                    draft: true,
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('node', 'node', '3.3.4', {
                    component: '@here/pkgA',
                    updates: [
                        {
                            path: 'path1/foo',
                            createIfMissing: false,
                            updater: new raw_content_1.RawContent('bar'),
                        },
                        {
                            path: 'path2/foo',
                            createIfMissing: false,
                            updater: new raw_content_1.RawContent('asdf'),
                        },
                    ],
                    notes: 'some notes',
                    draft: true,
                }),
            ];
            const plugin = new merge_1.Merge(github, 'main', {});
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const candidate = newCandidates[0];
            const updates = candidate.pullRequest.updates;
            (0, chai_1.expect)(updates).lengthOf(2);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/foo', composite_1.CompositeUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'path2/foo', raw_content_1.RawContent);
            snapshot((0, helpers_1.dateSafe)(candidate.pullRequest.body.toString()));
            (0, chai_1.expect)(candidate.pullRequest.draft).to.be.true;
        });
        (0, mocha_1.it)('merges all labels for pull requests', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('python', 'python', '1.0.0', {
                    component: 'python-pkg',
                    updates: [
                        {
                            path: 'path1/foo',
                            createIfMissing: false,
                            updater: new raw_content_1.RawContent('foo'),
                        },
                    ],
                    labels: ['label-a', 'label-b'],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('node', 'node', '3.3.4', {
                    component: '@here/pkgA',
                    updates: [
                        {
                            path: 'path1/foo',
                            createIfMissing: false,
                            updater: new raw_content_1.RawContent('bar'),
                        },
                        {
                            path: 'path2/foo',
                            createIfMissing: false,
                            updater: new raw_content_1.RawContent('asdf'),
                        },
                    ],
                    labels: ['label-a', 'label-c'],
                }),
            ];
            const plugin = new merge_1.Merge(github, 'main', {});
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const candidate = newCandidates[0];
            (0, chai_1.expect)(candidate.pullRequest.labels).lengthOf(3);
            (0, chai_1.expect)(candidate.pullRequest.labels).to.eql([
                'label-a',
                'label-b',
                'label-c',
            ]);
            snapshot((0, helpers_1.dateSafe)(candidate.pullRequest.body.toString()));
        });
    });
});
//# sourceMappingURL=merge.js.map