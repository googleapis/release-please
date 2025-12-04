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
import {GitHub, GH_API_URL, GH_GRAPHQL_URL, GH_URL} from '../src/github';
import {GL_API_URL} from '../src/gitlab';
import ProviderFactory, {ProviderOptions} from '../src/provider';
import {logger} from '../src/util/logger';

const sandbox = sinon.createSandbox();

let providerCreateStub: sinon.SinonStub;

const DEFAULT_PROVIDER_OPTIONS: ProviderOptions = {
  owner: 'googleapis',
  repo: 'release-please-cli',
  token: undefined,
  apiUrl: GH_API_URL,
  graphqlUrl: GH_GRAPHQL_URL,
  host: undefined,
  hostUrl: GH_URL,
};

function expectProviderCall(
  overrides: Partial<ProviderOptions> = {},
  provider = 'github'
) {
  sinon.assert.calledOnce(providerCreateStub);
  const [providerName, options] = providerCreateStub.getCall(0).args;
  expect(providerName).to.equal(provider);
  const expected: ProviderOptions = {
    ...DEFAULT_PROVIDER_OPTIONS,
    ...overrides,
  };
  expect(options).to.deep.equal(expected);
}

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

describe('CLI', () => {
  let fakeGitHub: GitHub;
  let fakeManifest: Manifest;
  beforeEach(async () => {
    fakeGitHub = await GitHub.create({
      owner: 'googleapis',
      repo: 'release-please-cli',
      defaultBranch: 'main',
    });
    fakeManifest = new Manifest(fakeGitHub, 'main', {}, {});
    providerCreateStub = sandbox
      .stub(ProviderFactory, 'create')
      .resolves(fakeGitHub);
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
      await await parser.parseAsync(
        'manifest-pr --repo-url=googleapis/release-please-cli'
      );

      expectProviderCall();
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

      expectProviderCall();
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

        expectProviderCall();
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

      expectProviderCall();
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

      expectProviderCall();
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

      expectProviderCall();
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

      expectProviderCall();
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

      expectProviderCall();
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

    //   expectProviderCall();
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

      expectProviderCall();
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

    it('supports gitlab provider with https repo URL', async () => {
      await parser.parseAsync(
        'manifest-pr --provider=gitlab --repo-url=https://gitlab.example.com/group/subgroup/project.git'
      );

      expectProviderCall(
        {
          owner: 'group/subgroup',
          repo: 'project',
          host: 'https://gitlab.example.com',
          hostUrl: 'https://gitlab.example.com',
          apiUrl: GL_API_URL,
          graphqlUrl: undefined,
        },
        'gitlab'
      );
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

    it('supports gitlab provider with SSH repo URL', async () => {
      await parser.parseAsync(
        'manifest-pr --provider=gitlab --repo-url=git@gitlab.example.com:group/project.git'
      );

      expectProviderCall(
        {
          owner: 'group',
          repo: 'project',
          host: 'https://gitlab.example.com',
          hostUrl: 'https://gitlab.example.com',
          apiUrl: GL_API_URL,
          graphqlUrl: undefined,
        },
        'gitlab'
      );
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
            prNumber: 123,
          },
        ]);
    });

    it('instantiates a basic Manifest', async () => {
      await parser.parseAsync(
        'manifest-release --repo-url=googleapis/release-please-cli'
      );

      expectProviderCall();
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

      expectProviderCall();
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

        expectProviderCall();
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

      expectProviderCall();
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

    it('handles --label and --release-label', async () => {
      await parser.parseAsync(
        'manifest-release --repo-url=googleapis/release-please-cli --label=foo,bar --release-label=asdf,qwer'
      );

      expectProviderCall();
      sinon.assert.calledOnceWithExactly(
        fromManifestStub,
        fakeGitHub,
        'main',
        DEFAULT_RELEASE_PLEASE_CONFIG,
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        sinon.match({labels: ['foo', 'bar'], releaseLabels: ['asdf', 'qwer']})
      );
      sinon.assert.calledOnce(createReleasesStub);
    });

    it('handles --draft', async () => {
      await parser.parseAsync(
        'manifest-release --repo-url=googleapis/release-please-cli --draft'
      );

      expectProviderCall();
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

    //   expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

          expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

          expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

      it('handles --prerelease-type', async () => {
        await parser.parseAsync(
          'release-pr --repo-url=googleapis/release-please-cli --release-type=java-yoshi --prerelease-type=alpha'
        );

        expectProviderCall();
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({
            releaseType: 'java-yoshi',
            prereleaseType: 'alpha',
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

        expectProviderCall();
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
          'release-pr --repo-url=googleapis/release-please-cli --release-type=ruby-yoshi --version-file=lib/foo/version.rb'
        );

        expectProviderCall();
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({
            releaseType: 'ruby-yoshi',
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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

        expectProviderCall();
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
    });
  });
  describe('release', () => {
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
              prNumber: 123,
            },
          ]);
      });

      it('instantiates a basic Manifest', async () => {
        await parser.parseAsync(
          'release --repo-url=googleapis/release-please-cli'
        );

        expectProviderCall();
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
          'release --repo-url=googleapis/release-please-cli --config-file=foo.json --manifest-file=.bar.json'
        );

        expectProviderCall();
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
            `release --repo-url=googleapis/release-please-cli ${flag}=1.x`
          );

          expectProviderCall();
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
          'release --repo-url=googleapis/release-please-cli --dry-run'
        );

        expectProviderCall();
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

      it('handles --label and --release-label', async () => {
        await parser.parseAsync(
          'release --repo-url=googleapis/release-please-cli --label=foo,bar --release-label=asdf,qwer'
        );

        expectProviderCall();
        sinon.assert.calledOnceWithExactly(
          fromManifestStub,
          fakeGitHub,
          'main',
          DEFAULT_RELEASE_PLEASE_CONFIG,
          DEFAULT_RELEASE_PLEASE_MANIFEST,
          sinon.match({labels: ['foo', 'bar'], releaseLabels: ['asdf', 'qwer']})
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --draft', async () => {
        await parser.parseAsync(
          'release --repo-url=googleapis/release-please-cli --draft'
        );

        expectProviderCall();
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
      //     'release --repo-url=googleapis/release-please-cli --release-as=2.3.4'
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
              prNumber: 123,
            },
          ]);
      });

      it('instantiates a basic Manifest', async () => {
        await parser.parseAsync(
          'release --repo-url=googleapis/release-please-cli --release-type=java-yoshi'
        );

        expectProviderCall();
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
          'release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --dry-run'
        );

        expectProviderCall();
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
          'release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --draft'
        );

        expectProviderCall();
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
          'release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --prerelease'
        );

        expectProviderCall();
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

      it('handles --label and --release-label', async () => {
        await parser.parseAsync(
          'release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --label=foo,bar --release-label=asdf,qwer'
        );

        expectProviderCall();
        sinon.assert.calledOnceWithExactly(
          fromConfigStub,
          fakeGitHub,
          'main',
          sinon.match({releaseType: 'java-yoshi'}),
          sinon.match({
            labels: ['foo', 'bar'],
            releaseLabels: ['asdf', 'qwer'],
          }),
          undefined
        );
        sinon.assert.calledOnce(createReleasesStub);
      });

      it('handles --path', async () => {
        await parser.parseAsync(
          'release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --path=submodule'
        );

        expectProviderCall();
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
          'release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --component=pkg1'
        );

        expectProviderCall();
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
          'release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --package-name=@foo/bar'
        );

        expectProviderCall();
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
          'release --repo-url=googleapis/release-please-cli --release-type=java-yoshi --monorepo-tags'
        );

        expectProviderCall();
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

  describe('github-release (deprecated alias)', () => {
    it('warns and delegates to release', async () => {
      const warnStub = sandbox.stub(logger, 'warn');
      const fromManifestStub = sandbox
        .stub(Manifest, 'fromManifest')
        .resolves(fakeManifest);
      const createReleasesStub = sandbox
        .stub(fakeManifest, 'createReleases')
        .resolves([]);

      await parser.parseAsync(
        'github-release --repo-url=googleapis/release-please-cli'
      );

      sinon.assert.calledOnceWithExactly(
        warnStub,
        'github-release is deprecated. Please use release instead.'
      );
      expectProviderCall();
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
      await await parser.parseAsync(
        'bootstrap --repo-url=googleapis/release-please-cli --release-type=java'
      );

      sinon.assert.calledOnceWithExactly(
        createPullStub,
        sinon.match({
          headBranchName: 'release-please/bootstrap/default',
        }),
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
      'release',
      'manifest-pr',
      'manifest-release',
      'github-release',
    ]) {
      it(cmd, () => {
        const freshParser = getFreshParser();
        freshParser.exitProcess(false);
        freshParser.showHelpOnFail(false);
        let stdout = '';
        let stderr = '';
        const stdoutStub = sandbox
          .stub(process.stdout, 'write')
          // coerce chunk into string while preserving yargs formatting
          .callsFake((chunk: string | Uint8Array) => {
            stdout += chunk.toString();
            return true;
          });
        const stderrStub = sandbox
          .stub(process.stderr, 'write')
          .callsFake((chunk: string | Uint8Array) => {
            stderr += chunk.toString();
            return true;
          });
        try {
          freshParser.parse([cmd, '--help']);
        } finally {
          stdoutStub.restore();
          stderrStub.restore();
        }
        snapshot(stdout);
        expect(stderr).to.equal('');
      });
    }
  });
});

function getFreshParser() {
  const modulePath = require.resolve('../src/bin/release-please');
  delete require.cache[modulePath];
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const freshModule = require('../src/bin/release-please') as {
    parser: typeof parser;
  };
  return freshModule.parser;
}
