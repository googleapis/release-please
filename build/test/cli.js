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
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const sinon = require("sinon");
const release_please_1 = require("../src/bin/release-please");
const manifest_1 = require("../src/manifest");
const snapshot = require("snap-shot-it");
const github_1 = require("../src/github");
const sandbox = sinon.createSandbox();
// function callStub(
//   instance: Manifest,
//   method: ManifestMethod
// ): ManifestCallResult;
// function callStub(
//   instance: ReleasePR,
//   method: ReleasePRMethod
// ): ReleasePRCallResult;
// function callStub(
//   instance: GitHubRelease,
//   method: GitHubReleaseMethod
// ): GitHubReleaseCallResult;
// function callStub(
//   instance: Manifest | ReleasePR | GitHubRelease,
//   method: Method
// ): CallResult {
//   instanceToRun = instance;
//   methodCalled = method;
//   return Promise.resolve(undefined);
// }
(0, mocha_1.describe)('CLI', () => {
    let fakeGitHub;
    let fakeManifest;
    let gitHubCreateStub;
    (0, mocha_1.beforeEach)(async () => {
        fakeGitHub = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'release-please-cli',
            defaultBranch: 'main',
        });
        fakeManifest = new manifest_1.Manifest(fakeGitHub, 'main', {}, {});
        gitHubCreateStub = sandbox.stub(github_1.GitHub, 'create').resolves(fakeGitHub);
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('handleError', () => {
        (0, mocha_1.it)('handles an error', async () => {
            const stack = 'bad\nmore\nbad';
            const err = {
                body: { a: 1 },
                status: 404,
                message: 'bad',
                stack,
            };
            const logs = [];
            release_please_1.handleError.logger = {
                error: (msg) => logs.push(msg),
            };
            release_please_1.handleError.yargsArgs = { debug: true, _: ['foobar'], $0: 'mocha?' };
            (0, release_please_1.handleError)(err);
            snapshot(logs);
        });
        (0, mocha_1.it)('needs yargs', async () => {
            release_please_1.handleError.yargsArgs = undefined;
            (0, chai_1.expect)(() => (0, release_please_1.handleError)({ message: '', stack: '' })).to.throw('Set handleError.yargsArgs with a yargs.Arguments instance.');
        });
    });
    (0, mocha_1.describe)('manifest-pr', () => {
        let fromManifestStub;
        let createPullRequestsStub;
        (0, mocha_1.beforeEach)(() => {
            fromManifestStub = sandbox
                .stub(manifest_1.Manifest, 'fromManifest')
                .resolves(fakeManifest);
            createPullRequestsStub = sandbox
                .stub(fakeManifest, 'createPullRequests')
                .resolves([
                {
                    title: 'fake title',
                    body: 'fake body',
                    headBranchName: 'head-branch-name',
                    baseBranchName: 'base-branch-name',
                    number: 123,
                    files: [],
                    labels: [],
                },
            ]);
        });
        (0, mocha_1.it)('instantiates a basic Manifest', async () => {
            await await release_please_1.parser.parseAsync('manifest-pr --repo-url=googleapis/release-please-cli');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any);
            sinon.assert.calledOnce(createPullRequestsStub);
        });
        (0, mocha_1.it)('instantiates Manifest with custom config/manifest', async () => {
            await release_please_1.parser.parseAsync('manifest-pr --repo-url=googleapis/release-please-cli --config-file=foo.json --manifest-file=.bar.json');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', 'foo.json', '.bar.json', sinon.match.any);
            sinon.assert.calledOnce(createPullRequestsStub);
        });
        for (const flag of ['--target-branch', '--default-branch']) {
            (0, mocha_1.it)(`handles ${flag}`, async () => {
                await release_please_1.parser.parseAsync(`manifest-pr --repo-url=googleapis/release-please-cli ${flag}=1.x`);
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, '1.x', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
        }
        (0, mocha_1.it)('handles --dry-run', async () => {
            const buildPullRequestsStub = sandbox
                .stub(fakeManifest, 'buildPullRequests')
                .resolves([]);
            await release_please_1.parser.parseAsync('manifest-pr --repo-url=googleapis/release-please-cli --dry-run');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any);
            sinon.assert.calledOnce(buildPullRequestsStub);
        });
        (0, mocha_1.it)('handles --fork', async () => {
            await release_please_1.parser.parseAsync('manifest-pr --repo-url=googleapis/release-please-cli --fork');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match({ fork: true }));
            sinon.assert.calledOnce(createPullRequestsStub);
        });
        (0, mocha_1.it)('handles --label', async () => {
            await release_please_1.parser.parseAsync('manifest-pr --repo-url=googleapis/release-please-cli --label=foo,bar');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match({ labels: ['foo', 'bar'] }));
            sinon.assert.calledOnce(createPullRequestsStub);
        });
        (0, mocha_1.it)('handles empty --label', async () => {
            await release_please_1.parser.parseAsync('manifest-pr --repo-url=googleapis/release-please-cli --label=');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match({ labels: [] }));
            sinon.assert.calledOnce(createPullRequestsStub);
        });
        (0, mocha_1.it)('handles --skip-labeling', async () => {
            await release_please_1.parser.parseAsync('manifest-pr --repo-url=googleapis/release-please-cli --skip-labeling');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match({ skipLabeling: true }));
            sinon.assert.calledOnce(createPullRequestsStub);
        });
        // it('handles --draft', async () => {
        //   await parser.parseAsync(
        //     'manifest-pr --repo-url=googleapis/release-please-cli --draft'
        //   );
        //   sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        //     owner: 'googleapis',
        //     repo: 'release-please-cli',
        //     token: undefined,
        //     apiUrl: 'https://api.github.com',
        //     graphqlUrl: 'https://api.github.com',
        //   });
        //   sinon.assert.calledOnceWithExactly(
        //     fromManifestStub,
        //     fakeGitHub,
        //     'main',
        //     DEFAULT_RELEASE_PLEASE_CONFIG,
        //     DEFAULT_RELEASE_PLEASE_MANIFEST,
        //     {draft: true},
        //   );
        //   sinon.assert.calledOnce(createPullRequestsStub);
        // });
        (0, mocha_1.it)('handles --signoff', async () => {
            await release_please_1.parser.parseAsync('manifest-pr --repo-url=googleapis/release-please-cli --signoff="Alice <alice@example.com>"');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match({ signoff: 'Alice <alice@example.com>' }));
            sinon.assert.calledOnce(createPullRequestsStub);
        });
    });
    (0, mocha_1.describe)('manifest-release', () => {
        let fromManifestStub;
        let createReleasesStub;
        (0, mocha_1.beforeEach)(() => {
            fromManifestStub = sandbox
                .stub(manifest_1.Manifest, 'fromManifest')
                .resolves(fakeManifest);
            createReleasesStub = sandbox
                .stub(fakeManifest, 'createReleases')
                .resolves([
                {
                    id: 123456,
                    tagName: 'v1.2.3',
                    sha: 'abc123',
                    notes: 'some release notes',
                    url: 'url-of-release',
                    path: '.',
                    version: 'v1.2.3',
                    major: 1,
                    minor: 2,
                    patch: 3,
                },
            ]);
        });
        (0, mocha_1.it)('instantiates a basic Manifest', async () => {
            await release_please_1.parser.parseAsync('manifest-release --repo-url=googleapis/release-please-cli');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any);
            sinon.assert.calledOnce(createReleasesStub);
        });
        (0, mocha_1.it)('instantiates Manifest with custom config/manifest', async () => {
            await release_please_1.parser.parseAsync('manifest-release --repo-url=googleapis/release-please-cli --config-file=foo.json --manifest-file=.bar.json');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', 'foo.json', '.bar.json', sinon.match.any);
            sinon.assert.calledOnce(createReleasesStub);
        });
        for (const flag of ['--target-branch', '--default-branch']) {
            (0, mocha_1.it)(`handles ${flag}`, async () => {
                await release_please_1.parser.parseAsync(`manifest-release --repo-url=googleapis/release-please-cli ${flag}=1.x`);
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, '1.x', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any);
                sinon.assert.calledOnce(createReleasesStub);
            });
        }
        (0, mocha_1.it)('handles --dry-run', async () => {
            const buildReleasesStub = sandbox
                .stub(fakeManifest, 'buildReleases')
                .resolves([]);
            await release_please_1.parser.parseAsync('manifest-release --repo-url=googleapis/release-please-cli --dry-run');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any);
            sinon.assert.calledOnce(buildReleasesStub);
        });
        (0, mocha_1.it)('handles --label and --release-label', async () => {
            await release_please_1.parser.parseAsync('manifest-release --repo-url=googleapis/release-please-cli --label=foo,bar --release-label=asdf,qwer');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match({ labels: ['foo', 'bar'], releaseLabels: ['asdf', 'qwer'] }));
            sinon.assert.calledOnce(createReleasesStub);
        });
        (0, mocha_1.it)('handles --draft', async () => {
            await release_please_1.parser.parseAsync('manifest-release --repo-url=googleapis/release-please-cli --draft');
            sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                owner: 'googleapis',
                repo: 'release-please-cli',
                token: undefined,
                apiUrl: 'https://api.github.com',
                graphqlUrl: 'https://api.github.com',
            });
            sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match({ draft: true }));
            sinon.assert.calledOnce(createReleasesStub);
        });
        // it('handles --release-as', async () => {
        //   await parser.parseAsync(
        //     'manifest-release --repo-url=googleapis/release-please-cli --release-as=2.3.4'
        //   );
        //   sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        //     owner: 'googleapis',
        //     repo: 'release-please-cli',
        //     token: undefined,
        //     apiUrl: 'https://api.github.com',
        //     graphqlUrl: 'https://api.github.com',
        //   });
        //   sinon.assert.calledOnceWithExactly(
        //     fromManifestStub,
        //     fakeGitHub,
        //     'main',
        //     DEFAULT_RELEASE_PLEASE_CONFIG,
        //     DEFAULT_RELEASE_PLEASE_MANIFEST,
        //     sinon.match({releaseAs: '2.3.4'}),
        //   );
        //   sinon.assert.calledOnce(createReleasesStub);
        // });
    });
    (0, mocha_1.describe)('release-pr', () => {
        (0, mocha_1.describe)('with manifest options', () => {
            let fromManifestStub;
            let createPullRequestsStub;
            (0, mocha_1.beforeEach)(() => {
                fromManifestStub = sandbox
                    .stub(manifest_1.Manifest, 'fromManifest')
                    .resolves(fakeManifest);
                createPullRequestsStub = sandbox
                    .stub(fakeManifest, 'createPullRequests')
                    .resolves([
                    {
                        title: 'fake title',
                        body: 'fake body',
                        headBranchName: 'head-branch-name',
                        baseBranchName: 'base-branch-name',
                        number: 123,
                        files: [],
                        labels: [],
                    },
                ]);
            });
            (0, mocha_1.it)('instantiates a basic Manifest', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any, undefined, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('instantiates Manifest with custom config/manifest', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --config-file=foo.json --manifest-file=.bar.json');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', 'foo.json', '.bar.json', sinon.match.any, undefined, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            for (const flag of ['--target-branch', '--default-branch']) {
                (0, mocha_1.it)(`handles ${flag}`, async () => {
                    await release_please_1.parser.parseAsync(`release-pr --repo-url=googleapis/release-please-cli ${flag}=1.x`);
                    sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                        owner: 'googleapis',
                        repo: 'release-please-cli',
                        token: undefined,
                        apiUrl: 'https://api.github.com',
                        graphqlUrl: 'https://api.github.com',
                    });
                    sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, '1.x', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any, undefined, undefined);
                    sinon.assert.calledOnce(createPullRequestsStub);
                });
            }
            (0, mocha_1.it)('handles --dry-run', async () => {
                const buildPullRequestsStub = sandbox
                    .stub(fakeManifest, 'buildPullRequests')
                    .resolves([]);
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --dry-run');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any, undefined, undefined);
                sinon.assert.calledOnce(buildPullRequestsStub);
            });
        });
        (0, mocha_1.describe)('with release type options', () => {
            let fromConfigStub;
            let createPullRequestsStub;
            (0, mocha_1.beforeEach)(() => {
                fromConfigStub = sandbox
                    .stub(manifest_1.Manifest, 'fromConfig')
                    .resolves(fakeManifest);
                createPullRequestsStub = sandbox
                    .stub(fakeManifest, 'createPullRequests')
                    .resolves([
                    {
                        title: 'fake title',
                        body: 'fake body',
                        headBranchName: 'head-branch-name',
                        baseBranchName: 'base-branch-name',
                        number: 123,
                        files: [],
                        labels: [],
                    },
                ]);
            });
            (0, mocha_1.it)('instantiates a basic Manifest', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi' }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            for (const flag of ['--target-branch', '--default-branch']) {
                (0, mocha_1.it)(`handles ${flag}`, async () => {
                    await release_please_1.parser.parseAsync(`release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi ${flag}=1.x`);
                    sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                        owner: 'googleapis',
                        repo: 'release-please-cli',
                        token: undefined,
                        apiUrl: 'https://api.github.com',
                        graphqlUrl: 'https://api.github.com',
                    });
                    sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, '1.x', sinon.match({ releaseType: 'java-yoshi' }), sinon.match.any, undefined);
                    sinon.assert.calledOnce(createPullRequestsStub);
                });
            }
            (0, mocha_1.it)('handles --dry-run', async () => {
                const buildPullRequestsStub = sandbox
                    .stub(fakeManifest, 'buildPullRequests')
                    .resolves([]);
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --dry-run');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi' }), sinon.match.any, undefined);
                sinon.assert.calledOnce(buildPullRequestsStub);
            });
            (0, mocha_1.it)('handles --release-as', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --release-as=2.3.4');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', releaseAs: '2.3.4' }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --versioning-strategy', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --versioning-strategy=always-bump-patch');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({
                    releaseType: 'java-yoshi',
                    versioning: 'always-bump-patch',
                }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --bump-minor-pre-major and --bump-patch-for-minor-pre-major', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --bump-minor-pre-major --bump-patch-for-minor-pre-major');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({
                    releaseType: 'java-yoshi',
                    bumpMinorPreMajor: true,
                    bumpPatchForMinorPreMajor: true,
                }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles java --extra-files', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --extra-files=foo/bar.java,asdf/qwer.java');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({
                    releaseType: 'java-yoshi',
                    extraFiles: ['foo/bar.java', 'asdf/qwer.java'],
                }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles ruby --version-file', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=ruby-yoshi --version-file=lib/foo/version.rb');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({
                    releaseType: 'ruby-yoshi',
                    versionFile: 'lib/foo/version.rb',
                }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --signoff', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --signoff="Alice <alice@example.com>"');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi' }), sinon.match({ signoff: 'Alice <alice@example.com>' }), undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --changelog-path', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --changelog-path=docs/changes.md');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({
                    releaseType: 'java-yoshi',
                    changelogPath: 'docs/changes.md',
                }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --changelog-type', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --changelog-type=github');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({
                    releaseType: 'java-yoshi',
                    changelogType: 'github',
                }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --changelog-host', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --changelog-host=https://example.com');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({
                    releaseType: 'java-yoshi',
                    changelogHost: 'https://example.com',
                }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --draft-pull-request', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --draft-pull-request');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', draftPullRequest: true }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --fork', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --fork');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi' }), sinon.match({ fork: true }), undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --path', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --path=submodule');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi' }), sinon.match.any, 'submodule');
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --component', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --component=pkg1');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', component: 'pkg1' }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --package-name', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --package-name=@foo/bar');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', packageName: '@foo/bar' }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
            (0, mocha_1.it)('handles --monorepo-tags', async () => {
                await release_please_1.parser.parseAsync('release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --monorepo-tags');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', includeComponentInTag: true }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createPullRequestsStub);
            });
        });
    });
    (0, mocha_1.describe)('github-release', () => {
        (0, mocha_1.describe)('with manifest options', () => {
            let fromManifestStub;
            let createReleasesStub;
            (0, mocha_1.beforeEach)(() => {
                fromManifestStub = sandbox
                    .stub(manifest_1.Manifest, 'fromManifest')
                    .resolves(fakeManifest);
                createReleasesStub = sandbox
                    .stub(fakeManifest, 'createReleases')
                    .resolves([
                    {
                        id: 123456,
                        tagName: 'v1.2.3',
                        sha: 'abc123',
                        notes: 'some release notes',
                        url: 'url-of-release',
                        path: '.',
                        version: 'v1.2.3',
                        major: 1,
                        minor: 2,
                        patch: 3,
                    },
                ]);
            });
            (0, mocha_1.it)('instantiates a basic Manifest', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any);
                sinon.assert.calledOnce(createReleasesStub);
            });
            (0, mocha_1.it)('instantiates Manifest with custom config/manifest', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --config-file=foo.json --manifest-file=.bar.json');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', 'foo.json', '.bar.json', sinon.match.any);
                sinon.assert.calledOnce(createReleasesStub);
            });
            for (const flag of ['--target-branch', '--default-branch']) {
                (0, mocha_1.it)(`handles ${flag}`, async () => {
                    await release_please_1.parser.parseAsync(`github-release --repo-url=googleapis/release-please-cli ${flag}=1.x`);
                    sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                        owner: 'googleapis',
                        repo: 'release-please-cli',
                        token: undefined,
                        apiUrl: 'https://api.github.com',
                        graphqlUrl: 'https://api.github.com',
                    });
                    sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, '1.x', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any);
                    sinon.assert.calledOnce(createReleasesStub);
                });
            }
            (0, mocha_1.it)('handles --dry-run', async () => {
                const buildReleasesStub = sandbox
                    .stub(fakeManifest, 'buildReleases')
                    .resolves([]);
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --dry-run');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match.any);
                sinon.assert.calledOnce(buildReleasesStub);
            });
            (0, mocha_1.it)('handles --label and --release-label', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --label=foo,bar --release-label=asdf,qwer');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match({ labels: ['foo', 'bar'], releaseLabels: ['asdf', 'qwer'] }));
                sinon.assert.calledOnce(createReleasesStub);
            });
            (0, mocha_1.it)('handles --draft', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --draft');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromManifestStub, fakeGitHub, 'main', manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, sinon.match({ draft: true }));
                sinon.assert.calledOnce(createReleasesStub);
            });
            // it('handles --release-as', async () => {
            //   await parser.parseAsync(
            //     'github-release --repo-url=googleapis/release-please-cli --release-as=2.3.4'
            //   );
            // });
        });
        (0, mocha_1.describe)('with release type options', () => {
            let fromConfigStub;
            let createReleasesStub;
            (0, mocha_1.beforeEach)(() => {
                fromConfigStub = sandbox
                    .stub(manifest_1.Manifest, 'fromConfig')
                    .resolves(fakeManifest);
                createReleasesStub = sandbox
                    .stub(fakeManifest, 'createReleases')
                    .resolves([
                    {
                        id: 123456,
                        tagName: 'v1.2.3',
                        sha: 'abc123',
                        notes: 'some release notes',
                        url: 'url-of-release',
                        path: '.',
                        version: 'v1.2.3',
                        major: 1,
                        minor: 2,
                        patch: 3,
                    },
                ]);
            });
            (0, mocha_1.it)('instantiates a basic Manifest', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi' }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createReleasesStub);
            });
            (0, mocha_1.it)('handles --dry-run', async () => {
                const buildReleasesStub = sandbox
                    .stub(fakeManifest, 'buildReleases')
                    .resolves([]);
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --dry-run');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi' }), sinon.match.any, undefined);
                sinon.assert.calledOnce(buildReleasesStub);
            });
            (0, mocha_1.it)('handles --draft', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --draft');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', draft: true }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createReleasesStub);
            });
            (0, mocha_1.it)('handles --prerelease', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --prerelease');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', prerelease: true }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createReleasesStub);
            });
            (0, mocha_1.it)('handles --label and --release-label', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --label=foo,bar --release-label=asdf,qwer');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi' }), sinon.match({
                    labels: ['foo', 'bar'],
                    releaseLabels: ['asdf', 'qwer'],
                }), undefined);
                sinon.assert.calledOnce(createReleasesStub);
            });
            (0, mocha_1.it)('handles --path', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --path=submodule');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi' }), sinon.match.any, 'submodule');
                sinon.assert.calledOnce(createReleasesStub);
            });
            (0, mocha_1.it)('handles --component', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --component=pkg1');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', component: 'pkg1' }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createReleasesStub);
            });
            (0, mocha_1.it)('handles --package-name', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --package-name=@foo/bar');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', packageName: '@foo/bar' }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createReleasesStub);
            });
            (0, mocha_1.it)('handles --monorepo-tags', async () => {
                await release_please_1.parser.parseAsync('github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --monorepo-tags');
                sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
                    owner: 'googleapis',
                    repo: 'release-please-cli',
                    token: undefined,
                    apiUrl: 'https://api.github.com',
                    graphqlUrl: 'https://api.github.com',
                });
                sinon.assert.calledOnceWithExactly(fromConfigStub, fakeGitHub, 'main', sinon.match({ releaseType: 'java-yoshi', includeComponentInTag: true }), sinon.match.any, undefined);
                sinon.assert.calledOnce(createReleasesStub);
            });
        });
    });
    (0, mocha_1.describe)('bootstrap', () => {
        (0, mocha_1.it)('defaults path to .', async () => {
            const createPullStub = sandbox
                .stub(fakeGitHub, 'createPullRequest')
                .resolves({
                headBranchName: 'head-branch',
                baseBranchName: 'base-branch',
                number: 1234,
                title: 'pr-title',
                body: 'pr-body',
                labels: [],
                files: [],
            });
            await await release_please_1.parser.parseAsync('bootstrap --repo-url=googleapis/release-please-cli --release-type=java');
            sinon.assert.calledOnceWithExactly(createPullStub, sinon.match({
                headBranchName: 'release-please/bootstrap/default',
            }), 'main', 'chore: bootstrap releases for path: .', sinon.match.array, {});
        });
    });
    (0, mocha_1.describe)('--help', () => {
        for (const cmd of [
            'release-pr',
            'github-release',
            'manifest-pr',
            'manifest-release',
        ]) {
            (0, mocha_1.it)(cmd, async (done) => {
                const parseCallback = (_err, _argv, output) => {
                    snapshot(output);
                    done();
                };
                const foo = await release_please_1.parser.parseAsync(`${cmd} --help`, parseCallback);
                console.log(foo);
            });
        }
    });
});
//# sourceMappingURL=cli.js.map