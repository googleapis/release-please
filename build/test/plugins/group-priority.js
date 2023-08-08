"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const github_1 = require("../../src/github");
const group_priority_1 = require("../../src/plugins/group-priority");
const helpers_1 = require("../helpers");
(0, mocha_1.describe)('GroupPriority plugin', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'node-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.describe)('run', () => {
        (0, mocha_1.it)('prioritizes a group', async () => {
            const plugin = new group_priority_1.GroupPriority(github, 'main', {}, ['snapshot']);
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('path1', 'java', '1.2.3-SNAPSHOT', {
                    component: 'component1',
                    group: 'snapshot',
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('path2', 'java', '2.3.4', {
                    component: 'component2',
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('path3', 'java', '3.4.5', {
                    component: 'component3',
                }),
            ];
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            (0, chai_1.expect)(newCandidates[0].path).to.eql('path1');
        });
        (0, mocha_1.it)('falls back to all pull requests if prioritized group not found', async () => {
            const plugin = new group_priority_1.GroupPriority(github, 'main', {}, ['snapshot']);
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('path1', 'java', '1.2.3', {
                    component: 'component1',
                    group: 'group1',
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('path2', 'java', '2.3.4', {
                    component: 'component2',
                    group: 'group2',
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('path3', 'java', '3.4.5', {
                    component: 'component3',
                }),
            ];
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(3);
        });
    });
});
//# sourceMappingURL=group-priority.js.map