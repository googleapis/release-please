"use strict";
// Copyright 2019 Google LLC
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
const chai_1 = require("chai");
const mocha_1 = require("mocha");
nock.disableNetConnect();
const fs_1 = require("fs");
const path_1 = require("path");
const snapshot = require("snap-shot-it");
const sinon = require("sinon");
const github_1 = require("../src/github");
const tag_name_1 = require("../src/util/tag-name");
const version_1 = require("../src/version");
const assert = require("assert");
const errors_1 = require("../src/errors");
const assert_1 = require("assert");
const pull_request_body_1 = require("../src/util/pull-request-body");
const pull_request_title_1 = require("../src/util/pull-request-title");
const codeSuggester = require("code-suggester");
const raw_content_1 = require("../src/updaters/raw-content");
const https_proxy_agent_1 = require("https-proxy-agent");
const http_proxy_agent_1 = require("http-proxy-agent");
const helpers_1 = require("./helpers");
const fixturesPath = './test/fixtures';
const sandbox = sinon.createSandbox();
(0, mocha_1.describe)('GitHub', () => {
    let github;
    let req;
    function getNock() {
        return nock('https://api.github.com/')
            .get('/repos/fake/fake')
            .optionally()
            .reply(200, {
            default_branch: 'main',
        });
    }
    (0, mocha_1.beforeEach)(async () => {
        // Reset this before each test so we get a consistent
        // set of requests (some things are cached).
        github = await github_1.GitHub.create({
            owner: 'fake',
            repo: 'fake',
            defaultBranch: 'main',
        });
        // This shared nock will take care of some common requests.
        req = getNock();
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('create', () => {
        (0, mocha_1.it)('allows configuring the default branch explicitly', async () => {
            const github = await github_1.GitHub.create({
                owner: 'some-owner',
                repo: 'some-repo',
                defaultBranch: 'some-branch',
            });
            (0, chai_1.expect)(github.repository.defaultBranch).to.eql('some-branch');
        });
        (0, mocha_1.it)('fetches the default branch', async () => {
            req.get('/repos/some-owner/some-repo').reply(200, {
                default_branch: 'some-branch-from-api',
            });
            const github = await github_1.GitHub.create({
                owner: 'some-owner',
                repo: 'some-repo',
            });
            (0, chai_1.expect)(github.repository.defaultBranch).to.eql('some-branch-from-api');
        });
        (0, mocha_1.it)('default agent is undefined when no proxy option passed ', () => {
            (0, chai_1.expect)(github_1.GitHub.createDefaultAgent('test_url')).eq(undefined);
        });
        (0, mocha_1.it)('should return a https agent', () => {
            (0, chai_1.expect)(github_1.GitHub.createDefaultAgent(github_1.GH_API_URL, {
                host: 'http://proxy.com',
                port: 3000,
            })).instanceof(https_proxy_agent_1.HttpsProxyAgent);
        });
        (0, mocha_1.it)('should throw error when baseUrl is an invalid url', () => {
            (0, chai_1.expect)(() => {
                github_1.GitHub.createDefaultAgent('invalid_url', {
                    host: 'http://proxy.com',
                    port: 3000,
                });
            }).to.throw('Invalid URL');
        });
        (0, mocha_1.it)('should return a http agent', () => {
            (0, chai_1.expect)(github_1.GitHub.createDefaultAgent('http://www.github.com', {
                host: 'http://proxy.com',
                port: 3000,
            })).instanceof(http_proxy_agent_1.HttpProxyAgent);
        });
    });
    (0, mocha_1.describe)('findFilesByFilename', () => {
        (0, mocha_1.it)('returns files matching the requested pattern', async () => {
            const fileSearchResponse = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'pom-file-search.json'), 'utf8'));
            req
                .get('/repos/fake/fake/git/trees/main?recursive=true')
                .reply(200, fileSearchResponse);
            const pomFiles = await github.findFilesByFilename('pom.xml');
            snapshot(pomFiles);
            req.done();
        });
        const prefixes = [
            'appengine',
            'appengine/',
            '/appengine',
            '/appengine/',
            'appengine\\',
            '\\appengine',
            '\\appengine\\',
        ];
        prefixes.forEach(prefix => {
            (0, mocha_1.it)(`scopes pattern matching files to prefix(${prefix})`, async () => {
                const fileSearchResponse = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'pom-file-search-with-prefix.json'), 'utf8'));
                req
                    .get('/repos/fake/fake/git/trees/main?recursive=true')
                    .reply(200, fileSearchResponse);
                const pomFiles = await github.findFilesByFilename('pom.xml', prefix);
                req.done();
                (0, chai_1.expect)(pomFiles).to.deep.equal(['pom.xml', 'foo/pom.xml']);
            });
        });
    });
    (0, mocha_1.describe)('findFilesByExtension', () => {
        (0, mocha_1.it)('returns files matching the requested pattern', async () => {
            const fileSearchResponse = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'pom-file-search.json'), 'utf8'));
            req
                .get('/repos/fake/fake/git/trees/main?recursive=true')
                .reply(200, fileSearchResponse);
            const pomFiles = await github.findFilesByExtension('xml');
            snapshot(pomFiles);
            req.done();
        });
        const prefixes = [
            'appengine',
            'appengine/',
            '/appengine',
            '/appengine/',
            'appengine\\',
            '\\appengine',
            '\\appengine\\',
        ];
        prefixes.forEach(prefix => {
            (0, mocha_1.it)(`scopes pattern matching files to prefix(${prefix})`, async () => {
                const fileSearchResponse = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'pom-file-search-with-prefix.json'), 'utf8'));
                req
                    .get('/repos/fake/fake/git/trees/main?recursive=true')
                    .reply(200, fileSearchResponse);
                const pomFiles = await github.findFilesByExtension('xml', prefix);
                req.done();
                (0, chai_1.expect)(pomFiles).to.deep.equal(['pom.xml', 'foo/pom.xml']);
            });
        });
        (0, mocha_1.it)('ensures the prefix is a directory', async () => {
            const fileSearchResponse = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'pom-file-search-with-prefix.json'), 'utf8'));
            req
                .get('/repos/fake/fake/git/trees/main?recursive=true')
                .reply(200, fileSearchResponse);
            const pomFiles = await github.findFilesByExtension('xml', 'appengine');
            req.done();
            (0, chai_1.expect)(pomFiles).to.deep.equal(['pom.xml', 'foo/pom.xml']);
        });
    });
    (0, mocha_1.describe)('getFileContents', () => {
        (0, mocha_1.beforeEach)(() => {
            const dataAPITreesResponse = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'github-data-api', 'data-api-trees-successful-response.json'), 'utf8'));
            req = req
                .get('/repos/fake/fake/git/trees/main?recursive=true')
                .reply(200, dataAPITreesResponse);
        });
        (0, mocha_1.it)('should support Github Data API in case of a big file', async () => {
            const dataAPIBlobResponse = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'github-data-api', 'data-api-blobs-successful-response.json'), 'utf8'));
            req = req
                .get('/repos/fake/fake/git/blobs/2f3d2c47bf49f81aca0df9ffc49524a213a2dc33')
                .reply(200, dataAPIBlobResponse);
            const fileContents = await github.getFileContents('package-lock.json');
            (0, chai_1.expect)(fileContents).to.have.property('content');
            (0, chai_1.expect)(fileContents).to.have.property('parsedContent');
            (0, chai_1.expect)(fileContents)
                .to.have.property('sha')
                .equal('2f3d2c47bf49f81aca0df9ffc49524a213a2dc33');
            snapshot(fileContents);
            req.done();
        });
        (0, mocha_1.it)('should throw a missing file error', async () => {
            await assert.rejects(async () => {
                await github.getFileContents('non-existent-file');
            }, errors_1.FileNotFoundError);
        });
    });
    (0, mocha_1.describe)('pullRequestIterator', () => {
        (0, mocha_1.it)('finds merged pull requests with labels', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'merged-pull-requests.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql,
            });
            const generator = github.pullRequestIterator('main');
            const pullRequests = [];
            for await (const pullRequest of generator) {
                pullRequests.push(pullRequest);
            }
            (0, chai_1.expect)(pullRequests).lengthOf(25);
            snapshot(pullRequests);
            req.done();
        });
        (0, mocha_1.it)('handles merged pull requests without files', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'merged-pull-requests-no-files.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql,
            });
            const generator = github.pullRequestIterator('main');
            const pullRequests = [];
            for await (const pullRequest of generator) {
                pullRequests.push(pullRequest);
            }
            (0, chai_1.expect)(pullRequests).lengthOf(25);
            snapshot(pullRequests);
            req.done();
        });
        (0, mocha_1.it)('uses REST API if files are not needed', async () => {
            req
                .get('/repos/fake/fake/pulls?base=main&state=closed&sort=updated&direction=desc')
                .reply(200, [
                {
                    head: {
                        ref: 'feature-branch',
                    },
                    base: {
                        ref: 'main',
                    },
                    number: 123,
                    title: 'some title',
                    body: 'some body',
                    labels: [{ name: 'label 1' }, { name: 'label 2' }],
                    merge_commit_sha: 'abc123',
                    merged_at: '2022-08-08T19:07:20Z',
                },
                {
                    head: {
                        ref: 'feature-branch',
                    },
                    base: {
                        ref: 'main',
                    },
                    number: 124,
                    title: 'merged title 2 ',
                    body: 'merged body 2',
                    labels: [{ name: 'label 1' }, { name: 'label 2' }],
                    merge_commit_sha: 'abc123',
                    merged_at: '2022-08-08T19:07:20Z',
                },
                {
                    head: {
                        ref: 'feature-branch',
                    },
                    base: {
                        ref: 'main',
                    },
                    number: 125,
                    title: 'closed title',
                    body: 'closed body',
                    labels: [{ name: 'label 1' }, { name: 'label 2' }],
                    merge_commit_sha: 'def234',
                },
            ]);
            const generator = github.pullRequestIterator('main', 'MERGED', 30, false);
            const pullRequests = [];
            for await (const pullRequest of generator) {
                pullRequests.push(pullRequest);
            }
            (0, chai_1.expect)(pullRequests).lengthOf(2);
            snapshot(pullRequests);
            req.done();
        });
    });
    (0, mocha_1.describe)('commitsSince', () => {
        (0, mocha_1.it)('finds commits up until a condition', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'commits-since.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql,
            });
            const targetBranch = 'main';
            const commitsSinceSha = await github.commitsSince(targetBranch, commit => {
                // this commit is the 2nd most recent
                return commit.sha === 'b29149f890e6f76ee31ed128585744d4c598924c';
            });
            (0, chai_1.expect)(commitsSinceSha.length).to.eql(1);
            snapshot(commitsSinceSha);
            req.done();
        });
        (0, mocha_1.it)('paginates through commits', async () => {
            const graphql1 = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'commits-since-page-1.json'), 'utf8'));
            const graphql2 = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'commits-since-page-2.json'), 'utf8'));
            req
                .post('/graphql')
                .reply(200, {
                data: graphql1,
            })
                .post('/graphql')
                .reply(200, {
                data: graphql2,
            });
            const targetBranch = 'main';
            const commitsSinceSha = await github.commitsSince(targetBranch, commit => {
                // this commit is on page 2
                return commit.sha === 'c6d9dfb03aa2dbe1abc329592af60713fe28586d';
            });
            (0, chai_1.expect)(commitsSinceSha.length).to.eql(11);
            snapshot(commitsSinceSha);
            req.done();
        });
        (0, mocha_1.it)('finds first commit of a multi-commit merge pull request', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'commits-since.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql,
            });
            const targetBranch = 'main';
            const commitsSinceSha = await github.commitsSince(targetBranch, commit => {
                var _a;
                // PR #6 was rebase/merged so it has 4 associated commits
                return ((_a = commit.pullRequest) === null || _a === void 0 ? void 0 : _a.number) === 6;
            });
            (0, chai_1.expect)(commitsSinceSha.length).to.eql(3);
            snapshot(commitsSinceSha);
            req.done();
        });
        (0, mocha_1.it)('limits pagination', async () => {
            const graphql1 = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'commits-since-page-1.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql1,
            });
            const targetBranch = 'main';
            const commitsSinceSha = await github.commitsSince(targetBranch, commit => {
                // this commit is on page 2
                return commit.sha === 'c6d9dfb03aa2dbe1abc329592af60713fe28586d';
            }, {
                maxResults: 10,
            });
            (0, chai_1.expect)(commitsSinceSha.length).to.eql(10);
            snapshot(commitsSinceSha);
            req.done();
        });
        (0, mocha_1.it)('returns empty commits if branch does not exist', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'commits-since-missing-branch.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql,
            });
            const targetBranch = 'main';
            const commitsSinceSha = await github.commitsSince(targetBranch, _commit => {
                return true;
            });
            (0, chai_1.expect)(commitsSinceSha.length).to.eql(0);
            req.done();
        });
        (0, mocha_1.it)('backfills commit files without pull requests', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'commits-since.json'), 'utf8'));
            req
                .post('/graphql')
                .reply(200, {
                data: graphql,
            })
                .get('/repos/fake/fake/commits/0cda26c2e7776748072ba5a24302474947b3ebbd')
                .reply(200, { files: [{ filename: 'abc' }] })
                .get('/repos/fake/fake/commits/c6d9dfb03aa2dbe1abc329592af60713fe28586d')
                .reply(200, { files: [{ filename: 'def' }] })
                .get('/repos/fake/fake/commits/c8f1498c92c323bfa8f5ffe84e0ade1c37e4ea6e')
                .reply(200, { files: [{ filename: 'ghi' }] });
            const targetBranch = 'main';
            const commitsSinceSha = await github.commitsSince(targetBranch, commit => {
                // this commit is the 2nd most recent
                return commit.sha === 'b29149f890e6f76ee31ed128585744d4c598924c';
            }, { backfillFiles: true });
            (0, chai_1.expect)(commitsSinceSha.length).to.eql(1);
            snapshot(commitsSinceSha);
            req.done();
        });
        (0, mocha_1.it)('backfills commit files for pull requests with lots of files', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'commits-since-many-files.json'), 'utf8'));
            req
                .post('/graphql')
                .reply(200, {
                data: graphql,
            })
                .get('/repos/fake/fake/commits/e6daec403626c9987c7af0d97b34f324cd84320a')
                .reply(200, { files: [{ filename: 'abc' }] });
            const targetBranch = 'main';
            const commitsSinceSha = await github.commitsSince(targetBranch, commit => {
                // this commit is the 2nd most recent
                return commit.sha === 'b29149f890e6f76ee31ed128585744d4c598924c';
            }, { backfillFiles: true });
            (0, chai_1.expect)(commitsSinceSha.length).to.eql(1);
            snapshot(commitsSinceSha);
            req.done();
        });
    });
    (0, mocha_1.describe)('mergeCommitIterator', () => {
        (0, mocha_1.it)('handles merged pull requests without files', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'commits-since-no-files.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql,
            });
            const generator = github.mergeCommitIterator('main');
            const commits = [];
            for await (const commit of generator) {
                commits.push(commit);
            }
            (0, chai_1.expect)(commits).lengthOf(2);
            snapshot(commits);
            req.done();
        });
    });
    (0, mocha_1.describe)('getCommitFiles', () => {
        (0, mocha_1.it)('fetches the list of files', async () => {
            req
                .get('/repos/fake/fake/commits/abc123')
                .reply(200, { files: [{ filename: 'abc' }] });
            const files = await github.getCommitFiles('abc123');
            (0, chai_1.expect)(files).to.eql(['abc']);
            req.done();
        });
        (0, mocha_1.it)('paginates', async () => {
            req
                .get('/repos/fake/fake/commits/abc123')
                .reply(200, { files: [{ filename: 'abc' }] }, {
                link: '<https://api.github.com/repos/fake/fake/commits/abc123?page=2>; rel="next", <https://api.github.com/repos/fake/fake/commits/abc123?page=2>; rel="last"',
            })
                .get('/repos/fake/fake/commits/abc123?page=2')
                .reply(200, { files: [{ filename: 'def' }] });
            const files = await github.getCommitFiles('abc123');
            (0, chai_1.expect)(files).to.eql(['abc', 'def']);
            req.done();
        });
    });
    (0, mocha_1.describe)('releaseIterator', () => {
        (0, mocha_1.it)('iterates through releases', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'releases.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql,
            });
            const generator = github.releaseIterator();
            const releases = [];
            for await (const release of generator) {
                releases.push(release);
            }
            (0, chai_1.expect)(releases).lengthOf(5);
        });
        (0, mocha_1.it)('iterates through up to 3 releases', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'releases.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql,
            });
            const generator = github.releaseIterator({ maxResults: 3 });
            const releases = [];
            for await (const release of generator) {
                releases.push(release);
            }
            (0, chai_1.expect)(releases).lengthOf(3);
        });
        (0, mocha_1.it)('correctly identifies draft releases', async () => {
            const graphql = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'releases.json'), 'utf8'));
            req.post('/graphql').reply(200, {
                data: graphql,
            });
            const generator = github.releaseIterator();
            let drafts = 0;
            for await (const release of generator) {
                if (release.draft) {
                    drafts++;
                }
            }
            (0, chai_1.expect)(drafts).eq(1);
        });
        (0, mocha_1.it)('iterates through a result withouth releases', async () => {
            req.post('/graphql').reply(200, {
                data: {
                    repository: {
                        releases: {
                            nodes: [],
                            pageInfo: {
                                endCursor: null,
                                hasNextPage: false,
                            },
                        },
                    },
                },
            });
            const generator = github.releaseIterator();
            const releases = [];
            for await (const release of generator) {
                releases.push(release);
            }
            (0, chai_1.expect)(releases).lengthOf(0);
        });
    });
    (0, mocha_1.describe)('createRelease', () => {
        let githubCreateReleaseSpy;
        (0, mocha_1.beforeEach)(async () => {
            githubCreateReleaseSpy = sandbox.spy(github['octokit'].repos, 'createRelease');
        });
        (0, mocha_1.it)('should create a release with a package prefix', async () => {
            req
                .post('/repos/fake/fake/releases', body => {
                snapshot(body);
                return true;
            })
                .reply(200, {
                id: 123456,
                tag_name: 'v1.2.3',
                draft: false,
                html_url: 'https://github.com/fake/fake/releases/v1.2.3',
                upload_url: 'https://uploads.github.com/repos/fake/fake/releases/1/assets{?name,label}',
                target_commitish: 'abc123',
                body: 'Some release notes response.',
            });
            const release = await github.createRelease({
                tag: new tag_name_1.TagName(version_1.Version.parse('1.2.3')),
                sha: 'abc123',
                notes: 'Some release notes',
            });
            req.done();
            sinon.assert.calledOnceWithExactly(githubCreateReleaseSpy, {
                name: undefined,
                owner: 'fake',
                repo: 'fake',
                tag_name: 'v1.2.3',
                body: 'Some release notes',
                target_commitish: 'abc123',
                draft: false,
                prerelease: false,
            });
            (0, chai_1.expect)(release).to.not.be.undefined;
            (0, chai_1.expect)(release.id).to.eql(123456);
            (0, chai_1.expect)(release.tagName).to.eql('v1.2.3');
            (0, chai_1.expect)(release.sha).to.eql('abc123');
            (0, chai_1.expect)(release.draft).to.be.false;
            (0, chai_1.expect)(release.uploadUrl).to.eql('https://uploads.github.com/repos/fake/fake/releases/1/assets{?name,label}');
            (0, chai_1.expect)(release.notes).to.eql('Some release notes response.');
        });
        (0, mocha_1.it)('should raise a DuplicateReleaseError if already_exists', async () => {
            req
                .post('/repos/fake/fake/releases', body => {
                snapshot(body);
                return true;
            })
                .reply(422, {
                message: 'Validation Failed',
                errors: [
                    {
                        resource: 'Release',
                        code: 'already_exists',
                        field: 'tag_name',
                    },
                ],
                documentation_url: 'https://docs.github.com/rest/reference/repos#create-a-release',
            });
            const promise = github.createRelease({
                tag: new tag_name_1.TagName(version_1.Version.parse('1.2.3')),
                sha: 'abc123',
                notes: 'Some release notes',
            });
            await assert.rejects(promise, error => {
                var _a;
                return (error instanceof errors_1.DuplicateReleaseError &&
                    (
                    // ensure stack contains calling method
                    (_a = error.stack) === null || _a === void 0 ? void 0 : _a.includes('GitHub.createRelease')) &&
                    !!error.cause);
            });
        });
        (0, mocha_1.it)('should raise a RequestError for other validation errors', async () => {
            req
                .post('/repos/fake/fake/releases', body => {
                snapshot(body);
                return true;
            })
                .reply(422, {
                message: 'Invalid request.\n\n"tag_name" wasn\'t supplied.',
                documentation_url: 'https://docs.github.com/rest/reference/repos#create-a-release',
            });
            const promise = github.createRelease({
                tag: new tag_name_1.TagName(version_1.Version.parse('1.2.3')),
                sha: 'abc123',
                notes: 'Some release notes',
            });
            await assert.rejects(promise, error => {
                var _a;
                return (error instanceof errors_1.GitHubAPIError &&
                    (
                    // ensure stack contains calling method
                    (_a = error.stack) === null || _a === void 0 ? void 0 : _a.includes('GitHub.createRelease')) &&
                    !!error.cause);
            });
        });
        (0, mocha_1.it)('should create a draft release', async () => {
            req
                .post('/repos/fake/fake/releases', body => {
                snapshot(body);
                return true;
            })
                .reply(200, {
                tag_name: 'v1.2.3',
                draft: true,
                html_url: 'https://github.com/fake/fake/releases/v1.2.3',
                upload_url: 'https://uploads.github.com/repos/fake/fake/releases/1/assets{?name,label}',
                target_commitish: 'abc123',
            });
            const release = await github.createRelease({
                tag: new tag_name_1.TagName(version_1.Version.parse('1.2.3')),
                sha: 'abc123',
                notes: 'Some release notes',
            }, { draft: true });
            req.done();
            sinon.assert.calledOnceWithExactly(githubCreateReleaseSpy, {
                name: undefined,
                owner: 'fake',
                repo: 'fake',
                tag_name: 'v1.2.3',
                body: 'Some release notes',
                target_commitish: 'abc123',
                draft: true,
                prerelease: false,
            });
            (0, chai_1.expect)(release).to.not.be.undefined;
            (0, chai_1.expect)(release.tagName).to.eql('v1.2.3');
            (0, chai_1.expect)(release.sha).to.eql('abc123');
            (0, chai_1.expect)(release.draft).to.be.true;
        });
        (0, mocha_1.it)('should create a prerelease release', async () => {
            req
                .post('/repos/fake/fake/releases', body => {
                snapshot(body);
                return true;
            })
                .reply(200, {
                id: 123456,
                tag_name: 'v1.2.3',
                draft: false,
                html_url: 'https://github.com/fake/fake/releases/v1.2.3',
                upload_url: 'https://uploads.github.com/repos/fake/fake/releases/1/assets{?name,label}',
                target_commitish: 'abc123',
            });
            const release = await github.createRelease({
                tag: new tag_name_1.TagName(version_1.Version.parse('1.2.3')),
                sha: 'abc123',
                notes: 'Some release notes',
            }, { prerelease: true });
            req.done();
            sinon.assert.calledOnceWithExactly(githubCreateReleaseSpy, {
                name: undefined,
                owner: 'fake',
                repo: 'fake',
                tag_name: 'v1.2.3',
                body: 'Some release notes',
                target_commitish: 'abc123',
                draft: false,
                prerelease: true,
            });
            (0, chai_1.expect)(release.id).to.eql(123456);
            (0, chai_1.expect)(release.tagName).to.eql('v1.2.3');
            (0, chai_1.expect)(release.sha).to.eql('abc123');
            (0, chai_1.expect)(release.draft).to.be.false;
        });
    });
    (0, mocha_1.describe)('commentOnIssue', () => {
        (0, mocha_1.it)('can create a comment', async () => {
            const createCommentResponse = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'create-comment-response.json'), 'utf8'));
            req
                .post('/repos/fake/fake/issues/1347/comments', body => {
                snapshot(body);
                return true;
            })
                .reply(201, createCommentResponse);
            const url = await github.commentOnIssue('This is a comment', 1347);
            (0, chai_1.expect)(url).to.eql('https://github.com/fake/fake/issues/1347#issuecomment-1');
        });
        (0, mocha_1.it)('propagates error', async () => {
            req.post('/repos/fake/fake/issues/1347/comments').reply(410, 'Gone');
            let thrown = false;
            try {
                await github.commentOnIssue('This is a comment', 1347);
                (0, assert_1.fail)('should have thrown');
            }
            catch (err) {
                thrown = true;
                (0, chai_1.expect)(err.status).to.eql(410);
            }
            (0, chai_1.expect)(thrown).to.be.true;
        });
    });
    (0, mocha_1.describe)('generateReleaseNotes', () => {
        (0, mocha_1.it)('can generate notes with previous tag', async () => {
            req
                .post('/repos/fake/fake/releases/generate-notes', body => {
                snapshot(body);
                return body;
            })
                .reply(200, {
                name: 'Release v1.0.0 is now available!',
                body: '##Changes in Release v1.0.0 ... ##Contributors @monalisa',
            });
            const notes = await github.generateReleaseNotes('v1.2.3', 'main', 'v1.2.2');
            (0, chai_1.expect)(notes).to.eql('##Changes in Release v1.0.0 ... ##Contributors @monalisa');
        });
        (0, mocha_1.it)('can generate notes without previous tag', async () => {
            req
                .post('/repos/fake/fake/releases/generate-notes', body => {
                snapshot(body);
                return body;
            })
                .reply(200, {
                name: 'Release v1.0.0 is now available!',
                body: '##Changes in Release v1.0.0 ... ##Contributors @monalisa',
            });
            const notes = await github.generateReleaseNotes('v1.2.3', 'main');
            (0, chai_1.expect)(notes).to.eql('##Changes in Release v1.0.0 ... ##Contributors @monalisa');
        });
    });
    (0, mocha_1.describe)('createReleasePullRequest', () => {
        (0, mocha_1.it)('should update file', async () => {
            const createPullRequestStub = sandbox
                .stub(codeSuggester, 'createPullRequest')
                .resolves(1);
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('existing-file', 'main')
                .resolves({
                sha: 'abc123',
                content: 'somecontent',
                parsedContent: 'somecontent',
                mode: '100644',
            });
            sandbox.stub(github, 'getPullRequest').withArgs(1).resolves({
                title: 'created title',
                headBranchName: 'release-please--branches--main',
                baseBranchName: 'main',
                number: 1,
                body: 'some body',
                labels: [],
                files: [],
            });
            const pullRequest = await github.createReleasePullRequest({
                title: pull_request_title_1.PullRequestTitle.ofTargetBranch('main'),
                body: new pull_request_body_1.PullRequestBody([]),
                labels: [],
                headRefName: 'release-please--branches--main',
                draft: false,
                updates: [
                    {
                        path: 'existing-file',
                        createIfMissing: false,
                        updater: new raw_content_1.RawContent('some content'),
                    },
                ],
            }, 'main');
            (0, chai_1.expect)(pullRequest.number).to.eql(1);
            sinon.assert.calledOnce(createPullRequestStub);
            const changes = createPullRequestStub.getCall(0).args[1];
            (0, chai_1.expect)(changes).to.not.be.undefined;
            (0, chai_1.expect)(changes.size).to.eql(1);
            (0, chai_1.expect)(changes.get('existing-file')).to.not.be.undefined;
        });
        (0, mocha_1.it)('should handle missing files', async () => {
            const createPullRequestStub = sandbox
                .stub(codeSuggester, 'createPullRequest')
                .resolves(1);
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('missing-file', 'main')
                .rejects(new errors_1.FileNotFoundError('missing-file'));
            sandbox.stub(github, 'getPullRequest').withArgs(1).resolves({
                title: 'created title',
                headBranchName: 'release-please--branches--main',
                baseBranchName: 'main',
                number: 1,
                body: 'some body',
                labels: [],
                files: [],
            });
            const pullRequest = await github.createReleasePullRequest({
                title: pull_request_title_1.PullRequestTitle.ofTargetBranch('main'),
                body: new pull_request_body_1.PullRequestBody([]),
                labels: [],
                headRefName: 'release-please--branches--main',
                draft: false,
                updates: [
                    {
                        path: 'missing-file',
                        createIfMissing: false,
                        updater: new raw_content_1.RawContent('some content'),
                    },
                ],
            }, 'main');
            (0, chai_1.expect)(pullRequest.number).to.eql(1);
            sinon.assert.calledOnce(createPullRequestStub);
            const changes = createPullRequestStub.getCall(0).args[1];
            (0, chai_1.expect)(changes).to.not.be.undefined;
            (0, chai_1.expect)(changes.size).to.eql(0);
        });
        (0, mocha_1.it)('should create missing file', async () => {
            const createPullRequestStub = sandbox
                .stub(codeSuggester, 'createPullRequest')
                .resolves(1);
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('missing-file', 'main')
                .rejects(new errors_1.FileNotFoundError('missing-file'));
            sandbox.stub(github, 'getPullRequest').withArgs(1).resolves({
                title: 'created title',
                headBranchName: 'release-please--branches--main',
                baseBranchName: 'main',
                number: 1,
                body: 'some body',
                labels: [],
                files: [],
            });
            const pullRequest = await github.createReleasePullRequest({
                title: pull_request_title_1.PullRequestTitle.ofTargetBranch('main'),
                body: new pull_request_body_1.PullRequestBody([]),
                labels: [],
                headRefName: 'release-please--branches--main',
                draft: false,
                updates: [
                    {
                        path: 'missing-file',
                        createIfMissing: true,
                        updater: new raw_content_1.RawContent('some content'),
                    },
                ],
            }, 'main');
            (0, chai_1.expect)(pullRequest.number).to.eql(1);
            sinon.assert.calledOnce(createPullRequestStub);
            const changes = createPullRequestStub.getCall(0).args[1];
            (0, chai_1.expect)(changes).to.not.be.undefined;
            (0, chai_1.expect)(changes.size).to.eql(1);
            (0, chai_1.expect)(changes.get('missing-file')).to.not.be.undefined;
        });
    });
    (0, mocha_1.describe)('createFileOnNewBranch', () => {
        (0, mocha_1.it)('forks a new branch if the branch does not exist', async () => {
            req = req
                .get('/repos/fake/fake/git/ref/heads%2Fbase-branch')
                .reply(200, {
                object: {
                    sha: 'abc123',
                },
            })
                .get('/repos/fake/fake/git/ref/heads%2Fnew-branch')
                .reply(404)
                .post('/repos/fake/fake/git/refs', body => {
                (0, chai_1.expect)(body.ref).to.eql('refs/heads/new-branch');
                (0, chai_1.expect)(body.sha).to.eql('abc123');
                return body;
            })
                .reply(201, {
                object: { sha: 'abc123' },
            })
                .put('/repos/fake/fake/contents/new-file.txt', body => {
                (0, chai_1.expect)(body.message).to.eql('Saving release notes');
                (0, chai_1.expect)(body.branch).to.eql('new-branch');
                (0, chai_1.expect)(Buffer.from(body.content, 'base64').toString('utf-8')).to.eql('some contents');
                return body;
            })
                .reply(201, {
                content: {
                    html_url: 'https://github.com/fake/fake/blob/new-file.txt',
                },
            });
            const url = await github.createFileOnNewBranch('new-file.txt', 'some contents', 'new-branch', 'base-branch');
            (0, chai_1.expect)(url).to.eql('https://github.com/fake/fake/blob/new-file.txt');
        });
        (0, mocha_1.it)('reuses an existing branch', async () => {
            req = req
                .get('/repos/fake/fake/git/ref/heads%2Fbase-branch')
                .reply(200, {
                object: {
                    sha: 'abc123',
                },
            })
                .get('/repos/fake/fake/git/ref/heads%2Fnew-branch')
                .reply(200, {
                object: {
                    sha: 'def234',
                },
            })
                .patch('/repos/fake/fake/git/refs/heads%2Fnew-branch', body => {
                (0, chai_1.expect)(body.force).to.be.true;
                (0, chai_1.expect)(body.sha).to.eql('abc123');
                return body;
            })
                .reply(200, {
                object: { sha: 'abc123' },
            })
                .put('/repos/fake/fake/contents/new-file.txt', body => {
                (0, chai_1.expect)(body.message).to.eql('Saving release notes');
                (0, chai_1.expect)(body.branch).to.eql('new-branch');
                (0, chai_1.expect)(Buffer.from(body.content, 'base64').toString('utf-8')).to.eql('some contents');
                return body;
            })
                .reply(201, {
                content: {
                    html_url: 'https://github.com/fake/fake/blob/new-file.txt',
                },
            });
            const url = await github.createFileOnNewBranch('new-file.txt', 'some contents', 'new-branch', 'base-branch');
            (0, chai_1.expect)(url).to.eql('https://github.com/fake/fake/blob/new-file.txt');
        });
    });
    (0, mocha_1.describe)('updatePullRequest', () => {
        (0, mocha_1.it)('handles a PR body that is too big', async () => {
            req = req.patch('/repos/fake/fake/pulls/123').reply(200, {
                number: 123,
                title: 'updated-title',
                body: 'updated body',
                labels: [],
                head: {
                    ref: 'abc123',
                },
                base: {
                    ref: 'def234',
                },
            });
            const pullRequest = {
                title: pull_request_title_1.PullRequestTitle.ofTargetBranch('main'),
                body: new pull_request_body_1.PullRequestBody((0, helpers_1.mockReleaseData)(1000), { useComponents: true }),
                labels: [],
                headRefName: 'release-please--branches--main',
                draft: false,
                updates: [],
            };
            const pullRequestOverflowHandler = new helpers_1.MockPullRequestOverflowHandler();
            const handleOverflowStub = sandbox
                .stub(pullRequestOverflowHandler, 'handleOverflow')
                .resolves('overflow message');
            await github.updatePullRequest(123, pullRequest, 'main', {
                pullRequestOverflowHandler,
            });
            sinon.assert.calledOnce(handleOverflowStub);
            req.done();
        });
    });
});
//# sourceMappingURL=github.js.map