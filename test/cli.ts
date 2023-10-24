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

import {expect} from 'chai';
import {describe, it, afterEach, beforeEach} from 'mocha';
import * as sinon from 'sinon';

import {parser, handleError} from '../src/bin/release-please';
import {
  Manifest,
  DEFAULT_RELEASE_PLEASE_CONFIG,
  DEFAULT_RELEASE_PLEASE_MANIFEST,
} from '../src/manifest';
import snapshot = require('snap-shot-it');
import {GitHub} from '../src/github';
import {ParseCallback} from 'yargs';

const sandbox = sinon.createSandbox();

describe('CLI', () => {
  let fakeGitHub: GitHub;
  let fakeManifest: Manifest;
  let gitHubCreateStub: sinon.SinonStub;
  beforeEach(async () => {
    fakeGitHub = await GitHub.create({
      owner: 'googleapis',
      repo: 'release-please-cli',
      defaultBranch: 'main',
    });
    fakeManifest = new Manifest(fakeGitHub, 'main', {}, {});
    gitHubCreateStub = sandbox.stub(GitHub, 'create').resolves(fakeGitHub);
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('handleError', () => {
    it('handles an error', async () => {
      const stack = 'bad\nmore\nbad';
      const err = {
        body: {a: 1},
        status: 404,
        message: 'bad',
        stack,
      };
      const logs: string[] = [];
      handleError.logger = {
        error: (msg: string) => logs.push(msg),
      } as unknown as Console;
      handleError.yargsArgs = {debug: true, _: ['foobar'], $0: 'mocha?'};
      handleError(err);
      snapshot(logs);
    });

    it('needs yargs', async () => {
      handleError.yargsArgs = undefined;
      expect(() => handleError({message: '', stack: ''})).to.throw(
        'Set handleError.yargsArgs with a yargs.Arguments instance.'
      );
    });
  });
  describe('manifest-pr', () => {
    let fromManifestStub: sinon.SinonStub;
    let createPullRequestsStub: sinon.SinonStub;
    beforeEach(() => {
      fromManifestStub = sandbox
        .stub(Manifest, 'fromManifest')
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

    it('instantiates a basic Manifest', async () => {
      await parser.parseAsync(
        'manifest-pr --repo-url=googleapis/release-please-cli'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match.any
      );
      sinon.assert.calledOnce(createPullRequestsStub);
    });

    it('instantiates Manifest with custom config/manifest', async () => {
      await parser.parseAsync(
        'manifest-pr --repo-url=googleapis/release-please-cli --config-file=foo.json --manifest-file=.bar.json'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        'foo.json',
        '.bar.json',
        sinon.match.any
      );
      sinon.assert.calledOnce(createPullRequestsStub);
    });
    for (const flag of ['--target-branch', '--default-branch']) {
      it(`handles ${flag}`, async () => {
        await parser.parseAsync(
          `manifest-pr --repo-url=googleapis/release-please-cli ${flag}=1.x`
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          '1.x',
          DEFAULT_RELEASE_PLEASE_CONFIG,
          DEFAULT_RELEASE_PLEASE_MANIFEST,
          sinon.match.any
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });
    }

    it('handles --dry-run', async () => {
      const buildPullRequestsStub = sandbox
        .stub(fakeManifest, 'buildPullRequests')
        .resolves([]);

      await parser.parseAsync(
        'manifest-pr --repo-url=googleapis/release-please-cli --dry-run'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match.any
      );
      sinon.assert.calledOnce(buildPullRequestsStub);
    });

    it('handles --fork', async () => {
      await parser.parseAsync(
        'manifest-pr --repo-url=googleapis/release-please-cli --fork'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match({fork: true})
      );
      sinon.assert.calledOnce(createPullRequestsStub);
    });

    it('handles --label', async () => {
      await parser.parseAsync(
        'manifest-pr --repo-url=googleapis/release-please-cli --label=foo,bar'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match({labels: ['foo', 'bar']})
      );
      sinon.assert.calledOnce(createPullRequestsStub);
    });

    it('handles empty --label', async () => {
      await parser.parseAsync(
        'manifest-pr --repo-url=googleapis/release-please-cli --label='
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match({labels: []})
      );
      sinon.assert.calledOnce(createPullRequestsStub);
    });

    it('handles --skip-labeling', async () => {
      await parser.parseAsync(
        'manifest-pr --repo-url=googleapis/release-please-cli --skip-labeling'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match({skipLabeling: true})
      );
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

    it('handles --signoff', async () => {
      await parser.parseAsync(
        'manifest-pr --repo-url=googleapis/release-please-cli --signoff="Alice <alice@example.com>"'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match({signoff: 'Alice <alice@example.com>'})
      );
      sinon.assert.calledOnce(createPullRequestsStub);
    });
  });
  describe('manifest-release', () => {
    let fromManifestStub: sinon.SinonStub;
    let createReleasesStub: sinon.SinonStub;
    beforeEach(() => {
      fromManifestStub = sandbox
        .stub(Manifest, 'fromManifest')
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

    it('instantiates a basic Manifest', async () => {
      await parser.parseAsync(
        'manifest-release --repo-url=googleapis/release-please-cli'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match.any
      );
      sinon.assert.calledOnce(createReleasesStub);
    });

    it('instantiates Manifest with custom config/manifest', async () => {
      await parser.parseAsync(
        'manifest-release --repo-url=googleapis/release-please-cli --config-file=foo.json --manifest-file=.bar.json'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        'foo.json',
        '.bar.json',
        sinon.match.any
      );
      sinon.assert.calledOnce(createReleasesStub);
    });
    for (const flag of ['--target-branch', '--default-branch']) {
      it(`handles ${flag}`, async () => {
        await parser.parseAsync(
          `manifest-release --repo-url=googleapis/release-please-cli ${flag}=1.x`
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          '1.x',
          DEFAULT_RELEASE_PLEASE_CONFIG,
          DEFAULT_RELEASE_PLEASE_MANIFEST,
          sinon.match.any
        );
        sinon.assert.calledOnce(createReleasesStub);
      });
    }

    it('handles --dry-run', async () => {
      const buildReleasesStub = sandbox
        .stub(fakeManifest, 'buildReleases')
        .resolves([]);

      await parser.parseAsync(
        'manifest-release --repo-url=googleapis/release-please-cli --dry-run'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match.any
      );
      sinon.assert.calledOnce(buildReleasesStub);
    });

    it('handles --label, --release-label, and --prerelease-label', async () => {
      await parser.parseAsync(
        'manifest-release --repo-url=googleapis/release-please-cli --label=foo,bar --release-label=asdf,qwer --prerelease-label=preview1,preview2'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match({
          labels: ['foo', 'bar'],
          releaseLabels: ['asdf', 'qwer'],
          prereleaseLabels: ['preview1', 'preview2'],
        })
      );
      sinon.assert.calledOnce(createReleasesStub);
    });

    it('handles --draft', async () => {
      await parser.parseAsync(
        'manifest-release --repo-url=googleapis/release-please-cli --draft'
      );

      sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
        owner: 'googleapis',
        repo: 'release-please-cli',
        token: undefined,
        apiUrl: 'https://api.github.com',
        graphqlUrl: 'https://api.github.com',
        useGraphql: true,
        retries: 3,
        throttlingRetries: 3,
      });
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match({draft: true})
      );
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
  describe('release-pr', () => {
    describe('with manifest options', () => {
      let fromManifestStub: sinon.SinonStub;
      let createPullRequestsStub: sinon.SinonStub;
      beforeEach(() => {
        fromManifestStub = sandbox
          .stub(Manifest, 'fromManifest')
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

      it('instantiates a basic Manifest', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          'main',
          DEFAULT_RELEASE_PLEASE_CONFIG,
          DEFAULT_RELEASE_PLEASE_MANIFEST,
          sinon.match.any,
          undefined,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('instantiates Manifest with custom config/manifest', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --config-file=foo.json --manifest-file=.bar.json'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          'main',
          'foo.json',
          '.bar.json',
          sinon.match.any,
          undefined,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      for (const flag of ['--target-branch', '--default-branch']) {
        it(`handles ${flag}`, async () => {
          await parser.parseAsync(
            `release-pr --repo-url=googleapis/release-please-cli ${flag}=1.x`
          );

          sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
            owner: 'googleapis',
            repo: 'release-please-cli',
            token: undefined,
            apiUrl: 'https://api.github.com',
            graphqlUrl: 'https://api.github.com',
            useGraphql: true,
            retries: 3,
            throttlingRetries: 3,
          });
          sinon.assert.calledOnceWithExactly(
            fromManifestStub,
            fakeGitHub,
            '1.x',
            DEFAULT_RELEASE_PLEASE_CONFIG,
            DEFAULT_RELEASE_PLEASE_MANIFEST,
            sinon.match.any,
            undefined,
            undefined
          );
          sinon.assert.calledOnce(createPullRequestsStub);
        });
      }

      it('handles --dry-run', async () => {
        const buildPullRequestsStub = sandbox
          .stub(fakeManifest, 'buildPullRequests')
          .resolves([]);

        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --dry-run'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          'main',
          DEFAULT_RELEASE_PLEASE_CONFIG,
          DEFAULT_RELEASE_PLEASE_MANIFEST,
          sinon.match.any,
          undefined,
          undefined
        );
        sinon.assert.calledOnce(buildPullRequestsStub);
      });
    });
    describe('with release type options', () => {
      let fromConfigStub: sinon.SinonStub;
      let createPullRequestsStub: sinon.SinonStub;
      beforeEach(() => {
        fromConfigStub = sandbox
          .stub(Manifest, 'fromConfig')
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

      it('instantiates a basic Manifest', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      for (const flag of ['--target-branch', '--default-branch']) {
        it(`handles ${flag}`, async () => {
          await parser.parseAsync(
            `release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi ${flag}=1.x`
          );

          sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
            owner: 'googleapis',
            repo: 'release-please-cli',
            token: undefined,
            apiUrl: 'https://api.github.com',
            graphqlUrl: 'https://api.github.com',
            useGraphql: true,
            retries: 3,
            throttlingRetries: 3,
          });
          sinon.assert.calledOnceWithExactly(
            fromConfigStub,
            fakeGitHub,
            '1.x',
            sinon.match({releaseType: 'java-yoshi'}),
            sinon.match.any,
            undefined
          );
          sinon.assert.calledOnce(createPullRequestsStub);
        });
      }

      it('handles --dry-run', async () => {
        const buildPullRequestsStub = sandbox
          .stub(fakeManifest, 'buildPullRequests')
          .resolves([]);

        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --dry-run'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(buildPullRequestsStub);
      });

      it('handles --release-as', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --release-as=2.3.4'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', releaseAs: '2.3.4'}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --versioning-strategy', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --versioning-strategy=always-bump-patch'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({
            releaseType: 'java-yoshi',
            versioning: 'always-bump-patch',
          }),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --bump-minor-pre-major and --bump-patch-for-minor-pre-major', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --bump-minor-pre-major --bump-patch-for-minor-pre-major'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({
            releaseType: 'java-yoshi',
            bumpMinorPreMajor: true,
            bumpPatchForMinorPreMajor: true,
          }),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles java --extra-files', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --extra-files=foo/bar.java,asdf/qwer.java'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({
            releaseType: 'java-yoshi',
            extraFiles: ['foo/bar.java', 'asdf/qwer.java'],
          }),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles ruby --version-file', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=ruby --version-file=lib/foo/version.rb'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({
            releaseType: 'ruby',
            versionFile: 'lib/foo/version.rb',
          }),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --signoff', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --signoff="Alice <alice@example.com>"'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match({signoff: 'Alice <alice@example.com>'}),
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --changelog-path', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --changelog-path=docs/changes.md'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({
            releaseType: 'java-yoshi',
            changelogPath: 'docs/changes.md',
          }),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --changelog-type', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --changelog-type=github'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({
            releaseType: 'java-yoshi',
            changelogType: 'github',
          }),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --changelog-host', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --changelog-host=https://example.com'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({
            releaseType: 'java-yoshi',
            changelogHost: 'https://example.com',
          }),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });
      it('handles --draft-pull-request', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --draft-pull-request'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', draftPullRequest: true}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --fork', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --fork'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match({fork: true}),
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --path', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --path=submodule'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match.any,
          'submodule'
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --component', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --component=pkg1'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', component: 'pkg1'}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --package-name', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --package-name=@foo/bar'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', packageName: '@foo/bar'}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --monorepo-tags', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --monorepo-tags'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', includeComponentInTag: true}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });

      it('handles --reviewers', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --reviewers=sam,frodo'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', reviewers: ['sam', 'frodo']}),
          sinon.match({}),
          undefined
        );
        sinon.assert.calledOnce(createPullRequestsStub);
      });
    });
  });
  describe('github-release', () => {
    describe('with manifest options', () => {
      let fromManifestStub: sinon.SinonStub;
      let createReleasesStub: sinon.SinonStub;
      beforeEach(() => {
        fromManifestStub = sandbox
          .stub(Manifest, 'fromManifest')
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

      it('instantiates a basic Manifest', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          'main',
          DEFAULT_RELEASE_PLEASE_CONFIG,
          DEFAULT_RELEASE_PLEASE_MANIFEST,
          sinon.match.any
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('instantiates Manifest with custom config/manifest', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --config-file=foo.json --manifest-file=.bar.json'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          'main',
          'foo.json',
          '.bar.json',
          sinon.match.any
        );
        sinon.assert.calledOnce(createReleasesStub);
      });
      for (const flag of ['--target-branch', '--default-branch']) {
        it(`handles ${flag}`, async () => {
          await parser.parseAsync(
            `github-release --repo-url=googleapis/release-please-cli ${flag}=1.x`
          );

          sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
            owner: 'googleapis',
            repo: 'release-please-cli',
            token: undefined,
            apiUrl: 'https://api.github.com',
            graphqlUrl: 'https://api.github.com',
            useGraphql: true,
            retries: 3,
            throttlingRetries: 3,
          });
          sinon.assert.calledOnceWithExactly(
            fromManifestStub,
            fakeGitHub,
            '1.x',
            DEFAULT_RELEASE_PLEASE_CONFIG,
            DEFAULT_RELEASE_PLEASE_MANIFEST,
            sinon.match.any
          );
          sinon.assert.calledOnce(createReleasesStub);
        });
      }

      it('handles --dry-run', async () => {
        const buildReleasesStub = sandbox
          .stub(fakeManifest, 'buildReleases')
          .resolves([]);

        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --dry-run'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          'main',
          DEFAULT_RELEASE_PLEASE_CONFIG,
          DEFAULT_RELEASE_PLEASE_MANIFEST,
          sinon.match.any
        );
        sinon.assert.calledOnce(buildReleasesStub);
      });

      it('handles --label, --release-label, and --prerelease-label', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --label=foo,bar --release-label=asdf,qwer --prerelease-label=preview1,preview2'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          'main',
          DEFAULT_RELEASE_PLEASE_CONFIG,
          DEFAULT_RELEASE_PLEASE_MANIFEST,
          sinon.match({
            labels: ['foo', 'bar'],
            releaseLabels: ['asdf', 'qwer'],
            prereleaseLabels: ['preview1', 'preview2'],
          })
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --draft', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --draft'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          'main',
          DEFAULT_RELEASE_PLEASE_CONFIG,
          DEFAULT_RELEASE_PLEASE_MANIFEST,
          sinon.match({draft: true})
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      // it('handles --release-as', async () => {
      //   await parser.parseAsync(
      //     'github-release --repo-url=googleapis/release-please-cli --release-as=2.3.4'
      //   );
      // });
    });
    describe('with release type options', () => {
      let fromConfigStub: sinon.SinonStub;
      let createReleasesStub: sinon.SinonStub;
      beforeEach(() => {
        fromConfigStub = sandbox
          .stub(Manifest, 'fromConfig')
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

      it('instantiates a basic Manifest', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --dry-run', async () => {
        const buildReleasesStub = sandbox
          .stub(fakeManifest, 'buildReleases')
          .resolves([]);
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --dry-run'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(buildReleasesStub);
      });

      it('handles --draft', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --draft'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', draft: true}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --prerelease', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --prerelease'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', prerelease: true}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --label, --release-label, and prerelease-label', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --label=foo,bar --release-label=asdf,qwer --prerelease-label=preview1,preview2'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match({
            labels: ['foo', 'bar'],
            releaseLabels: ['asdf', 'qwer'],
            prereleaseLabels: ['preview1', 'preview2'],
          }),
          undefined
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --path', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --path=submodule'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match.any,
          'submodule'
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --component', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --component=pkg1'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', component: 'pkg1'}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --package-name', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --package-name=@foo/bar'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', packageName: '@foo/bar'}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --monorepo-tags', async () => {
        await parser.parseAsync(
          'github-release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --monorepo-tags'
        );

        sinon.assert.calledOnceWithExactly(gitHubCreateStub, {
          owner: 'googleapis',
          repo: 'release-please-cli',
          token: undefined,
          apiUrl: 'https://api.github.com',
          graphqlUrl: 'https://api.github.com',
          useGraphql: true,
          retries: 3,
          throttlingRetries: 3,
        });
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi', includeComponentInTag: true}),
          sinon.match.any,
          undefined
        );
        sinon.assert.calledOnce(createReleasesStub);
      });
    });
  });
  describe('bootstrap', () => {
    it('defaults path to .', async () => {
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
      await parser.parseAsync(
        'bootstrap --repo-url=googleapis/release-please-cli --release-type=java'
      );

      sinon.assert.calledOnceWithExactly(
        createPullStub,
        sinon.match({
          headBranchName: 'release-please/bootstrap/default',
        }),
        'main',
        'main',
        'chore: bootstrap releases for path: .',
        sinon.match.array,
        {}
      );
    });
  });

  describe('--help', () => {
    for (const cmd of [
      'release-pr',
      'github-release',
      'manifest-pr',
      'manifest-release',
    ]) {
      it(cmd, async done => {
        const parseCallback: ParseCallback = (_err, _argv, output) => {
          snapshot(output);
          done();
        };
        const foo = await parser.parseAsync(`${cmd} --help`, parseCallback);
        console.log(foo);
      });
    }
  });
});
