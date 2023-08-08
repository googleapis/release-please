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
const sentence_case_1 = require("../../src/plugins/sentence-case");
const chai_1 = require("chai");
const github_1 = require("../../src/github");
const helpers_1 = require("../helpers");
(0, mocha_1.describe)('SentenceCase Plugin', () => {
    let github;
    beforeEach(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'node-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.describe)('processCommits', () => {
        (0, mocha_1.it)('converts description to sentence case', async () => {
            const plugin = new sentence_case_1.SentenceCase(github, 'main', {});
            const commits = await plugin.processCommits([
                ...(0, helpers_1.buildMockConventionalCommit)('fix: hello world'),
                ...(0, helpers_1.buildMockConventionalCommit)('fix: Goodnight moon'),
            ]);
            (0, chai_1.expect)(commits[0].message).to.equal('fix: Hello world');
            (0, chai_1.expect)(commits[1].message).to.equal('fix: Goodnight moon');
        });
        (0, mocha_1.it)('leaves reserved words lowercase', async () => {
            const plugin = new sentence_case_1.SentenceCase(github, 'main', {});
            const commits = await plugin.processCommits([
                ...(0, helpers_1.buildMockConventionalCommit)('feat: gRPC can now handle proxies'),
                ...(0, helpers_1.buildMockConventionalCommit)('fix: npm now rocks'),
            ]);
            (0, chai_1.expect)(commits[0].message).to.equal('feat: gRPC can now handle proxies');
            (0, chai_1.expect)(commits[1].message).to.equal('fix: npm now rocks');
        });
        (0, mocha_1.it)('handles sentences with now breaks', async () => {
            const plugin = new sentence_case_1.SentenceCase(github, 'main', {});
            const commits = await plugin.processCommits([
                ...(0, helpers_1.buildMockConventionalCommit)('feat: beep-boop-hello'),
                ...(0, helpers_1.buildMockConventionalCommit)('fix:log4j.foo.bar'),
            ]);
            (0, chai_1.expect)(commits[0].message).to.equal('feat: Beep-boop-hello');
            (0, chai_1.expect)(commits[1].message).to.equal('fix: Log4j.foo.bar');
        });
    });
    (0, mocha_1.it)('allows a custom list of specialWords to be provided', async () => {
        const plugin = new sentence_case_1.SentenceCase(github, 'main', {}, ['hello']);
        const commits = await plugin.processCommits([
            ...(0, helpers_1.buildMockConventionalCommit)('fix: hello world'),
            ...(0, helpers_1.buildMockConventionalCommit)('fix: Goodnight moon'),
        ]);
        (0, chai_1.expect)(commits[0].message).to.equal('fix: hello world');
        (0, chai_1.expect)(commits[1].message).to.equal('fix: Goodnight moon');
    });
    (0, mocha_1.it)('handles subject with multiple : characters', async () => {
        const plugin = new sentence_case_1.SentenceCase(github, 'main', {}, []);
        const commits = await plugin.processCommits([
            ...(0, helpers_1.buildMockConventionalCommit)('abc123'),
            ...(0, helpers_1.buildMockConventionalCommit)('fix: hello world:goodnight moon'),
        ]);
        (0, chai_1.expect)(commits[0].message).to.equal('fix: Hello world:goodnight moon');
    });
    (0, mocha_1.it)('handles commit with no :', async () => {
        const plugin = new sentence_case_1.SentenceCase(github, 'main', {}, []);
        const commits = await plugin.processCommits([
            ...(0, helpers_1.buildMockConventionalCommit)('hello world goodnight moon'),
        ]);
        // Ensure there's no exception, a commit without a <type> is not
        // a conventional commit, and will not show up in CHANGELOG. We
        // Do not bother sentence-casing:
        console.info(commits);
        (0, chai_1.expect)(commits.length).to.equal(0);
    });
});
//# sourceMappingURL=sentence-case.js.map