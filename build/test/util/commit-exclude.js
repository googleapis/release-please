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
const commit_exclude_1 = require("../../src/util/commit-exclude");
const chai_1 = require("chai");
describe('commit-exclude', () => {
    const commitsPerPath = {
        '.': [
            {
                sha: 'pack1Pack2',
                message: 'commit pack1Pack2',
                files: ['pkg1/foo.txt', 'pkg2/bar.txt'],
            },
            {
                sha: 'rootCommit',
                message: 'commit root',
                files: ['foo.txt'],
            },
            {
                sha: 'pack3',
                message: 'commit pack3',
                files: ['pkg3/bar/foo.txt'],
            },
        ],
        pkg1: [
            {
                sha: 'pack1Pack2',
                message: 'commit pack1Pack2',
                files: ['pkg1/foo.txt', 'pkg2/bar.txt'],
            },
        ],
        pkg2: [
            {
                sha: 'pack1Pack2',
                message: 'commit pack1Pack2',
                files: ['pkg1/foo.txt', 'pkg2/bar.txt'],
            },
        ],
        pkg3: [
            {
                sha: 'pack3',
                message: 'commit pack3',
                files: ['pkg3/foo.txt'],
            },
            {
                sha: 'pack3sub',
                message: 'commit pack3sub',
                files: ['pkg3/bar/foo.txt'],
            },
        ],
        pkg4: [
            {
                sha: 'pack3',
                message: 'commit pack3',
                files: ['pkg3/foo.txt'],
            },
            {
                sha: 'pack3sub',
                message: 'commit pack3sub',
                files: ['pkg3/bar/foo.txt'],
            },
        ],
    };
    it('should not exclude anything if paths are empty', () => {
        const config = {};
        const commitExclude = new commit_exclude_1.CommitExclude(config);
        const newCommitsPerPath = commitExclude.excludeCommits(commitsPerPath);
        (0, chai_1.expect)(newCommitsPerPath['.'].length).to.equal(3);
        (0, chai_1.expect)(newCommitsPerPath['pkg1'].length).to.equal(1);
        (0, chai_1.expect)(newCommitsPerPath['pkg2'].length).to.equal(1);
        (0, chai_1.expect)(newCommitsPerPath['pkg3'].length).to.equal(2);
    });
    it('should not exclude only if all files are from excluded path', () => {
        const config = {
            '.': { excludePaths: ['pkg3', 'pkg1'] },
            pkg3: { excludePaths: ['pkg3/bar'] },
        };
        const commitExclude = new commit_exclude_1.CommitExclude(config);
        const newCommitsPerPath = commitExclude.excludeCommits(commitsPerPath);
        (0, chai_1.expect)(newCommitsPerPath['.'].length).to.equal(2);
        (0, chai_1.expect)(newCommitsPerPath['pkg1'].length).to.equal(1);
        (0, chai_1.expect)(newCommitsPerPath['pkg2'].length).to.equal(1);
        (0, chai_1.expect)(newCommitsPerPath['pkg3'].length).to.equal(1);
    });
    it('should exclude if all files are from excluded path', () => {
        const config = {
            '.': { excludePaths: ['pkg3', 'pkg1', 'pkg2'] },
        };
        const commitExclude = new commit_exclude_1.CommitExclude(config);
        const newCommitsPerPath = commitExclude.excludeCommits(commitsPerPath);
        (0, chai_1.expect)(newCommitsPerPath['.'].length).to.equal(1);
        (0, chai_1.expect)(newCommitsPerPath['pkg1'].length).to.equal(1);
        (0, chai_1.expect)(newCommitsPerPath['pkg2'].length).to.equal(1);
        (0, chai_1.expect)(newCommitsPerPath['pkg3'].length).to.equal(2);
    });
    it('should make decision only on relevant files', () => {
        const createCommit = (files) => {
            const first = files[0];
            return {
                sha: first.split('/')[0],
                message: `commit ${first}`,
                files,
            };
        };
        const commits = {
            a: [createCommit(['a/b/c', 'd/e/f', 'd/e/g'])],
            d: [createCommit(['a/b/c', 'd/e/f', 'd/e/g'])],
        };
        const config = {
            d: { excludePaths: ['d/e'] },
        };
        const commitExclude = new commit_exclude_1.CommitExclude(config);
        const newCommitsPerPath = commitExclude.excludeCommits(commits);
        (0, chai_1.expect)(newCommitsPerPath['a'].length).to.equal(1);
        (0, chai_1.expect)(newCommitsPerPath['d'].length).to.equal(0);
    });
});
//# sourceMappingURL=commit-exclude.js.map