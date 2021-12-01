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
import {Manifest} from '../src/manifest';
import {GitHub, GitHubRelease} from '../src/github';
import * as sinon from 'sinon';
import {Commit} from '../src/commit';
import {
  buildGitHubFileContent,
  buildGitHubFileRaw,
  stubSuggesterWithSnapshot,
  assertHasUpdate,
  dateSafe,
} from './helpers';
import {expect} from 'chai';
import {Version} from '../src/version';
import {PullRequest} from '../src/pull-request';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as factory from '../src/factory';
import {NodeWorkspace} from '../src/plugins/node-workspace';
import {CargoWorkspace} from '../src/plugins/cargo-workspace';
import {PullRequestTitle} from '../src/util/pull-request-title';
import {PullRequestBody} from '../src/util/pull-request-body';
import {RawContent} from '../src/updaters/raw-content';
import {TagName} from '../src/util/tag-name';
import snapshot = require('snap-shot-it');

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures';

function mockCommits(github: GitHub, commits: Commit[]) {
  async function* fakeGenerator() {
    for (const commit of commits) {
      yield commit;
    }
  }
  sandbox.stub(github, 'mergeCommitIterator').returns(fakeGenerator());
}

function mockReleases(github: GitHub, releases: GitHubRelease[]) {
  async function* fakeGenerator() {
    for (const release of releases) {
      yield release;
    }
  }
  sandbox.stub(github, 'releaseIterator').returns(fakeGenerator());
}

function mockPullRequests(
  github: GitHub,
  pullRequests: PullRequest[],
  mergedPullRequests: PullRequest[] = []
): sinon.SinonStub {
  async function* fakeGenerator() {
    for (const pullRequest of pullRequests) {
      yield pullRequest;
    }
  }
  async function* mergedGenerator() {
    for (const pullRequest of mergedPullRequests) {
      yield pullRequest;
    }
  }
  return sandbox
    .stub(github, 'pullRequestIterator')
    .withArgs(sinon.match.string, 'OPEN')
    .returns(fakeGenerator())
    .withArgs(sinon.match.string, 'MERGED')
    .returns(mergedGenerator());
}

