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

import {describe, it, beforeEach, afterEach} from 'mocha';
import {
  DEFAULT_CUSTOM_VERSION_LABEL,
  DEFAULT_RELEASE_PLEASE_MANIFEST,
  Manifest,
  ManifestConfig,
} from '../src/manifest';
import {GitHub, ReleaseOptions} from '../src/github';
import * as githubModule from '../src/github';
import * as sinon from 'sinon';
import {
  buildGitHubFileContent,
  buildGitHubFileRaw,
  assertHasUpdate,
  dateSafe,
  safeSnapshot,
  mockCommits,
  mockReleases,
  mockTags,
  assertNoHasUpdate,
  mockReleaseData,
} from './helpers';
import {expect} from 'chai';
import * as assert from 'assert';
import {Version} from '../src/version';
import {PullRequest} from '../src/pull-request';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as pluginFactory from '../src/factories/plugin-factory';
import {SentenceCase} from '../src/plugins/sentence-case';
import {NodeWorkspace} from '../src/plugins/node-workspace';
import {CargoWorkspace} from '../src/plugins/cargo-workspace';
import {PullRequestTitle} from '../src/util/pull-request-title';
import {PullRequestBody} from '../src/util/pull-request-body';
import {RawContent} from '../src/updaters/raw-content';
import {TagName} from '../src/util/tag-name';
import snapshot = require('snap-shot-it');
import {
  DuplicateReleaseError,
  FileNotFoundError,
  ConfigurationError,
  GitHubAPIError,
} from '../src/errors';
import {RequestError} from '@octokit/request-error';
import * as nock from 'nock';
import {LinkedVersions} from '../src/plugins/linked-versions';
import {MavenWorkspace} from '../src/plugins/maven-workspace';
import {GraphqlResponseError} from '@octokit/graphql';

nock.disableNetConnect();

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures';

function mockPullRequests(
  github: GitHub,
  openPullRequests: PullRequest[],
  mergedPullRequests: PullRequest[] = [],
  closedPullRequests: PullRequest[] = []
): sinon.SinonStub {
  async function* fakeGenerator() {
    for (const pullRequest of openPullRequests) {
      yield pullRequest;
    }
  }
  async function* mergedGenerator() {
    for (const pullRequest of mergedPullRequests) {
      yield pullRequest;
    }
  }
  async function* closedGenerator() {
    for (const pullRequest of closedPullRequests) {
      yield pullRequest;
    }
  }
  return sandbox
    .stub(github, 'pullRequestIterator')
    .withArgs(sinon.match.string, 'OPEN')
    .returns(fakeGenerator())
    .withArgs(sinon.match.string, 'MERGED')
    .returns(mergedGenerator())
    .withArgs(sinon.match.string, 'CLOSED')
    .returns(closedGenerator());
}

function mockCreateRelease(
  github: GitHub,
  releases: {
    id: number;
    sha: string;
    tagName: string;
    draft?: boolean;
    prerelease?: boolean;
    duplicate?: boolean;
  }[]
): sinon.SinonStub {
  const releaseStub = sandbox.stub(github, 'createRelease');
  for (const {id, sha, tagName, draft, duplicate} of releases) {
    const stub = releaseStub.withArgs(
      sinon.match.has(
        'tag',
        sinon.match((tag: TagName) => tag.toString() === tagName)
      )
    );
    if (duplicate) {
      stub.rejects(
        new DuplicateReleaseError(
          new RequestError('dup', 400, {
            response: {
              headers: {},
              status: 400,
              url: '',
              data: '',
            },
            request: {
              headers: {},
              method: 'POST',
              url: '',
            },
          }),
          tagName
        )
      );
    } else {
      stub.resolves({
        id,
        tagName,
        sha,
        url: 'https://path/to/release',
        notes: 'some release notes',
        draft,
      });
    }
  }
  return releaseStub;
}

function pullRequestBody(path: string): string {
  return readFileSync(resolve(fixturesPath, path), 'utf8').replace(
    /\r\n/g,
    '\n'
  );
}

describe('Manifest', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'fake-owner',
      repo: 'fake-repo',
      defaultBranch: 'main',
      token: 'fake-token',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('fromManifest', () => {
    it('should parse config and manifest from repository', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'main')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'manifest/config/config.json')
        )
        .withArgs('.release-please-manifest.json', 'main')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch
      );
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(8);
      expect(Object.keys(manifest.releasedVersions)).lengthOf(8);
    });
    it('should fetch config and manifest from changes-branch when specified', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'manifest/config/config.json')
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(8);
      expect(Object.keys(manifest.releasedVersions)).lengthOf(8);
    });
    it('should limit manifest loading to the given path', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'manifest/config/config.json')
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'},
        'packages/gcf-utils'
      );
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(
        manifest.repositoryConfig['packages/gcf-utils'].releaseType
      ).to.eql('node');
      expect(Object.keys(manifest.releasedVersions)).lengthOf(8);
    });
    it('should override release-as with the given argument', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'manifest/config/config.json')
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'},
        'packages/gcf-utils',
        '12.34.56'
      );
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(manifest.repositoryConfig['packages/gcf-utils'].releaseAs).to.eql(
        '12.34.56'
      );
      expect(Object.keys(manifest.releasedVersions)).lengthOf(8);
    });
    it('should read the default release-type from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/root-release-type.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].releaseType).to.eql('java-yoshi');
      expect(manifest.repositoryConfig['node-package'].releaseType).to.eql(
        'node'
      );
    });
    it('should read custom pull request title patterns from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/group-pr-title-pattern.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest['groupPullRequestTitlePattern']).to.eql(
        'chore${scope}: release${component} v${version}'
      );
      expect(
        manifest.repositoryConfig['packages/cron-utils'].pullRequestTitlePattern
      ).to.eql('chore${scope}: send it v${version}');
    });

    it('should read custom tag separator from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/tag-separator.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].tagSeparator).to.eql('-');
      expect(
        manifest.repositoryConfig['packages/bot-config-utils'].tagSeparator
      ).to.eql('/');
    });

    it('should read extra files from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/extra-files.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].extraFiles).to.eql([
        'default.txt',
        {
          type: 'json',
          path: 'path/default.json',
          jsonpath: '$.version',
        },
      ]);
      expect(
        manifest.repositoryConfig['packages/bot-config-utils'].extraFiles
      ).to.eql([
        'foo.txt',
        {
          type: 'json',
          path: 'path/bar.json',
          jsonpath: '$.version',
        },
      ]);
    });

    it('should read custom include component in tag from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/include-component-in-tag.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].includeComponentInTag).to.be.false;
      expect(
        manifest.repositoryConfig['packages/bot-config-utils']
          .includeComponentInTag
      ).to.be.true;
    });

    it('should read custom include v in tag from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/include-v-in-tag.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].includeVInTag).to.be.false;
      expect(
        manifest.repositoryConfig['packages/bot-config-utils'].includeVInTag
      ).to.be.true;
    });

    it('should read custom labels from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'manifest/config/labels.json')
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest['labels']).to.deep.equal(['custom: pending']);
      expect(manifest['releaseLabels']).to.deep.equal(['custom: tagged']);
      expect(manifest['prereleaseLabels']).to.deep.equal([
        'custom: pre-release',
      ]);
    });

    it('should read reviewers from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'manifest/config/reviewers.json')
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest['reviewers']).to.deep.equal(['sam', 'frodo']);
    });

    it('should read extra labels from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/extra-labels.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].extraLabels).to.deep.equal([
        'lang: java',
      ]);
      expect(manifest.repositoryConfig['node-lib'].extraLabels).to.deep.equal([
        'lang: nodejs',
      ]);
    });
    it('should read exclude paths from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/exclude-paths.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].excludePaths).to.deep.equal([
        'path-root-ignore',
      ]);
      expect(manifest.repositoryConfig['node-lib'].excludePaths).to.deep.equal([
        'path-ignore',
      ]);
    });
    it('should build simple plugins from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'manifest/config/plugins.json')
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.plugins).lengthOf(2);
      expect(manifest.plugins[0]).instanceOf(NodeWorkspace);
      expect(manifest.plugins[1]).instanceOf(CargoWorkspace);
    });
    it('should build complex plugins from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/complex-plugins.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.plugins).lengthOf(1);
      expect(manifest.plugins[0]).instanceOf(LinkedVersions);
      const plugin = manifest.plugins[0] as LinkedVersions;
      expect(plugin.groupName).to.eql('grouped components');
      expect(plugin.components).to.eql(new Set(['pkg2', 'pkg3']));
    });
    it('should build maven-workspace from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/maven-workspace-plugins.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.plugins).lengthOf(1);
      expect(manifest.plugins[0]).instanceOf(MavenWorkspace);
      const plugin = manifest.plugins[0] as MavenWorkspace;
      expect(plugin.considerAllArtifacts).to.be.true;
    });
    it('should configure search depth from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/search-depth.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.releaseSearchDepth).to.eql(10);
      expect(manifest.commitSearchDepth).to.eql(50);
    });

    it('should read changelog host from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/changelog-host.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].changelogHost).to.eql(
        'https://example.com'
      );
      expect(
        manifest.repositoryConfig['packages/bot-config-utils'].changelogHost
      ).to.eql('https://override.example.com');
    });

    it('should read changelog type from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/changelog-type.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].changelogType).to.eql('github');
      expect(
        manifest.repositoryConfig['packages/bot-config-utils'].changelogType
      ).to.eql('default');
    });

    it('should read changelog path from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/changelog-path.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].changelogPath).to.eql(
        'docs/foo.md'
      );
      expect(
        manifest.repositoryConfig['packages/bot-config-utils'].changelogPath
      ).to.eql('docs/bar.md');
    });

    it('should read versioning type from manifest', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/config/versioning.json'
          )
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      const manifest = await Manifest.fromManifest(
        github,
        github.repository.defaultBranch,
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      expect(manifest.repositoryConfig['.'].versioning).to.eql(
        'always-bump-patch'
      );
      expect(
        manifest.repositoryConfig['packages/bot-config-utils'].versioning
      ).to.eql('default');
    });

    it('should throw a configuration error for a missing manifest config', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .rejects(new FileNotFoundError('.release-please-config.json'))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      await assert.rejects(async () => {
        await Manifest.fromManifest(
          github,
          github.repository.defaultBranch,
          undefined,
          undefined,
          {changesBranch: 'next'}
        );
      }, ConfigurationError);
    });

    it('should throw a configuration error for a missing manifest versions file', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'manifest/config/config.json')
        )
        .withArgs('.release-please-manifest.json', 'next')
        .rejects(new FileNotFoundError('.release-please-manifest.json'));
      await assert.rejects(async () => {
        await Manifest.fromManifest(
          github,
          github.repository.defaultBranch,
          undefined,
          undefined,
          {changesBranch: 'next'}
        );
      }, ConfigurationError);
    });

    it('should throw a configuration error for a malformed manifest config', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw('{"malformed json"'))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/versions/versions.json'
          )
        );
      await assert.rejects(
        async () => {
          await Manifest.fromManifest(
            github,
            github.repository.defaultBranch,
            undefined,
            undefined,
            {changesBranch: 'next'}
          );
        },
        e => {
          console.log(e);
          return e instanceof ConfigurationError && e.message.includes('parse');
        }
      );
    });

    it('should throw a configuration error for a malformed manifest config', async () => {
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('release-please-config.json', 'next')
        .resolves(
          buildGitHubFileContent(fixturesPath, 'manifest/config/config.json')
        )
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(buildGitHubFileRaw('{"malformed json"'));
      await assert.rejects(
        async () => {
          await Manifest.fromManifest(
            github,
            github.repository.defaultBranch,
            undefined,
            undefined,
            {changesBranch: 'next'}
          );
        },
        e => {
          console.log(e);
          return e instanceof ConfigurationError && e.message.includes('parse');
        }
      );
    });
  });

  describe('fromConfig', () => {
    it('should pass strategy options to the strategy', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'v1.2.3',
          sha: 'abc123',
          url: 'http://path/to/release',
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(Object.keys(manifest.releasedVersions)).lengthOf(1);
    });
    it('should find custom release pull request title', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--components--foobar',
            baseBranchName: 'main',
            title: 'release: 1.2.3',
            number: 123,
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'v1.2.3',
          sha: 'abc123',
          url: 'http://path/to/release',
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        pullRequestTitlePattern: 'release: ${version}',
        component: 'foobar',
        includeComponentInTag: false,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(Object.keys(manifest.releasedVersions)).lengthOf(1);
    });
    it('finds previous release without tag', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            title: 'chore: release 1.2.3',
            headBranchName:
              'release-please--branches--main--components--foobar',
            baseBranchName: 'main',
            number: 123,
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'v1.2.3',
          sha: 'abc123',
          url: 'http://path/to/release',
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        component: 'foobar',
        includeComponentInTag: false,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(Object.keys(manifest.releasedVersions)).lengthOf(1);
    });
    it('finds previous release with tag', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/foobar',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release foobar 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'foobar-v1.2.3',
          sha: 'abc123',
          url: 'http://path/to/release',
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        component: 'foobar',
        includeComponentInTag: true,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(Object.keys(manifest.releasedVersions)).lengthOf(1);
    });
    it('finds manually tagged release', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/foobar',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release foobar 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'other-v3.3.3',
          sha: 'abc123',
          url: 'http://path/to/release',
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        component: 'other',
        includeComponentInTag: true,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(
        Object.keys(manifest.releasedVersions),
        'found release versions'
      ).lengthOf(1);
      expect(Object.values(manifest.releasedVersions)[0].toString()).to.eql(
        '3.3.3'
      );
    });
    it('finds legacy tags', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/foobar',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release foobar 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, []);
      mockTags(sandbox, github, [
        {
          name: 'other-v3.3.3',
          sha: 'abc123',
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        component: 'other',
        includeComponentInTag: true,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(
        Object.keys(manifest.releasedVersions),
        'found release versions'
      ).lengthOf(1);
      expect(Object.values(manifest.releasedVersions)[0].toString()).to.eql(
        '3.3.3'
      );
    });
    it('ignores manually tagged release if commit not found', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/foobar',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release foobar 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'other-v3.3.3',
          sha: 'def234',
          url: 'http://path/to/release',
        },
      ]);
      mockTags(sandbox, github, []);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        component: 'other',
        includeComponentInTag: true,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(Object.keys(manifest.releasedVersions), 'found release versions')
        .to.be.empty;
    });
    it('finds largest manually tagged release', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/foobar',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release foobar 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
        {
          sha: 'def234',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/foobar',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release foobar 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'other-v3.3.3',
          sha: 'abc123',
          url: 'http://path/to/release',
        },
        {
          id: 654321,
          tagName: 'other-v3.3.2',
          sha: 'def234',
          url: 'http://path/to/release',
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        component: 'other',
        includeComponentInTag: true,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(
        Object.keys(manifest.releasedVersions),
        'found release versions'
      ).lengthOf(1);
      expect(Object.values(manifest.releasedVersions)[0].toString()).to.eql(
        '3.3.3'
      );
    });
    it('finds largest found tagged', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/foobar',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release foobar 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
        {
          sha: 'def234',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/foobar',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release foobar 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, []);
      mockTags(sandbox, github, [
        {
          name: 'other-v3.3.3',
          sha: 'abc123',
        },
        {
          name: 'other-v3.3.2',
          sha: 'def234',
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        component: 'other',
        includeComponentInTag: true,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(
        Object.keys(manifest.releasedVersions),
        'found release versions'
      ).lengthOf(1);
      expect(Object.values(manifest.releasedVersions)[0].toString()).to.eql(
        '3.3.3'
      );
    });
    it('finds manually tagged release commit over earlier automated commit', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
        },
        {
          sha: 'def234',
          message: 'this commit should be found',
          files: [],
        },
        {
          sha: 'ghi345',
          message: 'some commit message',
          files: [],
          pullRequest: {
            title: 'chore: release 3.3.1',
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'v3.3.2',
          sha: 'def234',
          url: 'http://path/to/release',
        },
        {
          id: 654321,
          tagName: 'v3.3.1',
          sha: 'ghi345',
          url: 'http://path/to/release',
        },
      ]);
      mockTags(sandbox, github, []);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(
        Object.keys(manifest.releasedVersions),
        'found release versions'
      ).lengthOf(1);
      expect(Object.values(manifest.releasedVersions)[0].toString()).to.eql(
        '3.3.2'
      );
    });
    it('allows configuring includeVInTag', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.2.3',
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'v1.2.3',
          sha: 'abc123',
          url: 'http://path/to/release',
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        includeVInTag: false,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(Object.keys(manifest.releasedVersions)).lengthOf(1);
      expect(manifest.repositoryConfig['.'].includeVInTag).to.be.false;
    });

    it('finds latest published release', async () => {
      mockReleases(sandbox, github, []);
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            title: 'chore: release 1.2.4-SNAPSHOT',
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            body: '',
            labels: [],
            files: [],
          },
        },
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            title: 'chore: release 1.2.3',
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'java',
        includeComponentInTag: false,
      });
      expect(Object.keys(manifest.releasedVersions)).lengthOf(1);
      expect(manifest.releasedVersions['.'].toString()).to.be.equal('1.2.3');
    });
    it('falls back to release without component in tag', async () => {
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
        },
        {
          sha: 'def234',
          message: 'this commit should be found',
          files: [],
        },
        {
          sha: 'ghi345',
          message: 'some commit message',
          files: [],
          pullRequest: {
            title: 'chore: release 3.3.1',
            // fails to match legacy branch name without component
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'v3.3.1',
          sha: 'ghi345',
          url: 'http://path/to/release',
        },
      ]);
      mockTags(sandbox, github, []);

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        component: 'foobar',
        includeComponentInTag: false,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(
        Object.keys(manifest.releasedVersions),
        'found release versions'
      ).lengthOf(1);
      expect(Object.values(manifest.releasedVersions)[0].toString()).to.eql(
        '3.3.1'
      );
    });

    it('should fail if graphQL commits API is too slow', async () => {
      // In this scenario, graphQL fails with a 502 when pulling the list of
      // recent commits. We are unable to determine the latest release and thus
      // we should abort with the underlying API error.
      const scope = nock('https://api.github.com/')
        .post('/graphql')
        .times(6) // original + 5 retries
        .reply(502);
      const sleepStub = sandbox.stub(githubModule, 'sleepInMs').resolves();
      await assert.rejects(
        async () => {
          await Manifest.fromConfig(github, 'target-branch', {
            releaseType: 'simple',
            bumpMinorPreMajor: true,
            bumpPatchForMinorPreMajor: true,
            component: 'foobar',
            includeComponentInTag: false,
          });
        },
        error => {
          return (
            error instanceof GitHubAPIError &&
            (error as GitHubAPIError).status === 502
          );
        }
      );
      scope.done();
      sinon.assert.callCount(sleepStub, 5);
    });
  });

  describe('buildPullRequests', () => {
    describe('with basic config', () => {
      beforeEach(() => {
        mockReleases(sandbox, github, [
          {
            id: 123456,
            sha: 'abc123',
            tagName: 'v1.0.0',
            url: 'https://github.com/fake-owner/fake-repo/releases/tag/v1.0.0',
          },
        ]);
        mockCommits(sandbox, github, [
          {
            sha: 'def456',
            message: 'fix: some bugfix',
            files: [],
          },
          {
            sha: 'abc123',
            message: 'chore: release 1.0.0',
            files: [],
            pullRequest: {
              headBranchName: 'release-please/branches/main',
              baseBranchName: 'main',
              number: 123,
              title: 'chore: release 1.0.0',
              body: '',
              labels: [],
              files: [],
              sha: 'abc123',
            },
          },
        ]);
      });

      it('should handle single package repository', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            '.': {
              releaseType: 'simple',
            },
          },
          {
            '.': Version.parse('1.0.0'),
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        expect(pullRequest.version?.toString()).to.eql('1.0.1');
        // simple release type updates the changelog and version.txt
        assertHasUpdate(pullRequest.updates, 'CHANGELOG.md');
        assertHasUpdate(pullRequest.updates, 'version.txt');
        assertHasUpdate(pullRequest.updates, '.release-please-manifest.json');
        expect(pullRequest.headRefName).to.eql(
          'release-please--branches--main'
        );
      });

      it('should honour the manifestFile argument in Manifest.fromManifest', async () => {
        mockTags(sandbox, github, []);
        const getFileContentsStub = sandbox.stub(
          github,
          'getFileContentsOnBranch'
        );
        getFileContentsStub
          .withArgs('release-please-config.json', 'next')
          .resolves(
            buildGitHubFileContent(fixturesPath, 'manifest/config/simple.json')
          )
          .withArgs('non/default/path/manifest.json', 'next')
          .resolves(
            buildGitHubFileContent(
              fixturesPath,
              'manifest/versions/simple.json'
            )
          );
        const manifest = await Manifest.fromManifest(
          github,
          'main',
          undefined,
          'non/default/path/manifest.json',
          {changesBranch: 'next'}
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        assertHasUpdate(pullRequest.updates, 'non/default/path/manifest.json');
      });

      it('should create a draft pull request', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            '.': {
              releaseType: 'simple',
              draftPullRequest: true,
            },
          },
          {
            '.': Version.parse('1.0.0'),
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        expect(pullRequest.draft).to.be.true;
      });

      it('should create a draft pull request manifest wide', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            '.': {
              releaseType: 'simple',
            },
          },
          {
            '.': Version.parse('1.0.0'),
          },
          {
            draftPullRequest: true,
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        expect(pullRequest.draft).to.be.true;
      });

      it('allows customizing pull request labels', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            '.': {
              releaseType: 'simple',
            },
          },
          {
            '.': Version.parse('1.0.0'),
          },
          {
            labels: ['some-special-label'],
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        expect(pullRequest.labels).to.eql(['some-special-label']);
      });

      it('allows customizing pull request title', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            '.': {
              releaseType: 'simple',
              pullRequestTitlePattern: 'release: ${version}',
            },
          },
          {
            '.': Version.parse('1.0.0'),
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        expect(pullRequest.title.toString()).to.eql('release: 1.0.1');
      });

      it('allows customizing pull request header', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            '.': {
              releaseType: 'simple',
              pullRequestHeader: 'No beep boop for you',
            },
          },
          {
            '.': Version.parse('1.0.0'),
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        expect(pullRequest.body.header.toString()).to.eql(
          'No beep boop for you'
        );
      });
    });

    it('should find the component from config', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'def456',
          message: 'fix: some bugfix',
          files: [],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
      ]);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/repo/node/pkg1/package.json'
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.0.0'),
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      expect(pullRequest.version?.toString()).to.eql('1.0.1');
      expect(pullRequest.headRefName).to.eql(
        'release-please--branches--main--components--pkg1'
      );
    });

    it('should handle multiple package repository', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 654321,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v0.2.3',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release main',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release main',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release main',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release main',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'simple',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'simple',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].labels).to.eql(['autorelease: pending']);
      snapshot(dateSafe(pullRequests[0].body.toString()));
    });

    it('should allow creating multiple pull requests', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 654321,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release 0.2.3',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg2',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 0.2.3',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'simple',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'simple',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(2);
      snapshot(dateSafe(pullRequests[0].body.toString()));
      snapshot(dateSafe(pullRequests[1].body.toString()));
    });

    it('should allow forcing release-as on a single component', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 654321,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release 0.2.3',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg2',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 0.2.3',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const config: ManifestConfig = {
        'separate-pull-requests': true,
        packages: {
          'path/a': {
            'release-type': 'simple',
            component: 'pkg1',
          },
          'path/b': {
            'release-type': 'simple',
            component: 'pkg2',
            'release-as': '3.3.3',
          },
        },
      };
      const versions = {
        'path/a': '1.0.0',
        'path/b': '0.2.3',
      };
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(2);
      expect(pullRequests[0].version?.toString()).to.eql('1.0.1');
      expect(pullRequests[1].version?.toString()).to.eql('3.3.3');
    });

    it('should allow forcing release-as on entire manifest', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 654321,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release 0.2.3',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg2',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 0.2.3',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const config: ManifestConfig = {
        'release-as': '3.3.3',
        'separate-pull-requests': true,
        packages: {
          'path/a': {
            'release-type': 'simple',
            component: 'pkg1',
          },
          'path/b': {
            'release-type': 'simple',
            component: 'pkg2',
          },
        },
      };
      const versions = {
        'path/a': '1.0.0',
        'path/b': '0.2.3',
      };
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(2);
      expect(pullRequests[0].version?.toString()).to.eql('3.3.3');
      expect(pullRequests[1].version?.toString()).to.eql('3.3.3');
    });

    it('should use version from existing PR title if differs from release branch manifest', async () => {
      mockReleases(sandbox, github, [
        {
          id: 11111,
          sha: 'commit1',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 22222,
          sha: 'commit2',
          tagName: 'pkg2-v2.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v2.0.0',
        },
        {
          id: 33333,
          sha: 'commit3',
          tagName: 'pkg3-v3.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg3-v3.0.0',
        },
        {
          id: 44444,
          sha: 'commit4',
          tagName: 'pkg4-v4.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg4-v4.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'commit11',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'commit22',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'commit33',
          message: 'fix: some bugfix',
          files: ['path/c/foo'],
        },
        {
          sha: 'commit44',
          message: 'fix: some bugfix',
          files: ['path/d/foo'],
        },
        {
          sha: 'commit1',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg1',
            baseBranchName: 'main',
            number: 111,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'commit1',
          },
        },
        {
          sha: 'commit2',
          message: 'chore: release 2.0.0',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg2',
            baseBranchName: 'main',
            number: 222,
            title: 'chore: release 2.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'commit2',
          },
        },
        {
          sha: 'commit3',
          message: 'chore: release 3.0.0',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg3',
            baseBranchName: 'main',
            number: 333,
            title: 'chore: release 3.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'commit3',
          },
        },
        {
          sha: 'commit4',
          message: 'chore: release 4.0.0',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg4',
            baseBranchName: 'main',
            number: 444,
            title: 'chore: release 4.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'commit4',
          },
        },
      ]);
      const config: ManifestConfig = {
        'separate-pull-requests': true,
        'release-type': 'simple',
        packages: {
          'path/a': {
            'release-type': 'simple',
            component: 'pkg1',
          },
          'path/b': {
            'release-type': 'node',
            component: 'pkg2',
          },
          'path/c': {
            'release-type': 'python',
            component: 'pkg3',
          },
          'path/d': {
            'release-type': 'go',
            component: 'pkg4',
          },
        },
      };

      const getFileContentsOnBranchStub = sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              'path/a': '1.0.0',
              'path/b': '2.0.0',
              'path/c': '3.0.0',
              'path/d': '4.0.0',
            })
          )
        )
        .withArgs(
          '.release-please-manifest.json',
          'release-please--branches--main--changes--next--components--pkg1'
        )
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              'path/a': '1.0.1',
            })
          )
        )
        .withArgs(
          '.release-please-manifest.json',
          'release-please--branches--main--changes--next--components--pkg2'
        )
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              'path/b': '2.0.1',
            })
          )
        )
        .withArgs('path/b/package.json', 'next')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              name: 'pkg2',
            })
          )
        )
        .withArgs(
          '.release-please-manifest.json',
          'release-please--branches--main--changes--next--components--pkg3'
        )
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              'path/c': '3.0.1',
            })
          )
        )
        .withArgs('path/c/setup.py', 'next')
        .resolves(
          buildGitHubFileRaw(
            `
name = "pkg3"
description = "Something"
version = "3.0.0"
`
          )
        )
        .withArgs(
          '.release-please-manifest.json',
          'release-please--branches--main--changes--next--components--pkg4'
        )
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              'path/d': '4.0.1',
            })
          )
        );

      const findFilesByFilenameAndRefStub = sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('version.py', 'next', 'path/c')
        .resolves([]);

      const addIssueLabelsStub = sandbox
        .stub(github, 'addIssueLabels')
        .withArgs([DEFAULT_CUSTOM_VERSION_LABEL], 111)
        .resolves();

      let commentCount = 0;
      sandbox.replace(github, 'commentOnIssue', (comment, number) => {
        snapshot(comment);
        expect(number).to.be.oneOf([111, 222, 333, 444]);
        commentCount += 1;
        return Promise.resolve('https://foo/bar');
      });

      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {changesBranch: 'next'}
      );

      const pullRequests = await manifest.buildPullRequests(
        [
          {
            title: 'chore(main): release v6.7.9-alpha.1', // version from title differs from PR manifest
            body: 'some content',
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg1',
            baseBranchName: 'main',
            number: 111,
            labels: [],
            files: [],
          },
          {
            title: 'chore(main): release v7.8.9', // version from title differs from PR manifest
            body: 'some content',
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg2',
            baseBranchName: 'main',
            number: 222,
            labels: [],
            files: [],
          },
          {
            title: 'chore(main): release 8.9.0', // version from title differs from PR manifest
            body: 'some content',
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg3',
            baseBranchName: 'main',
            number: 333,
            labels: [],
            files: [],
          },
          {
            title: 'chore(main): release v9.0.1', // version from title differs from PR manifest
            body: 'some content',
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg4',
            baseBranchName: 'main',
            number: 444,
            labels: [],
            files: [],
          },
        ],
        []
      );
      expect(pullRequests).lengthOf(4);
      expect(pullRequests[0].version?.toString()).to.eql('6.7.9-alpha.1');
      expect(pullRequests[1].version?.toString()).to.eql('7.8.9');
      expect(pullRequests[2].version?.toString()).to.eql('8.9.0');
      expect(pullRequests[3].version?.toString()).to.eql('9.0.1');
      sinon.assert.called(getFileContentsOnBranchStub);
      sinon.assert.called(addIssueLabelsStub);
      sinon.assert.called(findFilesByFilenameAndRefStub);
      expect(commentCount).to.eql(4);
    });

    it('should always use PR title version when labelled as custom version', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 654321,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release 0.2.3',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg2',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 0.2.3',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const config: ManifestConfig = {
        'separate-pull-requests': true,
        packages: {
          'path/a': {
            'release-type': 'simple',
            component: 'pkg1',
          },
          'path/b': {
            'release-type': 'simple',
            component: 'pkg2',
          },
        },
      };

      const getFileContentsOnBranchStub = sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              'path/a': '1.0.0',
              'path/b': '0.2.3',
            })
          )
        );

      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {changesBranch: 'next'}
      );

      const pullRequests = await manifest.buildPullRequests(
        [
          {
            title: 'chore(main): release v4.5.6-beta.1',
            body: 'some content',
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg2',
            baseBranchName: 'main',
            number: 123,
            labels: [DEFAULT_CUSTOM_VERSION_LABEL], // labeled as custom version, no need to fetch manifest from release branch
            files: [],
          },
        ],
        []
      );
      expect(pullRequests).lengthOf(2);
      expect(pullRequests[0].version?.toString()).to.eql('1.0.1');
      expect(pullRequests[1].version?.toString()).to.eql('4.5.6-beta.1');
      sinon.assert.called(getFileContentsOnBranchStub);
    });

    it('should report issue via PR comment if labeled as custom version but version not found in title', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 654321,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release 0.2.3',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg2',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 0.2.3',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const config: ManifestConfig = {
        'separate-pull-requests': true,
        packages: {
          'path/a': {
            'release-type': 'simple',
            component: 'pkg1',
          },
          'path/b': {
            'release-type': 'simple',
            component: 'pkg2',
          },
        },
      };

      const getFileContentsOnBranchStub = sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              'path/a': '1.0.0',
              'path/b': '0.2.3',
            })
          )
        );

      let commented = false;
      sandbox.replace(github, 'commentOnIssue', (comment, number) => {
        snapshot(comment);
        expect(number).to.eql(123);
        commented = true;
        return Promise.resolve('https://foo/bar');
      });

      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {changesBranch: 'next'}
      );

      const pullRequests = await manifest.buildPullRequests(
        [
          {
            // title edited by end user, version not valid anymore
            title: 'chore(main): release vCHANGED_TO_SOMETHING_WITHOUT_VERSION',
            body: 'some content',
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg2',
            baseBranchName: 'main',
            number: 123,
            labels: [DEFAULT_CUSTOM_VERSION_LABEL],
            files: [],
          },
        ],
        []
      );
      expect(pullRequests).lengthOf(2);
      expect(pullRequests[0].version?.toString()).to.eql('1.0.1');
      expect(pullRequests[1].version?.toString()).to.eql('0.2.4'); // should not use version from title
      expect(commented).to.be.true;
      sinon.assert.called(getFileContentsOnBranchStub);
    });

    it('should warn end user via PR comment if version not found in title and not labeled as custom version', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 654321,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release 0.2.3',
          files: [],
          pullRequest: {
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg2',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 0.2.3',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const config: ManifestConfig = {
        'separate-pull-requests': true,
        packages: {
          'path/a': {
            'release-type': 'simple',
            component: 'pkg1',
          },
          'path/b': {
            'release-type': 'simple',
            component: 'pkg2',
          },
        },
      };

      const getFileContentsOnBranchStub = sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              'path/a': '1.0.0',
              'path/b': '0.2.3',
            })
          )
        );

      let commented = false;
      sandbox.replace(github, 'commentOnIssue', (comment, number) => {
        snapshot(comment);
        expect(number).to.eql(123);
        commented = true;
        return Promise.resolve('https://foo/bar');
      });

      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {changesBranch: 'next'}
      );

      const pullRequests = await manifest.buildPullRequests(
        [
          {
            // title edited by end user, version not valid anymore
            title: 'chore(main): release vCHANGED_TO_SOMETHING_WITHOUT_VERSION',
            body: 'some content',
            headBranchName:
              'release-please--branches--main--changes--next--components--pkg2',
            baseBranchName: 'main',
            number: 123,
            labels: [], // no custom version label
            files: [],
          },
        ],
        []
      );
      expect(pullRequests).lengthOf(2);
      expect(pullRequests[0].version?.toString()).to.eql('1.0.1');
      expect(pullRequests[1].version?.toString()).to.eql('0.2.4'); // should not use version from title
      expect(commented).to.be.true;
      sinon.assert.called(getFileContentsOnBranchStub);
    });

    it('should allow specifying a bootstrap sha', async () => {
      mockReleases(sandbox, github, []);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix 1',
          files: ['path/a/foo'],
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix 2',
          files: ['path/a/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'dddddd',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
      ]);
      mockTags(sandbox, github, []);
      const config: ManifestConfig = {
        'bootstrap-sha': 'cccccc',
        'separate-pull-requests': true,
        packages: {
          'path/a': {
            'release-type': 'simple',
            component: 'pkg1',
          },
          'path/b': {
            'release-type': 'simple',
            component: 'pkg2',
          },
        },
      };
      const versions = {
        'path/a': '0.0.0',
        'path/b': '0.0.0',
      };
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].version?.toString()).to.eql('0.0.1');
    });

    it('should allow specifying a last release sha', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 654321,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release 0.2.3',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg2',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 0.2.3',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      mockTags(sandbox, github, []);
      const config: ManifestConfig = {
        'last-release-sha': 'bbbbbb',
        'separate-pull-requests': true,
        packages: {
          'path/a': {
            'release-type': 'simple',
            component: 'pkg1',
          },
          'path/b': {
            'release-type': 'simple',
            component: 'pkg2',
          },
        },
      };
      const versions = {
        'path/a': '0.0.0',
        'path/b': '0.0.0',
      };
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].version?.toString()).to.eql('0.0.1');
    });

    it('should allow customizing pull request title with root package', async () => {
      mockReleases(sandbox, github, [
        {
          id: 1,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 2,
          sha: 'abc123',
          tagName: 'root-v1.2.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/root-v1.2.0',
        },
        {
          id: 3,
          sha: 'def234',
          tagName: 'pkg1-v1.0.1',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.1',
        },
        {
          id: 4,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v0.2.3',
        },
        {
          id: 5,
          sha: 'def234',
          tagName: 'root-v1.2.1',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/root-v1.2.1',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release main',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release v1.2.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release v1.2.1',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release v1.2.1',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'simple',
            component: 'root',
          },
          'path/a': {
            releaseType: 'simple',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'simple',
            component: 'pkg2',
          },
        },
        {
          '.': Version.parse('1.2.1'),
          'path/a': Version.parse('1.0.1'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          groupPullRequestTitlePattern:
            'chore${scope}: release${component} v${version}',
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      expect(pullRequest.title.toString()).to.eql(
        'chore(main): release root v1.2.2'
      );
      snapshot(dateSafe(pullRequest.body.toString()));
    });

    it('should allow customizing pull request title without root package', async () => {
      mockReleases(sandbox, github, [
        {
          id: 1,
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          id: 2,
          sha: 'def234',
          tagName: 'pkg1-v1.0.1',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.1',
        },
        {
          id: 3,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v0.2.3',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release main',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release v1.2.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release v1.2.1',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release v1.2.1',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'simple',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'simple',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.1'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          groupPullRequestTitlePattern:
            'chore${scope}: release${component} v${version}',
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].title.toString()).to.eql('chore(main): release v');
    });

    it('should read latest version from manifest if no release tag found', async () => {
      mockReleases(sandbox, github, []);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
      ]);
      mockTags(sandbox, github, []);
      const config: ManifestConfig = {
        packages: {
          'path/a': {
            'release-type': 'simple',
            component: 'pkg1',
          },
          'path/b': {
            'release-type': 'simple',
            component: 'pkg2',
          },
        },
      };
      const versions = {
        'path/a': '1.2.3',
        'path/b': '2.3.4',
      };
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'next')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {changesBranch: 'next'}
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].body.releaseData).lengthOf(1);
      expect(pullRequests[0].body.releaseData[0].component).to.eql('pkg1');
      expect(pullRequests[0].body.releaseData[0].version?.toString()).to.eql(
        '1.2.4'
      );
    });

    it('should not update manifest if unpublished version is created', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          tagName: 'v1.2.3',
          sha: 'def234',
          url: 'http://path/to/release',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            title: 'chore: release 1.2.3',
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            body: '',
            labels: [],
            files: [],
          },
        },
      ]);

      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'java',
          },
        },
        {
          '.': Version.parse('1.2.3'),
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      expect(pullRequest.version?.toString()).to.eql('1.2.4-SNAPSHOT');
      // simple release type updates the changelog and version.txt
      assertNoHasUpdate(pullRequest.updates, 'CHANGELOG.md');
      assertNoHasUpdate(pullRequest.updates, '.release-please-manifest.json');
      expect(pullRequest.headRefName).to.eql('release-please--branches--main');
    });

    describe('without commits', () => {
      beforeEach(() => {
        mockReleases(sandbox, github, [
          {
            id: 123456,
            sha: 'abc123',
            tagName: 'v1.0.0',
            url: 'https://github.com/fake-owner/fake-repo/releases/tag/v1.0.0',
          },
        ]);
        mockCommits(sandbox, github, []);
      });
      it('should ignore by default', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            '.': {
              releaseType: 'simple',
            },
          },
          {
            '.': Version.parse('1.0.0'),
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(0);
      });

      it('should delegate to strategies', async () => {
        const getFileContentsStub = sandbox.stub(
          github,
          'getFileContentsOnBranch'
        );
        getFileContentsStub
          .withArgs('versions.txt', 'main')
          .resolves(
            buildGitHubFileContent(
              fixturesPath,
              'strategies/java-yoshi/versions-released.txt'
            )
          );
        sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
        const manifest = new Manifest(
          github,
          'main',
          {
            '.': {
              releaseType: 'java-yoshi',
            },
          },
          {
            '.': Version.parse('1.0.0'),
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        expect(pullRequest.version?.toString()).to.eql('1.0.1-SNAPSHOT');
        expect(pullRequest.headRefName).to.eql(
          'release-please--branches--main'
        );
      });
    });

    it('should handle extra files', async () => {
      mockReleases(sandbox, github, []);
      mockTags(sandbox, github, []);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: a bugfix',
          files: ['foo', 'pkg.properties'],
        },
        {
          sha: 'bbbbbb',
          message: 'fix: b bugfix',
          files: ['pkg/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: c bugfix',
          files: ['pkg/c/foo'],
        },
      ]);
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'simple',
            component: 'a',
            extraFiles: ['root.properties'],
          },
          'pkg/b': {
            releaseType: 'simple',
            component: 'b',
            extraFiles: ['pkg.properties', 'src/version', '/bbb.properties'],
            skipGithubRelease: true,
          },
          'pkg/c': {
            releaseType: 'simple',
            component: 'c',
            extraFiles: ['/pkg/pkg-c.properties', 'ccc.properties'],
            skipGithubRelease: true,
          },
        },
        {
          '.': Version.parse('1.1.0'),
          'pkg/b': Version.parse('1.0.0'),
          'pkg/c': Version.parse('1.0.1'),
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].updates).to.be.an('array');
      expect(pullRequests[0].updates.map(update => update.path))
        .to.include.members([
          'root.properties',
          'bbb.properties',
          'pkg/pkg-c.properties',
          'pkg/b/pkg.properties',
          'pkg/b/src/version',
          'pkg/c/ccc.properties',
        ])
        .but.not.include.oneOf([
          'pkg/b/bbb.properties', // should be at root
          'pkg/c/pkg-c.properties', // should be up one level
        ]);
    });

    it('should allow overriding commit message', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'def456',
          message: 'fix: some bugfix',
          files: [],
          pullRequest: {
            headBranchName: 'fix-1',
            baseBranchName: 'main',
            number: 123,
            title: 'fix: some bugfix',
            body: 'BEGIN_COMMIT_OVERRIDE\nfix: real fix message\nEND_COMMIT_OVERRIDE',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
      ]);
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'simple',
          },
        },
        {
          '.': Version.parse('1.0.0'),
        },
        {
          draftPullRequest: true,
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      safeSnapshot(pullRequest.body.toString());
    });

    describe('with plugins', () => {
      beforeEach(() => {
        mockReleases(sandbox, github, [
          {
            id: 123456,
            sha: 'abc123',
            tagName: 'pkg1-v1.0.0',
            url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
          },
          {
            id: 654321,
            sha: 'def234',
            tagName: 'pkg2-v0.2.3',
            url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
          },
        ]);
        mockCommits(sandbox, github, [
          {
            sha: 'aaaaaa',
            message: 'fix: some bugfix\nfix:another fix',
            files: ['path/a/foo'],
          },
          {
            sha: 'abc123',
            message: 'chore: release 1.0.0',
            files: [],
            pullRequest: {
              headBranchName: 'release-please/branches/main/components/pkg1',
              baseBranchName: 'main',
              number: 123,
              title: 'chore: release 1.0.0',
              body: '',
              labels: [],
              files: [],
              sha: 'abc123',
            },
          },
          {
            sha: 'bbbbbb',
            message: 'fix: some bugfix',
            files: ['path/b/foo'],
          },
          {
            sha: 'cccccc',
            message: 'fix: some bugfix',
            files: ['path/a/foo'],
          },
          {
            sha: 'def234',
            message: 'chore: release 0.2.3',
            files: [],
            pullRequest: {
              headBranchName: 'release-please/branches/main/components/pkg2',
              baseBranchName: 'main',
              number: 123,
              title: 'chore: release 0.2.3',
              body: '',
              labels: [],
              files: [],
              sha: 'def234',
            },
          },
        ]);
      });

      it('should load and run a single plugins', async () => {
        const mockPlugin = sandbox.createStubInstance(NodeWorkspace);
        mockPlugin.run.returnsArg(0);
        mockPlugin.preconfigure.returnsArg(0);
        mockPlugin.processCommits.returnsArg(0);
        sandbox
          .stub(pluginFactory, 'buildPlugin')
          .withArgs(sinon.match.has('type', 'node-workspace'))
          .returns(mockPlugin);
        const manifest = new Manifest(
          github,
          'main',
          {
            'path/a': {
              releaseType: 'node',
              component: 'pkg1',
              packageName: 'pkg1',
            },
            'path/b': {
              releaseType: 'node',
              component: 'pkg2',
              packageName: 'pkg2',
            },
          },
          {
            'path/a': Version.parse('1.0.0'),
            'path/b': Version.parse('0.2.3'),
          },
          {
            separatePullRequests: true,
            plugins: ['node-workspace'],
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).not.empty;
        sinon.assert.calledOnce(mockPlugin.run);
      });

      it('should load and run multiple plugins', async () => {
        const mockPlugin = sandbox.createStubInstance(NodeWorkspace);
        mockPlugin.run.returnsArg(0);
        mockPlugin.preconfigure.returnsArg(0);
        mockPlugin.processCommits.returnsArg(0);
        const mockPlugin2 = sandbox.createStubInstance(CargoWorkspace);
        mockPlugin2.run.returnsArg(0);
        mockPlugin2.preconfigure.returnsArg(0);
        mockPlugin2.processCommits.returnsArg(0);
        sandbox
          .stub(pluginFactory, 'buildPlugin')
          .withArgs(sinon.match.has('type', 'node-workspace'))
          .returns(mockPlugin)
          .withArgs(sinon.match.has('type', 'cargo-workspace'))
          .returns(mockPlugin2);
        const manifest = new Manifest(
          github,
          'main',
          {
            'path/a': {
              releaseType: 'node',
              component: 'pkg1',
              packageName: '@foo/pkg1',
            },
            'path/b': {
              releaseType: 'node',
              component: 'pkg2',
              packageName: '@foo/pkg2',
            },
          },
          {
            'path/a': Version.parse('1.0.0'),
            'path/b': Version.parse('0.2.3'),
          },
          {
            separatePullRequests: true,
            plugins: ['node-workspace', 'cargo-workspace'],
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).not.empty;
        sinon.assert.calledOnce(mockPlugin.run);
        sinon.assert.calledOnce(mockPlugin2.run);
      });

      it('should apply plugin hook "processCommits"', async () => {
        const spyPlugin = sinon.spy(
          new SentenceCase(github, 'main', DEFAULT_RELEASE_PLEASE_MANIFEST, {})
        );
        sandbox
          .stub(pluginFactory, 'buildPlugin')
          .withArgs(sinon.match.has('type', 'sentence-case'))
          // TS compiler is having issues with sinon.spy.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .returns(spyPlugin as any as InstanceType<typeof SentenceCase>);
        const manifest = new Manifest(
          github,
          'main',
          {
            'path/a': {
              releaseType: 'node',
              component: 'pkg1',
              packageName: 'pkg1',
            },
          },
          {
            'path/a': Version.parse('1.0.0'),
          },
          {
            plugins: ['sentence-case'],
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).not.empty;
        // This assertion verifies that conventional commit parsing
        // was applied before calling the processCommits plugin hook:
        sinon.assert.calledWith(spyPlugin.processCommits, [
          {
            sha: 'aaaaaa',
            message: 'fix: Another fix',
            files: ['path/a/foo'],
            pullRequest: undefined,
            type: 'fix',
            scope: null,
            bareMessage: 'Another fix',
            notes: [],
            references: [],
            breaking: false,
          },
          {
            sha: 'aaaaaa',
            message: 'fix: Some bugfix',
            files: ['path/a/foo'],
            pullRequest: undefined,
            type: 'fix',
            scope: null,
            bareMessage: 'Some bugfix',
            notes: [],
            references: [],
            breaking: false,
          },
        ]);
      });
    });

    it('should fallback to tagged version', async () => {
      mockReleases(sandbox, github, []);
      mockTags(sandbox, github, [
        {
          name: 'pkg1-v1.0.0',
          sha: 'abc123',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'def456',
          message: 'fix: some bugfix',
          files: [],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
      ]);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/repo/node/pkg1/package.json'
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.0.0'),
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      expect(pullRequest.version?.toString()).to.eql('1.0.1');
      expect(pullRequest.headRefName).to.eql(
        'release-please--branches--main--components--pkg1'
      );
    });

    it('should handle mixing componentless configs', async () => {
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/v1.0.0',
        },
        {
          id: 654321,
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v0.2.3',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'abc123',
          message: 'chore: release main',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release main',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
        {
          sha: 'bbbbbb',
          message: 'fix: some bugfix',
          files: ['path/b/foo'],
        },
        {
          sha: 'cccccc',
          message: 'fix: some bugfix',
          files: ['path/a/foo'],
        },
        {
          sha: 'def234',
          message: 'chore: release main',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release main',
            body: '',
            labels: [],
            files: [],
            sha: 'def234',
          },
        },
      ]);
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'simple',
            component: 'pkg1',
            includeComponentInTag: false,
          },
          'path/b': {
            releaseType: 'simple',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].labels).to.eql(['autorelease: pending']);
      snapshot(dateSafe(pullRequests[0].body.toString()));
    });

    it('should allow customizing release-search-depth', async () => {
      const releaseStub = mockReleases(sandbox, github, []);
      mockTags(sandbox, github, [
        {
          name: 'pkg1-v1.0.0',
          sha: 'abc123',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'def456',
          message: 'fix: some bugfix',
          files: [],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
      ]);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/repo/node/pkg1/package.json'
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.0.0'),
        },
        {
          releaseSearchDepth: 1,
        }
      );
      expect(manifest.releaseSearchDepth).to.eql(1);
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      expect(pullRequest.version?.toString()).to.eql('1.0.1');
      expect(pullRequest.headRefName).to.eql(
        'release-please--branches--main--components--pkg1'
      );
      sinon.assert.calledOnceWithMatch(
        releaseStub,
        sinon.match.has('maxResults', 1)
      );
    });

    it('should allow customizing commit-search-depth', async () => {
      mockReleases(sandbox, github, []);
      mockTags(sandbox, github, [
        {
          name: 'pkg1-v1.0.0',
          sha: 'abc123',
        },
      ]);
      const commitsStub = mockCommits(sandbox, github, [
        {
          sha: 'def456',
          message: 'fix: some bugfix',
          files: [],
        },
        {
          sha: 'abc123',
          message: 'chore: release 1.0.0',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg1',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: release 1.0.0',
            body: '',
            labels: [],
            files: [],
            sha: 'abc123',
          },
        },
      ]);
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileContent(
            fixturesPath,
            'manifest/repo/node/pkg1/package.json'
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.0.0'),
        },
        {
          commitSearchDepth: 1,
        }
      );
      expect(manifest.commitSearchDepth).to.eql(1);
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      expect(pullRequest.version?.toString()).to.eql('1.0.1');
      expect(pullRequest.headRefName).to.eql(
        'release-please--branches--main--components--pkg1'
      );
      sinon.assert.calledOnceWithMatch(
        commitsStub,
        'main',
        sinon.match.has('maxResults', 1)
      );
    });

    describe('with multiple components', () => {
      beforeEach(() => {
        mockReleases(sandbox, github, []);
        mockTags(sandbox, github, [
          {
            name: 'b-v1.0.0',
            sha: 'abc123',
          },
          {
            name: 'c-v2.0.0',
            sha: 'abc123',
          },
          {
            name: 'd-v3.0.0',
            sha: 'abc123',
          },
        ]);
        mockCommits(sandbox, github, [
          {
            sha: 'def456',
            message: 'fix: some bugfix',
            files: ['pkg/b/foo.txt', 'pkg/c/foo.txt', 'pkg/d/foo.txt'],
          },
          {
            sha: 'abc123',
            message: 'chore: release main',
            files: [],
            pullRequest: {
              headBranchName: 'release-please/branches/main/components/pkg1',
              baseBranchName: 'main',
              number: 123,
              title: 'chore: release main',
              body: '',
              labels: [],
              files: [],
              sha: 'abc123',
            },
          },
        ]);
        const getFileContentsStub = sandbox.stub(
          github,
          'getFileContentsOnBranch'
        );
        getFileContentsStub
          .withArgs('package.json', 'main')
          .resolves(
            buildGitHubFileContent(
              fixturesPath,
              'manifest/repo/node/pkg1/package.json'
            )
          );
      });

      it('should allow configuring separate pull requests', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            'pkg/b': {
              releaseType: 'simple',
              component: 'b',
            },
            'pkg/c': {
              releaseType: 'simple',
              component: 'c',
            },
            'pkg/d': {
              releaseType: 'simple',
              component: 'd',
            },
          },
          {
            'pkg/b': Version.parse('1.0.0'),
            'pkg/c': Version.parse('2.0.0'),
            'pkg/d': Version.parse('3.0.0'),
          },
          {
            separatePullRequests: true,
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(3);
        const pullRequestB = pullRequests[0];
        expect(pullRequestB.headRefName).to.eql(
          'release-please--branches--main--components--b'
        );
        const pullRequestC = pullRequests[1];
        expect(pullRequestC.headRefName).to.eql(
          'release-please--branches--main--components--c'
        );
        const pullRequestD = pullRequests[2];
        expect(pullRequestD.headRefName).to.eql(
          'release-please--branches--main--components--d'
        );
      });

      it('should allow configuring individual separate pull requests', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            'pkg/b': {
              releaseType: 'simple',
              component: 'b',
            },
            'pkg/c': {
              releaseType: 'simple',
              component: 'c',
            },
            'pkg/d': {
              releaseType: 'simple',
              component: 'd',
              separatePullRequests: true,
            },
          },
          {
            'pkg/b': Version.parse('1.0.0'),
            'pkg/c': Version.parse('2.0.0'),
            'pkg/d': Version.parse('3.0.0'),
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(2);
        const pullRequest = pullRequests[0];
        expect(pullRequest.headRefName).to.eql(
          'release-please--branches--main'
        );
        const mainPullRequest = pullRequests[1];
        expect(mainPullRequest.headRefName).to.eql(
          'release-please--branches--main--components--d'
        );
      });

      it('should allow configuring individual separate pull requests with includeComponentInTag = false', async () => {
        const manifest = new Manifest(
          github,
          'main',
          {
            'pkg/b': {
              releaseType: 'simple',
              component: 'b',
            },
            'pkg/c': {
              releaseType: 'simple',
              component: 'c',
            },
            'pkg/d': {
              releaseType: 'simple',
              component: 'd',
              separatePullRequests: true,
              includeComponentInTag: false,
            },
          },
          {
            'pkg/b': Version.parse('1.0.0'),
            'pkg/c': Version.parse('2.0.0'),
            'pkg/d': Version.parse('3.0.0'),
          }
        );
        const pullRequests = await manifest.buildPullRequests([], []);
        expect(pullRequests).lengthOf(2);
        const pullRequest = pullRequests[0];
        expect(pullRequest.headRefName).to.eql(
          'release-please--branches--main'
        );
        const mainPullRequest = pullRequests[1];
        expect(mainPullRequest.headRefName).to.eql(
          'release-please--branches--main--components--d'
        );
      });
    });
  });

  describe('createPullRequests', () => {
    it('handles no pull requests', async () => {
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'node',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'node',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
          plugins: ['node-workspace'],
        }
      );
      mockPullRequests(github, []);
      sandbox.stub(manifest, 'buildPullRequests').resolves([]);
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      const pullRequests = await manifest.createPullRequests();
      expect(pullRequests).to.be.empty;
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: pending',
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
    });

    it('handles a single pull request', async () => {
      sandbox
        .stub(github, 'createPullRequest')
        .withArgs(
          sinon.match.has('headBranchName', 'release-please/branches/main'),
          'main',
          'main',
          sinon.match.string,
          sinon.match.array,
          sinon.match({fork: false, draft: false})
        )
        .resolves({
          number: 22,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      mockPullRequests(github, []);
      sandbox.stub(github, 'getPullRequest').withArgs(22).resolves({
        number: 22,
        title: 'pr title1',
        body: 'pr body1',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        labels: [],
        files: [],
      });
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'node',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'node',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
          plugins: ['node-workspace'],
        }
      );
      sandbox.stub(manifest, 'buildPullRequests').resolves([
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body: new PullRequestBody([
            {
              notes: 'Some release notes',
            },
          ]),
          updates: [
            {
              path: 'README.md',
              createIfMissing: false,
              updater: new RawContent('some raw content'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main',
          draft: false,
        },
      ]);
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      const pullRequests = await manifest.createPullRequests();
      expect(pullRequests).lengthOf(1);
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: pending',
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
    });

    it('handles a multiple pull requests', async () => {
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'))
        .withArgs('pkg2/README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content-2'));
      mockPullRequests(github, []);
      sandbox
        .stub(github, 'getPullRequest')
        .withArgs(123)
        .resolves({
          number: 123,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        })
        .withArgs(124)
        .resolves({
          number: 124,
          title: 'pr title2',
          body: 'pr body2',
          headBranchName: 'release-please/branches/main2',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      sandbox
        .stub(github, 'createPullRequest')
        .withArgs(
          sinon.match.has('headBranchName', 'release-please/branches/main'),
          'main',
          'main',
          sinon.match.string,
          sinon.match.array,
          sinon.match({fork: false, draft: false})
        )
        .resolves({
          number: 123,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        })
        .withArgs(
          sinon.match.has('headBranchName', 'release-please/branches/main2'),
          'main',
          'main',
          sinon.match.string,
          sinon.match.array,
          sinon.match({fork: false, draft: false})
        )
        .resolves({
          number: 124,
          title: 'pr title2',
          body: 'pr body2',
          headBranchName: 'release-please/branches/main2',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'node',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'node',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
          plugins: ['node-workspace'],
        }
      );
      sandbox.stub(manifest, 'buildPullRequests').resolves([
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body: new PullRequestBody([
            {
              notes: 'Some release notes',
            },
          ]),
          updates: [
            {
              path: 'README.md',
              createIfMissing: false,
              updater: new RawContent('some raw content'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main',
          draft: false,
        },
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body: new PullRequestBody([
            {
              notes: 'Some release notes 2',
            },
          ]),
          updates: [
            {
              path: 'pkg2/README.md',
              createIfMissing: false,
              updater: new RawContent('some raw content 2'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main2',
          draft: false,
        },
      ]);
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      const pullRequests = await manifest.createPullRequests();
      expect(pullRequests.map(pullRequest => pullRequest!.number)).to.eql([
        123, 124,
      ]);
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: pending',
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
    });

    it('handles signoff users', async () => {
      sandbox
        .stub(github, 'createPullRequest')
        .withArgs(
          sinon.match.has('headBranchName', 'release-please/branches/main'),
          'main',
          'main',
          sinon.match.string,
          sinon.match.array,
          sinon.match({fork: false, draft: false})
        )
        .resolves({
          number: 22,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      mockPullRequests(github, []);
      sandbox.stub(github, 'getPullRequest').withArgs(22).resolves({
        number: 22,
        title: 'pr title1',
        body: 'pr body1',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        labels: [],
        files: [],
      });
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'node',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'node',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
          plugins: ['node-workspace'],
          signoff: 'Alice <alice@example.com>',
        }
      );
      sandbox.stub(manifest, 'buildPullRequests').resolves([
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body: new PullRequestBody([
            {
              notes: 'Some release notes',
            },
          ]),
          updates: [
            {
              path: 'README.md',
              createIfMissing: false,
              updater: new RawContent('some raw content'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main',
          draft: false,
        },
      ]);
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(1);
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: pending',
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
    });

    it('handles fork = true', async () => {
      sandbox
        .stub(github, 'createPullRequest')
        .withArgs(
          sinon.match.has('headBranchName', 'release-please/branches/main'),
          'main',
          'main',
          sinon.match.string,
          sinon.match.array,
          sinon.match({fork: true, draft: false})
        )
        .resolves({
          number: 22,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      mockPullRequests(github, []);
      sandbox.stub(github, 'getPullRequest').withArgs(22).resolves({
        number: 22,
        title: 'pr title1',
        body: 'pr body1',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        labels: [],
        files: [],
      });
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'node',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'node',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
          plugins: ['node-workspace'],
          fork: true,
        }
      );
      sandbox.stub(manifest, 'buildPullRequests').resolves([
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body: new PullRequestBody([
            {
              notes: 'Some release notes',
            },
          ]),
          updates: [
            {
              path: 'README.md',
              createIfMissing: false,
              updater: new RawContent('some raw content'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main',
          draft: false,
        },
      ]);
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(1);
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: pending',
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
    });

    it('updates an existing pull request', async () => {
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      sandbox
        .stub(github, 'createPullRequest')
        .withArgs(
          sinon.match.has('headBranchName', 'release-please/branches/main'),
          'main',
          'main',
          sinon.match.string,
          sinon.match.array,
          sinon.match({fork: false, draft: false})
        )
        .resolves({
          number: 22,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      mockPullRequests(
        github,
        [
          {
            number: 22,
            title: 'pr title1',
            body: new PullRequestBody([]).toString(),
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            labels: ['autorelease: pending'],
            files: [],
          },
        ],
        []
      );
      sandbox
        .stub(github, 'updatePullRequest')
        .withArgs(22, sinon.match.any, sinon.match.any, sinon.match.any)
        .resolves({
          number: 22,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'node',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'node',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
          plugins: ['node-workspace'],
        }
      );
      sandbox.stub(manifest, 'buildPullRequests').resolves([
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body: new PullRequestBody([
            {
              notes: 'Some release notes',
            },
          ]),
          updates: [
            {
              path: 'README.md',
              createIfMissing: false,
              updater: new RawContent('some raw content'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main',
          draft: false,
        },
      ]);
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(1);
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: pending',
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
    });

    describe('with an overflowing body', () => {
      const body = new PullRequestBody(mockReleaseData(1000), {
        useComponents: true,
      });

      it('updates an existing pull request', async () => {
        mockPullRequests(
          github,
          [
            {
              number: 22,
              title: 'pr title1',
              body: pullRequestBody('release-notes/single.txt'),
              headBranchName: 'release-please/branches/main',
              baseBranchName: 'main',
              labels: ['autorelease: pending'],
              files: [],
            },
          ],
          []
        );
        const updatePullRequestStub = sandbox
          .stub(github, 'updatePullRequest')
          .withArgs(
            22,
            sinon.match.any,
            'main',
            'main',
            sinon.match.has('pullRequestOverflowHandler', sinon.match.truthy)
          )
          .resolves({
            number: 22,
            title: 'pr title1',
            body: 'pr body1',
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            labels: [],
            files: [],
          });
        const manifest = new Manifest(
          github,
          'main',
          {
            'path/a': {
              releaseType: 'node',
              component: 'pkg1',
            },
            'path/b': {
              releaseType: 'node',
              component: 'pkg2',
            },
          },
          {
            'path/a': Version.parse('1.0.0'),
            'path/b': Version.parse('0.2.3'),
          },
          {
            separatePullRequests: true,
            plugins: ['node-workspace'],
          }
        );
        const buildPullRequestsStub = sandbox
          .stub(manifest, 'buildPullRequests')
          .resolves([
            {
              title: PullRequestTitle.ofTargetBranch('main', 'main'),
              body,
              updates: [
                {
                  path: 'README.md',
                  createIfMissing: false,
                  updater: new RawContent('some raw content'),
                },
              ],
              labels: [],
              headRefName: 'release-please/branches/main',
              draft: false,
            },
          ]);
        const getLabelsStub = sandbox
          .stub(github, 'getLabels')
          .resolves(['label-a', 'label-b']);
        const createLabelsStub = sandbox
          .stub(github, 'createLabels')
          .resolves();
        const pullRequestNumbers = await manifest.createPullRequests();
        sinon.assert.calledOnce(updatePullRequestStub);
        sinon.assert.calledOnce(buildPullRequestsStub);
        sinon.assert.calledOnce(getLabelsStub);
        sinon.assert.calledOnceWithExactly(createLabelsStub, [
          'autorelease: pending',
          'autorelease: tagged',
          'autorelease: pre-release',
        ]);
        expect(pullRequestNumbers).lengthOf(1);
      });

      it('ignores an existing pull request if there are no changes', async () => {
        sandbox
          .stub(github, 'getFileContentsOnBranch')
          .withArgs('README.md', 'main')
          .resolves(buildGitHubFileRaw('some-content'))
          .withArgs('release-notes.md', 'my-head-branch--release-notes')
          .resolves(buildGitHubFileRaw(body.toString()));
        sandbox
          .stub(github, 'createPullRequest')
          .withArgs(
            sinon.match.has('headBranchName', 'release-please/branches/main'),
            'main',
            'main',
            sinon.match.string,
            sinon.match.array,
            sinon.match({fork: false, draft: false})
          )
          .resolves({
            number: 22,
            title: 'pr title1',
            body: 'pr body1',
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            labels: [],
            files: [],
          });
        mockPullRequests(
          github,
          [
            {
              number: 22,
              title: 'pr title1',
              body: pullRequestBody('release-notes/overflow.txt'),
              headBranchName: 'release-please/branches/main',
              baseBranchName: 'main',
              labels: ['autorelease: pending'],
              files: [],
            },
          ],
          []
        );
        sandbox
          .stub(github, 'updatePullRequest')
          .withArgs(
            22,
            sinon.match.any,
            sinon.match.any,
            sinon.match.has('pullRequestOverflowHandler', sinon.match.truthy)
          )
          .resolves({
            number: 22,
            title: 'pr title1',
            body: 'pr body1',
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            labels: [],
            files: [],
          });
        const manifest = new Manifest(
          github,
          'main',
          {
            'path/a': {
              releaseType: 'node',
              component: 'pkg1',
            },
            'path/b': {
              releaseType: 'node',
              component: 'pkg2',
            },
          },
          {
            'path/a': Version.parse('1.0.0'),
            'path/b': Version.parse('0.2.3'),
          },
          {
            separatePullRequests: true,
            plugins: ['node-workspace'],
          }
        );
        const getLabelsStub = sandbox
          .stub(github, 'getLabels')
          .resolves(['label-a', 'label-b', 'autorelease: pending']);
        const createLabelsStub = sandbox
          .stub(github, 'createLabels')
          .resolves();
        sandbox.stub(manifest, 'buildPullRequests').resolves([
          {
            title: PullRequestTitle.ofTargetBranch('main', 'main'),
            body,
            updates: [
              {
                path: 'README.md',
                createIfMissing: false,
                updater: new RawContent('some raw content'),
              },
            ],
            labels: [],
            headRefName: 'release-please/branches/main',
            draft: false,
          },
        ]);
        const pullRequestNumbers = await manifest.createPullRequests();
        expect(pullRequestNumbers).lengthOf(0);
        sinon.assert.calledOnce(getLabelsStub);
        sinon.assert.calledOnceWithExactly(createLabelsStub, [
          'autorelease: tagged',
          'autorelease: pre-release',
        ]);
      });
    });

    it('updates an existing snapshot pull request', async () => {
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      sandbox
        .stub(github, 'createPullRequest')
        .withArgs(
          sinon.match.has('headBranchName', 'release-please/branches/main'),
          'main',
          'main',
          sinon.match.string,
          sinon.match.array,
          sinon.match({fork: false, draft: false})
        )
        .resolves({
          number: 22,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      mockPullRequests(
        github,
        [
          {
            number: 22,
            title: 'pr title1',
            body: new PullRequestBody([]).toString(),
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            labels: ['autorelease: snapshot'],
            files: [],
          },
        ],
        []
      );
      sandbox
        .stub(github, 'updatePullRequest')
        .withArgs(22, sinon.match.any, sinon.match.any, sinon.match.any)
        .resolves({
          number: 22,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: ['autorelease: snapshot'],
          files: [],
        });
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'java',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'java',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
        }
      );
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b', 'autorelease: pending']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      sandbox.stub(manifest, 'buildPullRequests').resolves([
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body: new PullRequestBody([
            {
              notes: 'SNAPSHOT bump',
            },
          ]),
          updates: [
            {
              path: 'pom.xml',
              createIfMissing: false,
              updater: new RawContent('some raw content'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main',
          draft: false,
        },
      ]);
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(1);
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
    });

    it('skips pull requests if there are pending, merged pull requests', async () => {
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      mockPullRequests(
        github,
        [],
        [
          {
            number: 22,
            title: 'pr title1',
            body: new PullRequestBody([]).toString(),
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            labels: ['autorelease: pending'],
            files: [],
          },
        ]
      );
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'node',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'node',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
          plugins: ['node-workspace'],
        }
      );
      sandbox.stub(manifest, 'buildPullRequests').resolves([
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body: new PullRequestBody([
            {
              notes: 'Some release notes',
            },
          ]),
          updates: [
            {
              path: 'README.md',
              createIfMissing: false,
              updater: new RawContent('some raw content'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main',
          draft: false,
        },
      ]);
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(0);
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: pending',
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
    });

    it('reopens snoozed, closed pull request if there are changes', async () => {
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      sandbox
        .stub(github, 'createPullRequest')
        .withArgs(
          sinon.match.has('headBranchName', 'release-please/branches/main'),
          'main',
          'main',
          sinon.match.string,
          sinon.match.array,
          sinon.match({fork: false, draft: false})
        )
        .resolves({
          number: 22,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      mockPullRequests(
        github,
        [],
        [],
        [
          {
            number: 22,
            title: 'pr title1',
            body: new PullRequestBody([]).toString(),
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            labels: ['autorelease: pending', 'autorelease: snooze'],
            files: [],
          },
        ]
      );
      sandbox
        .stub(github, 'updatePullRequest')
        .withArgs(22, sinon.match.any, sinon.match.any, sinon.match.any)
        .resolves({
          number: 22,
          title: 'pr title1',
          body: 'pr body1',
          headBranchName: 'release-please/branches/main',
          baseBranchName: 'main',
          labels: [],
          files: [],
        });
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'node',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'node',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
          plugins: ['node-workspace'],
        }
      );
      sandbox.stub(manifest, 'buildPullRequests').resolves([
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body: new PullRequestBody([
            {
              notes: 'Some release notes',
            },
          ]),
          updates: [
            {
              path: 'README.md',
              createIfMissing: false,
              updater: new RawContent('some raw content'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main',
          draft: false,
        },
      ]);
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(1);
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: pending',
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
      sinon.assert.calledOnce(removeLabelsStub);
    });

    it('ignores snoozed, closed pull request if there are no changes', async () => {
      const body = new PullRequestBody([
        {
          notes: '## 1.1.0\n\nSome release notes',
        },
      ]);
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      mockPullRequests(
        github,
        [],
        [],
        [
          {
            number: 22,
            title: 'pr title1',
            body: body.toString(),
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            labels: ['autorelease: closed', 'autorelease: snooze'],
            files: [],
          },
        ]
      );
      const manifest = new Manifest(
        github,
        'main',
        {
          'path/a': {
            releaseType: 'node',
            component: 'pkg1',
          },
          'path/b': {
            releaseType: 'node',
            component: 'pkg2',
          },
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {
          separatePullRequests: true,
          plugins: ['node-workspace'],
        }
      );
      sandbox.stub(manifest, 'buildPullRequests').resolves([
        {
          title: PullRequestTitle.ofTargetBranch('main', 'main'),
          body,
          updates: [
            {
              path: 'README.md',
              createIfMissing: false,
              updater: new RawContent('some raw content'),
            },
          ],
          labels: [],
          headRefName: 'release-please/branches/main',
          draft: false,
        },
      ]);
      const getLabelsStub = sandbox
        .stub(github, 'getLabels')
        .resolves(['label-a', 'label-b']);
      const createLabelsStub = sandbox.stub(github, 'createLabels').resolves();
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(0);
      sinon.assert.calledOnce(getLabelsStub);
      sinon.assert.calledOnceWithExactly(createLabelsStub, [
        'autorelease: pending',
        'autorelease: tagged',
        'autorelease: pre-release',
      ]);
    });
  });

  describe('buildReleases', () => {
    it('should handle a single manifest release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );

      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );

      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].tag.toString()).to.eql('release-brancher-v1.3.1');
      expect(releases[0].sha).to.eql('abc123');
      expect(releases[0].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Bug Fixes'));
      expect(releases[0].path).to.eql('.');
      expect(releases[0].name).to.eql('release-brancher: v1.3.1');
      expect(releases[0].draft).to.be.undefined;
      expect(releases[0].prerelease).to.be.undefined;

      sinon.assert.calledOnce(getFileContentsStub);
    });

    it('should handle a multiple manifest release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/multiple.txt'),
            labels: ['autorelease: pending'],
            files: [
              'packages/bot-config-utils/package.json',
              'packages/label-utils/package.json',
              'packages/object-selector/package.json',
              'packages/datastore-lock/package.json',
            ],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('packages/bot-config-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/bot-config-utils'})
          )
        )
        .withArgs('packages/label-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/label-utils'})
          )
        )
        .withArgs('packages/object-selector/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/object-selector'})
          )
        )
        .withArgs('packages/datastore-lock/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/datastore-lock'})
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          'packages/bot-config-utils': {
            releaseType: 'node',
          },
          'packages/label-utils': {
            releaseType: 'node',
          },
          'packages/object-selector': {
            releaseType: 'node',
          },
          'packages/datastore-lock': {
            releaseType: 'node',
          },
        },
        {
          'packages/bot-config-utils': Version.parse('3.1.4'),
          'packages/label-utils': Version.parse('1.0.1'),
          'packages/object-selector': Version.parse('1.0.2'),
          'packages/datastore-lock': Version.parse('2.0.0'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(4);
      expect(releases[0].tag.toString()).to.eql('bot-config-utils-v3.2.0');
      expect(releases[0].sha).to.eql('abc123');
      expect(releases[0].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[0].path).to.eql('packages/bot-config-utils');
      expect(releases[0].name).to.eql('bot-config-utils: v3.2.0');
      expect(releases[1].tag.toString()).to.eql('label-utils-v1.1.0');
      expect(releases[1].sha).to.eql('abc123');
      expect(releases[1].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[1].path).to.eql('packages/label-utils');
      expect(releases[1].name).to.eql('label-utils: v1.1.0');
      expect(releases[2].tag.toString()).to.eql('object-selector-v1.1.0');
      expect(releases[2].sha).to.eql('abc123');
      expect(releases[2].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[2].path).to.eql('packages/object-selector');
      expect(releases[2].name).to.eql('object-selector: v1.1.0');
      expect(releases[3].tag.toString()).to.eql('datastore-lock-v2.1.0');
      expect(releases[3].sha).to.eql('abc123');
      expect(releases[3].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[3].path).to.eql('packages/datastore-lock');
      expect(releases[3].name).to.eql('datastore-lock: v2.1.0');
    });

    it('should handle a mixed manifest release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody(
              'release-notes/mixed-componentless-manifest.txt'
            ),
            labels: ['autorelease: pending'],
            files: [
              'packages/bot-config-utils/package.json',
              'packages/label-utils/package.json',
            ],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('packages/bot-config-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/bot-config-utils'})
          )
        )
        .withArgs('packages/label-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/label-utils'})
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          'packages/bot-config-utils': {
            releaseType: 'node',
            includeComponentInTag: false,
          },
          'packages/label-utils': {
            releaseType: 'node',
          },
        },
        {
          'packages/bot-config-utils': Version.parse('3.1.4'),
          'packages/label-utils': Version.parse('1.0.1'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(2);
      expect(releases[0].tag.toString()).to.eql('v3.2.0');
      expect(releases[0].sha).to.eql('abc123');
      expect(releases[0].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[0].path).to.eql('packages/bot-config-utils');
      expect(releases[0].name).to.eql('v3.2.0');
      expect(releases[1].tag.toString()).to.eql('label-utils-v1.1.0');
      expect(releases[1].sha).to.eql('abc123');
      expect(releases[1].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[1].path).to.eql('packages/label-utils');
      expect(releases[1].name).to.eql('label-utils: v1.1.0');
    });

    it('should handle a single standalone release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please--branches--main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore(main): release 3.2.7',
            body: pullRequestBody('release-notes/single.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'simple',
          },
        },
        {
          '.': Version.parse('3.2.6'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].tag.toString()).to.eql('v3.2.7');
      expect(releases[0].sha).to.eql('abc123');
      expect(releases[0].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### [3.2.7]'));
      expect(releases[0].path).to.eql('.');
      expect(releases[0].name).to.eql('v3.2.7');
      expect(releases[0].draft).to.be.undefined;
      expect(releases[0].prerelease).to.be.undefined;
    });

    it('should handle a single component release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please--branches--main--components--foo',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore(main): release 3.2.7',
            body: pullRequestBody('release-notes/single.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'simple',
            component: 'foo',
            includeComponentInTag: false,
          },
        },
        {
          '.': Version.parse('3.2.6'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].tag.toString()).to.eql('v3.2.7');
      expect(releases[0].sha).to.eql('abc123');
      expect(releases[0].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### [3.2.7]'));
      expect(releases[0].path).to.eql('.');
      expect(releases[0].name).to.eql('v3.2.7');
      expect(releases[0].draft).to.be.undefined;
      expect(releases[0].prerelease).to.be.undefined;
    });

    it('should allow skipping releases', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/multiple.txt'),
            labels: ['autorelease: pending'],
            files: [
              'packages/bot-config-utils/package.json',
              'packages/label-utils/package.json',
              'packages/object-selector/package.json',
              'packages/datastore-lock/package.json',
            ],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('packages/bot-config-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/bot-config-utils'})
          )
        )
        .withArgs('packages/label-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/label-utils'})
          )
        )
        .withArgs('packages/object-selector/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/object-selector'})
          )
        )
        .withArgs('packages/datastore-lock/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/datastore-lock'})
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          'packages/bot-config-utils': {
            releaseType: 'node',
          },
          'packages/label-utils': {
            releaseType: 'node',
          },
          'packages/object-selector': {
            releaseType: 'node',
            skipGithubRelease: true,
          },
          'packages/datastore-lock': {
            releaseType: 'node',
          },
        },
        {
          'packages/bot-config-utils': Version.parse('3.1.4'),
          'packages/label-utils': Version.parse('1.0.1'),
          'packages/object-selector': Version.parse('1.0.2'),
          'packages/datastore-lock': Version.parse('2.0.0'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(3);
      expect(releases[0].tag.toString()).to.eql('bot-config-utils-v3.2.0');
      expect(releases[0].sha).to.eql('abc123');
      expect(releases[0].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[1].tag.toString()).to.eql('label-utils-v1.1.0');
      expect(releases[1].sha).to.eql('abc123');
      expect(releases[1].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[2].tag.toString()).to.eql('datastore-lock-v2.1.0');
      expect(releases[2].sha).to.eql('abc123');
      expect(releases[2].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
    });

    it('should build draft releases', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
            draft: true,
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].name).to.eql('release-brancher: v1.3.1');
      expect(releases[0].draft).to.be.true;
      expect(releases[0].prerelease).to.be.undefined;
    });

    it('should build draft releases manifest wide', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        },
        {
          draft: true,
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].name).to.eql('release-brancher: v1.3.1');
      expect(releases[0].draft).to.be.true;
      expect(releases[0].prerelease).to.be.undefined;
    });

    it('should build prerelease releases from beta', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody(
              'release-notes/single-manifest-prerelease.txt'
            ),
            labels: ['autorelease: pending'],
            files: [''],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
            prerelease: true,
          },
        },
        {
          '.': Version.parse('1.3.0'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].name).to.eql('release-brancher: v1.3.1-beta1');
      expect(releases[0].draft).to.be.undefined;
      expect(releases[0].prerelease).to.be.true;
      expect(releases[0].tag.toString()).to.eql(
        'release-brancher-v1.3.1-beta1'
      );
    });

    it('should build prerelease releases from pre-major', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody(
              'release-notes/single-manifest-pre-major.txt'
            ),
            labels: ['autorelease: pending'],
            files: [''],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
            prerelease: true,
          },
        },
        {
          '.': Version.parse('0.1.0'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].name).to.eql('release-brancher: v0.2.0');
      expect(releases[0].draft).to.be.undefined;
      expect(releases[0].prerelease).to.be.true;
      expect(releases[0].tag.toString()).to.eql('release-brancher-v0.2.0');
    });

    it('should not build prerelease releases from non-prerelease', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [''],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
            prerelease: true,
          },
        },
        {
          '.': Version.parse('1.3.0'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].name).to.eql('release-brancher: v1.3.1');
      expect(releases[0].draft).to.be.undefined;
      expect(releases[0].prerelease).to.be.false;
      expect(releases[0].tag.toString()).to.eql('release-brancher-v1.3.1');
    });

    it('should skip component in tag', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName:
              'release-please--branches--main--components--release-brancher',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore(main): release v1.3.1',
            body: pullRequestBody('release-notes/single.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
            includeComponentInTag: false,
          },
        },
        {
          '.': Version.parse('1.3.0'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].tag.toString()).to.eql('v1.3.1');
    });

    it('should handle customized pull request title', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'release: 3.2.7',
            body: pullRequestBody('release-notes/single.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'simple',
            pullRequestTitlePattern: 'release: ${version}',
          },
        },
        {
          '.': Version.parse('3.2.6'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].tag.toString()).to.eql('v3.2.7');
      expect(releases[0].sha).to.eql('abc123');
      expect(releases[0].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### [3.2.7]'));
      expect(releases[0].path).to.eql('.');
    });

    it('should skip component releases for non-component configs', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName:
              'release-please--branches--main--components--storage',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore(main): release storage 3.2.7',
            body: pullRequestBody('release-notes/single.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'simple',
            includeComponentInTag: false,
          },
        },
        {
          '.': Version.parse('3.2.6'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(0);
    });

    it('should handle complex title and base branch', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName:
              'release-please--branches--hotfix/v3.1.0-bug--components--my-package-name',
            baseBranchName: 'hotfix/v3.1.0-bug',
            number: 1234,
            title: '[HOTFIX] - chore(hotfix/v3.1.0-bug): release 3.1.0-hotfix1',
            body: pullRequestBody('release-notes/single.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const manifest = new Manifest(
        github,
        'hotfix/v3.1.0-bug',
        {
          '.': {
            releaseType: 'simple',
            pullRequestTitlePattern:
              '[HOTFIX] - chore${scope}: release${component} ${version}',
            packageName: 'my-package-name',
            includeComponentInTag: false,
          },
        },
        {
          '.': Version.parse('3.1.0'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(1);
      expect(releases[0].tag.toString()).to.eql('v3.1.0-hotfix1');
      expect(releases[0].sha).to.eql('abc123');
      expect(releases[0].notes).to.be.a('string');
      expect(releases[0].path).to.eql('.');
    });

    it('should find the correct number of releases with a componentless tag', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please--branches--main',
            baseBranchName: 'main',
            number: 2,
            title: 'chore: release v1.0.1',
            body: pullRequestBody('release-notes/grouped.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'simple',
            pullRequestTitlePattern: 'chore: release v${version}',
            component: 'base',
            includeComponentInTag: false,
          },
          api: {
            releaseType: 'simple',
            component: 'api',
          },
          chat: {
            releaseType: 'simple',
            component: 'chat',
          },
          cmds: {
            releaseType: 'simple',
            component: 'cmds',
          },
          presence: {
            releaseType: 'simple',
            component: 'presence',
          },
        },
        {
          '.': Version.parse('1.0.0'),
          api: Version.parse('1.0.0'),
          chat: Version.parse('1.0.0'),
          cmds: Version.parse('1.0.0'),
          presence: Version.parse('1.0.0'),
        },
        {
          groupPullRequestTitlePattern: 'chore: release v${version}',
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(2);
    });

    it('should handle overflowing release notes', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/overflow.txt'),
            labels: ['autorelease: pending'],
            files: [
              'packages/bot-config-utils/package.json',
              'packages/label-utils/package.json',
              'packages/object-selector/package.json',
              'packages/datastore-lock/package.json',
            ],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('packages/bot-config-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/bot-config-utils'})
          )
        )
        .withArgs('packages/label-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/label-utils'})
          )
        )
        .withArgs('packages/object-selector/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/object-selector'})
          )
        )
        .withArgs('packages/datastore-lock/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/datastore-lock'})
          )
        )
        // This branch is parsed from the overflow PR body
        .withArgs('release-notes.md', 'my-head-branch--release-notes')
        .resolves(
          buildGitHubFileRaw(pullRequestBody('release-notes/multiple.txt'))
        );
      const manifest = new Manifest(
        github,
        'main',
        {
          'packages/bot-config-utils': {
            releaseType: 'node',
          },
          'packages/label-utils': {
            releaseType: 'node',
          },
          'packages/object-selector': {
            releaseType: 'node',
          },
          'packages/datastore-lock': {
            releaseType: 'node',
          },
        },
        {
          'packages/bot-config-utils': Version.parse('3.1.4'),
          'packages/label-utils': Version.parse('1.0.1'),
          'packages/object-selector': Version.parse('1.0.2'),
          'packages/datastore-lock': Version.parse('2.0.0'),
        }
      );
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(4);
      expect(releases[0].tag.toString()).to.eql('bot-config-utils-v3.2.0');
      expect(releases[0].sha).to.eql('abc123');
      expect(releases[0].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[0].path).to.eql('packages/bot-config-utils');
      expect(releases[0].name).to.eql('bot-config-utils: v3.2.0');
      expect(releases[1].tag.toString()).to.eql('label-utils-v1.1.0');
      expect(releases[1].sha).to.eql('abc123');
      expect(releases[1].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[1].path).to.eql('packages/label-utils');
      expect(releases[1].name).to.eql('label-utils: v1.1.0');
      expect(releases[2].tag.toString()).to.eql('object-selector-v1.1.0');
      expect(releases[2].sha).to.eql('abc123');
      expect(releases[2].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[2].path).to.eql('packages/object-selector');
      expect(releases[2].name).to.eql('object-selector: v1.1.0');
      expect(releases[3].tag.toString()).to.eql('datastore-lock-v2.1.0');
      expect(releases[3].sha).to.eql('abc123');
      expect(releases[3].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[3].path).to.eql('packages/datastore-lock');
      expect(releases[3].name).to.eql('datastore-lock: v2.1.0');
    });
  });

  describe('createReleases', () => {
    it('should handle a single manifest release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      mockCreateRelease(github, [
        {id: 123456, sha: 'abc123', tagName: 'release-brancher-v1.3.1'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();

      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );
      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      expect(releases[0]!.path).to.eql('.');
      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should handle a multiple manifest release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/multiple.txt'),
            labels: ['autorelease: pending'],
            files: [
              'packages/bot-config-utils/package.json',
              'packages/label-utils/package.json',
              'packages/object-selector/package.json',
              'packages/datastore-lock/package.json',
            ],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('packages/bot-config-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/bot-config-utils'})
          )
        )
        .withArgs('packages/label-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/label-utils'})
          )
        )
        .withArgs('packages/object-selector/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/object-selector'})
          )
        )
        .withArgs('packages/datastore-lock/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/datastore-lock'})
          )
        );

      mockCreateRelease(github, [
        {id: 1, sha: 'abc123', tagName: 'bot-config-utils-v3.2.0'},
        {id: 2, sha: 'abc123', tagName: 'label-utils-v1.1.0'},
        {id: 3, sha: 'abc123', tagName: 'object-selector-v1.1.0'},
        {id: 4, sha: 'abc123', tagName: 'datastore-lock-v2.1.0'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const manifest = new Manifest(
        github,
        'main',
        {
          'packages/bot-config-utils': {
            releaseType: 'node',
          },
          'packages/label-utils': {
            releaseType: 'node',
          },
          'packages/object-selector': {
            releaseType: 'node',
          },
          'packages/datastore-lock': {
            releaseType: 'node',
          },
        },
        {
          'packages/bot-config-utils': Version.parse('3.1.4'),
          'packages/label-utils': Version.parse('1.0.1'),
          'packages/object-selector': Version.parse('1.0.2'),
          'packages/datastore-lock': Version.parse('2.0.0'),
        }
      );
      const releases = await manifest.createReleases();
      expect(releases).lengthOf(4);
      expect(releases[0]!.tagName).to.eql('bot-config-utils-v3.2.0');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.be.string;
      expect(releases[0]!.path).to.eql('packages/bot-config-utils');
      expect(releases[1]!.tagName).to.eql('label-utils-v1.1.0');
      expect(releases[1]!.sha).to.eql('abc123');
      expect(releases[1]!.notes).to.be.string;
      expect(releases[1]!.path).to.eql('packages/label-utils');
      expect(releases[2]!.tagName).to.eql('object-selector-v1.1.0');
      expect(releases[2]!.sha).to.eql('abc123');
      expect(releases[2]!.notes).to.be.string;
      expect(releases[2]!.path).to.eql('packages/object-selector');
      expect(releases[3]!.tagName).to.eql('datastore-lock-v2.1.0');
      expect(releases[3]!.sha).to.eql('abc123');
      expect(releases[3]!.notes).to.be.string;
      expect(releases[3]!.path).to.eql('packages/datastore-lock');
      sinon.assert.callCount(commentStub, 4);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'bot-config-utils-v3.2.0')
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'label-utils-v1.1.0')
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'object-selector-v1.1.0')
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'datastore-lock-v2.1.0')
      );
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
      sinon.assert.calledOnce(getFileContentsStub);
    });

    it('should handle a single standalone release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore(main): release 3.2.7',
            body: pullRequestBody('release-notes/single.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'simple',
          },
        },
        {
          '.': Version.parse('3.2.6'),
        }
      );
      mockCreateRelease(github, [
        {id: 123456, sha: 'abc123', tagName: 'v3.2.7'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('v3.2.7');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.be.string;
      expect(releases[0]!.path).to.eql('.');
      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'v3.2.7')
      );
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should allow customizing pull request labels', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['some-pull-request-label'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      mockCreateRelease(github, [
        {id: 123456, sha: 'abc123', tagName: 'release-brancher-v1.3.1'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        },
        {
          labels: ['some-pull-request-label'],
          releaseLabels: ['some-tagged-label'],
          prereleaseLabels: ['some-prerelease-label'],
        }
      );
      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['some-tagged-label'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['some-pull-request-label'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should create a draft release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const githubReleaseStub = mockCreateRelease(github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'release-brancher-v1.3.1',
          draft: true,
        },
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
            draft: true,
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );
      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      expect(releases[0]!.draft).to.be.true;
      sinon.assert.calledOnceWithExactly(githubReleaseStub, sinon.match.any, {
        draft: true,
        prerelease: undefined,
      } as ReleaseOptions);
      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should create a prerelease release from beta', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody(
              'release-notes/single-manifest-prerelease.txt'
            ),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const githubReleaseStub = mockCreateRelease(github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'release-brancher-v1.3.1-beta1',
          prerelease: true,
        },
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
            prerelease: true,
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );
      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1-beta1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      expect(releases[0]!.draft).to.be.undefined;
      sinon.assert.calledOnceWithExactly(githubReleaseStub, sinon.match.any, {
        draft: undefined,
        prerelease: true,
      } as ReleaseOptions);
      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged', 'autorelease: pre-release'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1-beta1')
      );
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should not create a prerelease release from non-prerelease', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const githubReleaseStub = mockCreateRelease(github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'release-brancher-v1.3.1',
          prerelease: false,
        },
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
            prerelease: true,
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );
      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      expect(releases[0]!.draft).to.be.undefined;
      sinon.assert.calledOnceWithExactly(githubReleaseStub, sinon.match.any, {
        draft: undefined,
        prerelease: false,
      } as ReleaseOptions);
      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should create a prerelease when pull request labelled as pre-release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending', 'autorelease: pre-release'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      const githubReleaseStub = mockCreateRelease(github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'release-brancher-v1.3.1',
          prerelease: true,
        },
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );
      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      expect(releases[0]!.draft).to.be.undefined;
      sinon.assert.calledOnceWithExactly(githubReleaseStub, sinon.match.any, {
        draft: undefined,
        prerelease: true,
      } as ReleaseOptions);
      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged', 'autorelease: pre-release'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should handle partially failed manifest release', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/multiple.txt'),
            labels: ['autorelease: pending'],
            files: [
              'packages/bot-config-utils/package.json',
              'packages/label-utils/package.json',
              'packages/object-selector/package.json',
              'packages/datastore-lock/package.json',
            ],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('packages/bot-config-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/bot-config-utils'})
          )
        )
        .withArgs('packages/label-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/label-utils'})
          )
        )
        .withArgs('packages/object-selector/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/object-selector'})
          )
        )
        .withArgs('packages/datastore-lock/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/datastore-lock'})
          )
        );

      mockCreateRelease(github, [
        {
          id: 1,
          sha: 'abc123',
          tagName: 'bot-config-utils-v3.2.0',
          duplicate: true,
        },
        {id: 2, sha: 'abc123', tagName: 'label-utils-v1.1.0'},
        {id: 3, sha: 'abc123', tagName: 'object-selector-v1.1.0'},
        {id: 4, sha: 'abc123', tagName: 'datastore-lock-v2.1.0'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const manifest = new Manifest(
        github,
        'main',
        {
          'packages/bot-config-utils': {
            releaseType: 'node',
          },
          'packages/label-utils': {
            releaseType: 'node',
          },
          'packages/object-selector': {
            releaseType: 'node',
          },
          'packages/datastore-lock': {
            releaseType: 'node',
          },
        },
        {
          'packages/bot-config-utils': Version.parse('3.1.4'),
          'packages/label-utils': Version.parse('1.0.1'),
          'packages/object-selector': Version.parse('1.0.2'),
          'packages/datastore-lock': Version.parse('2.0.0'),
        }
      );
      const releases = await manifest.createReleases();
      expect(releases).lengthOf(3);
      expect(releases[0]!.tagName).to.eql('label-utils-v1.1.0');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.be.string;
      expect(releases[0]!.path).to.eql('packages/label-utils');
      expect(releases[1]!.tagName).to.eql('object-selector-v1.1.0');
      expect(releases[1]!.sha).to.eql('abc123');
      expect(releases[1]!.notes).to.be.string;
      expect(releases[1]!.path).to.eql('packages/object-selector');
      expect(releases[2]!.tagName).to.eql('datastore-lock-v2.1.0');
      expect(releases[2]!.sha).to.eql('abc123');
      expect(releases[2]!.notes).to.be.string;
      expect(releases[2]!.path).to.eql('packages/datastore-lock');
      sinon.assert.callCount(commentStub, 3);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'label-utils-v1.1.0')
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'object-selector-v1.1.0')
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'datastore-lock-v2.1.0')
      );
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should throw DuplicateReleaseError if all releases already tagged', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/multiple.txt'),
            labels: ['autorelease: pending'],
            files: [
              'packages/bot-config-utils/package.json',
              'packages/label-utils/package.json',
              'packages/object-selector/package.json',
              'packages/datastore-lock/package.json',
            ],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('packages/bot-config-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/bot-config-utils'})
          )
        )
        .withArgs('packages/label-utils/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/label-utils'})
          )
        )
        .withArgs('packages/object-selector/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/object-selector'})
          )
        )
        .withArgs('packages/datastore-lock/package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-automations/datastore-lock'})
          )
        );

      mockCreateRelease(github, [
        {
          id: 1,
          sha: 'abc123',
          tagName: 'bot-config-utils-v3.2.0',
          duplicate: true,
        },
        {id: 2, sha: 'abc123', tagName: 'label-utils-v1.1.0', duplicate: true},
        {
          id: 3,
          sha: 'abc123',
          tagName: 'object-selector-v1.1.0',
          duplicate: true,
        },
        {
          id: 4,
          sha: 'abc123',
          tagName: 'datastore-lock-v2.1.0',
          duplicate: true,
        },
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();
      const manifest = new Manifest(
        github,
        'main',
        {
          'packages/bot-config-utils': {
            releaseType: 'node',
          },
          'packages/label-utils': {
            releaseType: 'node',
          },
          'packages/object-selector': {
            releaseType: 'node',
          },
          'packages/datastore-lock': {
            releaseType: 'node',
          },
        },
        {
          'packages/bot-config-utils': Version.parse('3.1.4'),
          'packages/label-utils': Version.parse('1.0.1'),
          'packages/object-selector': Version.parse('1.0.2'),
          'packages/datastore-lock': Version.parse('2.0.0'),
        }
      );
      try {
        await manifest.createReleases();
        expect(false).to.be.true;
      } catch (err) {
        expect(err).instanceof(DuplicateReleaseError);
      }
      sinon.assert.notCalled(commentStub);
      sinon.assert.calledOnce(addLabelsStub);
      sinon.assert.calledOnce(removeLabelsStub);
      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should use fallback when branch lock fails due to missing token permissions (REST error)', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      mockCreateRelease(github, [
        {id: 123456, sha: 'abc123', tagName: 'release-brancher-v1.3.1'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();

      // make the lock branch fail with the relevant permission error
      sandbox.replace(github, 'lockBranch', async () => {
        throw new RequestError('Resource not accessible by integration', 403, {
          request: {
            method: 'POST',
            url: 'https://api.github.com/foo',
            body: {
              bar: 'baz',
            },
            headers: {
              authorization: 'token secret123',
            },
          },
          response: {
            status: 403,
            url: 'https://api.github.com/foo',
            headers: {
              'x-github-request-id': '1:2:3:4',
            },
            data: {
              foo: 'bar',
            },
          },
        });
      });

      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );

      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      expect(releases[0]!.path).to.eql('.');

      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );

      // ensure we don't try to update permissions rules again given the lock failed
      sinon.assert.notCalled(unlockBranchStub);
    });

    it('should use fallback when branch lock fails due to missing token permissions (GraphQL error)', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      mockCreateRelease(github, [
        {id: 123456, sha: 'abc123', tagName: 'release-brancher-v1.3.1'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();

      // make the lock branch fail with the relevant permission error
      sandbox.replace(github, 'lockBranch', async () => {
        throw new GraphqlResponseError(
          {
            method: 'GET',
            url: '/foo/bar',
          },
          {},
          {
            data: {},
            errors: [
              {
                type: 'FORBIDDEN',
                message: 'Resource not accessible by integration',
                path: ['foo'],
                extensions: {},
                locations: [
                  {
                    line: 123,
                    column: 456,
                  },
                ],
              },
            ],
          }
        );
      });

      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );

      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      expect(releases[0]!.path).to.eql('.');

      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );

      // ensure we don't try to update permissions rules again given the lock failed
      sinon.assert.notCalled(unlockBranchStub);
    });

    it('should align changes and target branches when release and changes branches are in sync', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please--branches--main--changes--next',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main v1.3.1',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      mockCreateRelease(github, [
        {id: 123456, sha: 'abc123', tagName: 'release-brancher-v1.3.1'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const waitForFileToBeUpToDateOnBranch = sandbox
        .stub(github, 'waitForFileToBeUpToDateOnBranch')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();

      // release branch in synced with changes-branch, safe to align changes-branch with target-branch
      const isBranchSyncedWithPullRequestCommitsStub = sandbox
        .stub(github, 'isBranchSyncedWithPullRequestCommits')
        .withArgs(
          'next',
          sinon.match.has(
            'headBranchName',
            'release-please--branches--main--changes--next'
          )
        )
        .resolves(true);

      const alignBranchWithAnotherStub = sandbox
        .stub(github, 'alignBranchWithAnother')
        .resolves();

      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );

      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      expect(releases[0]!.path).to.eql('.');

      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );
      sinon.assert.calledWith(waitForFileToBeUpToDateOnBranch, {
        branch: 'next',
        filePath: '.release-please-manifest.json',
        checkFileStatus: sinon.match.func,
      });

      sinon.assert.calledOnce(isBranchSyncedWithPullRequestCommitsStub);
      sinon.assert.calledOnce(alignBranchWithAnotherStub);

      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should not align and not throw when release branch is missing but changes-branch already synced with target-branch', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please--branches--main--changes--next',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      mockCreateRelease(github, [
        {id: 123456, sha: 'abc123', tagName: 'release-brancher-v1.3.1'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();

      // throw 404 not found when comparing changes-branch against pull request commits
      const isBranchSyncedWithPullRequestCommitsStub = sandbox
        .stub(github, 'isBranchSyncedWithPullRequestCommits')
        .withArgs(
          'next',
          sinon.match.has(
            'headBranchName',
            'release-please--branches--main--changes--next'
          )
        )
        .throwsException(
          new RequestError('Resource not found', 404, {
            request: {
              method: 'GET',
              url: 'https://api.github.com/foo',
              body: {
                bar: 'baz',
              },
              headers: {
                authorization: 'token secret123',
              },
            },
            response: {
              status: 404,
              url: 'https://api.github.com/foo',
              headers: {
                'x-github-request-id': '1:2:3:4',
              },
              data: {
                foo: 'bar',
              },
            },
          })
        );

      // changes-branch already synced with target-branch
      const isBranchASyncedWithBStub = sandbox
        .stub(github, 'isBranchASyncedWithB')
        .withArgs('next', 'main')
        .resolves(true);

      const alignBranchWithAnotherStub = sandbox
        .stub(github, 'alignBranchWithAnother')
        .resolves();

      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );

      const releases = await manifest.createReleases();
      expect(releases).lengthOf(1);
      expect(releases[0]!.tagName).to.eql('release-brancher-v1.3.1');
      expect(releases[0]!.sha).to.eql('abc123');
      expect(releases[0]!.notes).to.eql('some release notes');
      expect(releases[0]!.path).to.eql('.');

      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );

      sinon.assert.calledOnce(isBranchSyncedWithPullRequestCommitsStub);
      sinon.assert.calledOnce(isBranchASyncedWithBStub);
      sinon.assert.notCalled(alignBranchWithAnotherStub);

      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });

    it('should throw when release branch is missing and changes-branch not in synced with target-branch', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please--branches--main--changes--next',
            baseBranchName: 'main',
            number: 1234,
            title: 'chore: release main',
            body: pullRequestBody('release-notes/single-manifest.txt'),
            labels: ['autorelease: pending'],
            files: [],
            sha: 'abc123',
          },
        ]
      );
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({name: '@google-cloud/release-brancher'})
          )
        );
      mockCreateRelease(github, [
        {id: 123456, sha: 'abc123', tagName: 'release-brancher-v1.3.1'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
      const waitForReleaseToBeListedStub = sandbox
        .stub(github, 'waitForReleaseToBeListed')
        .resolves();
      const lockBranchStub = sandbox.stub(github, 'lockBranch').resolves();
      const unlockBranchStub = sandbox.stub(github, 'unlockBranch').resolves();

      // throw 404 not found when comparing changes-branch against release branch
      const isBranchSyncedWithPullRequestCommitsStub = sandbox
        .stub(github, 'isBranchSyncedWithPullRequestCommits')
        .withArgs(
          'next',
          sinon.match.has(
            'headBranchName',
            'release-please--branches--main--changes--next'
          )
        )
        .throwsException(
          new RequestError('Resource not found', 404, {
            request: {
              method: 'GET',
              url: 'https://api.github.com/foo',
              body: {
                bar: 'baz',
              },
              headers: {
                authorization: 'token secret123',
              },
            },
            response: {
              status: 404,
              url: 'https://api.github.com/foo',
              headers: {
                'x-github-request-id': '1:2:3:4',
              },
              data: {
                foo: 'bar',
              },
            },
          })
        );

      // changes-branch not in synced with target-branch
      const isBranchASyncedWithBStub = sandbox
        .stub(github, 'isBranchASyncedWithB')
        .withArgs('next', 'main')
        .resolves(false);

      const alignBranchWithAnotherStub = sandbox
        .stub(github, 'alignBranchWithAnother')
        .resolves();

      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
          },
        },
        {
          '.': Version.parse('1.3.1'),
        }
      );

      let err: unknown;
      try {
        await manifest.createReleases();
      } catch (e) {
        err = e;
      }
      expect(err).to.be.instanceOf(Error);
      snapshot((<Error>err).message);

      // releases are still created
      sinon.assert.calledOnce(commentStub);
      sinon.assert.calledOnceWithExactly(
        addLabelsStub,
        ['autorelease: tagged'],
        1234
      );
      sinon.assert.calledOnceWithExactly(
        removeLabelsStub,
        ['autorelease: pending'],
        1234
      );
      sinon.assert.calledWith(
        waitForReleaseToBeListedStub,
        sinon.match.has('tagName', 'release-brancher-v1.3.1')
      );

      sinon.assert.calledOnce(isBranchSyncedWithPullRequestCommitsStub);
      sinon.assert.calledOnce(isBranchASyncedWithBStub);
      sinon.assert.notCalled(alignBranchWithAnotherStub);

      sinon.assert.calledOnce(lockBranchStub);
      sinon.assert.calledOnce(unlockBranchStub);
    });
  });
});