function mockCreateRelease(
  github: GitHub,
  releases: {sha: string; tagName: string; draft?: boolean}[]
) {
  const releaseStub = sandbox.stub(github, 'createRelease');
  for (const {sha, tagName, draft} of releases) {
    releaseStub
      .withArgs(
        sinon.match.has(
          'tag',
          sinon.match((tag: TagName) => tag.toString() === tagName)
        )
      )
      .resolves({
        tagName,
        sha,
        url: 'https://path/to/release',
        notes: 'some release notes',
        draft,
      });
  }
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
    it('it should parse config and manifest from repostiory', async () => {
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
  });

  describe('fromConfig', () => {
    it('should pass strategy options to the strategy', async () => {
      mockCommits(github, [
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

      const manifest = await Manifest.fromConfig(github, 'target-branch', {
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
      });
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(1);
      expect(Object.keys(manifest.releasedVersions)).lengthOf(1);
    });
    it('should find custom release pull request title', async () => {
      mockCommits(github, [
        {
          sha: 'abc123',
          message: 'some commit message',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main',
            baseBranchName: 'main',
            title: 'release: 1.2.3',
            number: 123,
            body: '',
            labels: [],
            files: [],
          },
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
      mockCommits(github, [
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
      mockCommits(github, [
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
  });

  describe('buildPullRequests', () => {
    describe('with basic config', () => {
      beforeEach(() => {
        mockReleases(github, [
          {
            sha: 'abc123',
            tagName: 'v1.0.0',
            url: 'https://github.com/fake-owner/fake-repo/releases/tag/v1.0.0',
          },
        ]);
        mockCommits(github, [
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
        const pullRequests = await manifest.buildPullRequests();
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
        const pullRequests = await manifest.buildPullRequests();
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
        const pullRequests = await manifest.buildPullRequests();
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
        const pullRequests = await manifest.buildPullRequests();
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
        const pullRequests = await manifest.buildPullRequests();
        expect(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        expect(pullRequest.title.toString()).to.eql('release: 1.0.1');
      });
    });

    it('should find the component from config', async () => {
      mockReleases(github, [
        {
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
      ]);
      mockCommits(github, [
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
      const pullRequests = await manifest.buildPullRequests();
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      expect(pullRequest.version?.toString()).to.eql('1.0.1');
      expect(pullRequest.headRefName).to.eql(
        'release-please--branches--main--components--pkg1'
      );
    });

    it('should handle multiple package repository', async () => {
      mockReleases(github, [
        {
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v0.2.3',
        },
      ]);
      mockCommits(github, [
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
      const pullRequests = await manifest.buildPullRequests();
      expect(pullRequests).lengthOf(1);
      snapshot(dateSafe(pullRequests[0].body.toString()));
    });

    it('should allow creating multiple pull requests', async () => {
      mockReleases(github, [
        {
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(github, [
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
      const pullRequests = await manifest.buildPullRequests();
      expect(pullRequests).lengthOf(2);
      snapshot(dateSafe(pullRequests[0].body.toString()));
      snapshot(dateSafe(pullRequests[1].body.toString()));
    });

    it('should allow forcing release-as on a single component', async () => {
      mockReleases(github, [
        {
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(github, [
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
      const config = {
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
        .withArgs('release-please-config.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(github, 'main');
      const pullRequests = await manifest.buildPullRequests();
      expect(pullRequests).lengthOf(2);
      expect(pullRequests[0].version?.toString()).to.eql('1.0.1');
      expect(pullRequests[1].version?.toString()).to.eql('3.3.3');
    });

    it('should allow forcing release-as on entire manifest', async () => {
      mockReleases(github, [
        {
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(github, [
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
      const config = {
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
        .withArgs('release-please-config.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(github, 'main');
      const pullRequests = await manifest.buildPullRequests();
      expect(pullRequests).lengthOf(2);
      expect(pullRequests[0].version?.toString()).to.eql('3.3.3');
      expect(pullRequests[1].version?.toString()).to.eql('3.3.3');
    });

    it('should allow specifying a bootstrap sha', async () => {
      mockReleases(github, []);
      mockCommits(github, [
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
      const config = {
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
        .withArgs('release-please-config.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(github, 'main');
      const pullRequests = await manifest.buildPullRequests();
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].version?.toString()).to.eql('1.0.0');
    });

    it('should allow specifying a last release sha', async () => {
      mockReleases(github, [
        {
          sha: 'abc123',
          tagName: 'pkg1-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
        },
        {
          sha: 'def234',
          tagName: 'pkg2-v0.2.3',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
        },
      ]);
      mockCommits(github, [
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
      const config = {
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
        .withArgs('release-please-config.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(github, 'main');
      const pullRequests = await manifest.buildPullRequests();
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].version?.toString()).to.eql('1.0.0');
    });

    it('should read latest version from manifest if no release tag found', async () => {
      mockReleases(github, []);
      mockCommits(github, [
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
      const config = {
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
        .withArgs('release-please-config.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(config)))
        .withArgs('.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw(JSON.stringify(versions)));
      const manifest = await Manifest.fromManifest(github, 'main');
      const pullRequests = await manifest.buildPullRequests();
      expect(pullRequests).lengthOf(1);
      expect(pullRequests[0].version?.toString()).to.eql('1.2.4');
    });

    describe('with plugins', () => {
      beforeEach(() => {
        mockReleases(github, [
          {
            sha: 'abc123',
            tagName: 'pkg1-v1.0.0',
            url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
          },
          {
            sha: 'def234',
            tagName: 'pkg2-v0.2.3',
            url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v1.0.0',
          },
        ]);
        mockCommits(github, [
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
      });

      it('should load and run a single plugins', async () => {
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
        const mockPlugin = sandbox.createStubInstance(NodeWorkspace);
        mockPlugin.run.returnsArg(0);
        sandbox
          .stub(factory, 'buildPlugin')
          .withArgs(sinon.match.has('type', 'node-workspace'))
          .returns(mockPlugin);
        const pullRequests = await manifest.buildPullRequests();
        expect(pullRequests).not.empty;
        sinon.assert.calledOnce(mockPlugin.run);
      });

      it('should load and run multiple plugins', async () => {
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
            plugins: ['node-workspace', 'cargo-workspace'],
          }
        );
        const mockPlugin = sandbox.createStubInstance(NodeWorkspace);
        mockPlugin.run.returnsArg(0);
        const mockPlugin2 = sandbox.createStubInstance(CargoWorkspace);
        mockPlugin2.run.returnsArg(0);
        sandbox
          .stub(factory, 'buildPlugin')
          .withArgs(sinon.match.has('type', 'node-workspace'))
          .returns(mockPlugin)
          .withArgs(sinon.match.has('type', 'cargo-workspace'))
          .returns(mockPlugin2);
        const pullRequests = await manifest.buildPullRequests();
        expect(pullRequests).not.empty;
        sinon.assert.calledOnce(mockPlugin.run);
        sinon.assert.calledOnce(mockPlugin2.run);
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
      sandbox.stub(manifest, 'buildPullRequests').resolves([]);
      const pullRequests = await manifest.createPullRequests();
      expect(pullRequests).to.be.empty;
    });

    it('handles a single pull request', async function () {
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
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
          title: PullRequestTitle.ofTargetBranch('main'),
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
      const pullRequests = await manifest.createPullRequests();
      expect(pullRequests).lengthOf(1);
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
        .stub(github, 'createReleasePullRequest')
        .withArgs(
          sinon.match.has('headRefName', 'release-please/branches/main'),
          'main'
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
          sinon.match.has('headRefName', 'release-please/branches/main2'),
          'main'
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
          title: PullRequestTitle.ofTargetBranch('main'),
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
          title: PullRequestTitle.ofTargetBranch('main'),
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
      const pullRequests = await manifest.createPullRequests();
      expect(pullRequests.map(pullRequest => pullRequest!.number)).to.eql([
        123, 124,
      ]);
    });

    it('handles signoff users', async function () {
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
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
          title: PullRequestTitle.ofTargetBranch('main'),
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
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(1);
    });

    it('handles fork = true', async function () {
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
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
          title: PullRequestTitle.ofTargetBranch('main'),
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
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(1);
    });

    it('updates an existing pull request', async function () {
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('README.md', 'main')
        .resolves(buildGitHubFileRaw('some-content'));
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
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
          title: PullRequestTitle.ofTargetBranch('main'),
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
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(1);
    });

    it('skips pull requests if there are pending, closed pull requests', async () => {
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
          title: PullRequestTitle.ofTargetBranch('main'),
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
      const pullRequestNumbers = await manifest.createPullRequests();
      expect(pullRequestNumbers).lengthOf(0);
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
      expect(releases[1].tag.toString()).to.eql('label-utils-v1.1.0');
      expect(releases[1].sha).to.eql('abc123');
      expect(releases[1].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[1].path).to.eql('packages/label-utils');
      expect(releases[2].tag.toString()).to.eql('object-selector-v1.1.0');
      expect(releases[2].sha).to.eql('abc123');
      expect(releases[2].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[2].path).to.eql('packages/object-selector');
      expect(releases[3].tag.toString()).to.eql('datastore-lock-v2.1.0');
      expect(releases[3].sha).to.eql('abc123');
      expect(releases[3].notes)
        .to.be.a('string')
        .and.satisfy((msg: string) => msg.startsWith('### Features'));
      expect(releases[3].path).to.eql('packages/datastore-lock');
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
      expect(releases[0].draft).to.be.true;
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
      expect(releases[0].draft).to.be.true;
    });

    it('should skip component in tag', async () => {
      mockPullRequests(
        github,
        [],
        [
          {
            headBranchName: 'release-please/branches/main',
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
        {sha: 'abc123', tagName: 'release-brancher-v1.3.1'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
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

      mockCreateRelease(github, [
        {sha: 'abc123', tagName: 'bot-config-utils-v3.2.0'},
        {sha: 'abc123', tagName: 'label-utils-v1.1.0'},
        {sha: 'abc123', tagName: 'object-selector-v1.1.0'},
        {sha: 'abc123', tagName: 'datastore-lock-v2.1.0'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
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
      mockCreateRelease(github, [{sha: 'abc123', tagName: 'v3.2.7'}]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
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
        {sha: 'abc123', tagName: 'release-brancher-v1.3.1'},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
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
        },
        {
          labels: ['some-pull-request-label'],
          releaseLabels: ['some-tagged-label'],
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
      mockCreateRelease(github, [
        {sha: 'abc123', tagName: 'release-brancher-v1.3.1', draft: true},
      ]);
      const commentStub = sandbox.stub(github, 'commentOnIssue').resolves();
      const addLabelsStub = sandbox.stub(github, 'addIssueLabels').resolves();
      const removeLabelsStub = sandbox
        .stub(github, 'removeIssueLabels')
        .resolves();
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
    });
  });
});
