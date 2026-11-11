// Copyright 2026 Google LLC
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
import * as sinon from 'sinon';
import {expect} from 'chai';
import {GitHub} from '../src/github';
import {Manifest, CandidateReleasePullRequest} from '../src/manifest';
import {Version} from '../src/version';
import {FileNotFoundError} from '../src/errors';
import {componentManifestPath} from '../src/util/component-manifest';
import {ReleasePleaseManifest} from '../src/updaters/release-please-manifest';
import {NodeWorkspace} from '../src/plugins/node-workspace';
import {PackageJson} from '../src/updaters/node/package-json';
import {Update} from '../src/update';
import {
  assertHasUpdate,
  assertNoHasUpdate,
  buildGitHubFileContent,
  buildGitHubFileRaw,
  buildMockCandidatePullRequest,
  mockCommits,
  mockReleases,
  stubFilesFromFixtures,
} from './helpers';
const fetch = require('node-fetch');

const sandbox = sinon.createSandbox();

describe('component manifests', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'fake-owner',
      repo: 'fake-repo',
      defaultBranch: 'main',
      token: 'fake-token',
      fetch,
    });
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('componentManifestPath', () => {
    it('places the root component manifest at the repository root', () => {
      expect(componentManifestPath('.')).to.eql(
        '.release-please-manifest.json'
      );
    });
    it('places a component manifest at the component root', () => {
      expect(componentManifestPath('packages/a')).to.eql(
        'packages/a/.release-please-manifest.json'
      );
    });
  });

  describe('fromManifest', () => {
    function stubConfig(extra: Record<string, unknown> = {}) {
      return sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('release-please-config.json', 'main')
        .resolves(
          buildGitHubFileRaw(
            JSON.stringify({
              'release-type': 'simple',
              packages: {'.': {}, 'path/a': {}, 'path/b': {}},
              ...extra,
            })
          )
        );
    }

    it('reads versions from each component manifest', async () => {
      stubConfig({'component-manifests': true})
        .withArgs('.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw('{".": "3.0.0"}'))
        .withArgs('path/a/.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw('{"path/a": "1.2.3"}'))
        .withArgs('path/b/.release-please-manifest.json', 'main')
        .rejects(new FileNotFoundError('path/b/.release-please-manifest.json'));
      const manifest = await Manifest.fromManifest(github, 'main');
      expect(Object.keys(manifest.repositoryConfig)).lengthOf(3);
      expect(manifest.releasedVersions).to.eql({
        '.': Version.parse('3.0.0'),
        'path/a': Version.parse('1.2.3'),
      });
    });

    it('can be enabled via manifest option overrides', async () => {
      stubConfig()
        .withArgs('.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw('{".": "3.0.0"}'))
        .withArgs('path/a/.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw('{"path/a": "1.2.3"}'))
        .withArgs('path/b/.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw('{"path/b": "0.1.0"}'));
      const manifest = await Manifest.fromManifest(
        github,
        'main',
        undefined,
        undefined,
        {componentManifests: true}
      );
      expect(manifest.releasedVersions).to.eql({
        '.': Version.parse('3.0.0'),
        'path/a': Version.parse('1.2.3'),
        'path/b': Version.parse('0.1.0'),
      });
    });

    it('ignores entries for other components in a component manifest', async () => {
      stubConfig({'component-manifests': true})
        .withArgs('.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw('{"path/a": "9.9.9"}'))
        .withArgs('path/a/.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw('{"path/a": "1.2.3"}'))
        .withArgs('path/b/.release-please-manifest.json', 'main')
        .resolves(buildGitHubFileRaw('{"path/b": "0.1.0"}'));
      const manifest = await Manifest.fromManifest(github, 'main');
      expect(manifest.releasedVersions).to.eql({
        'path/a': Version.parse('1.2.3'),
        'path/b': Version.parse('0.1.0'),
      });
    });
  });

  describe('buildPullRequests', () => {
    it('writes each separate pull request version to its own component manifest', async () => {
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
          sha: 'def234',
          message: 'chore: release 0.2.3',
          files: [],
          pullRequest: {
            headBranchName: 'release-please/branches/main/components/pkg2',
            baseBranchName: 'main',
            number: 124,
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
          'path/a': {releaseType: 'simple', component: 'pkg1'},
          'path/b': {releaseType: 'simple', component: 'pkg2'},
        },
        {
          'path/a': Version.parse('1.0.0'),
          'path/b': Version.parse('0.2.3'),
        },
        {separatePullRequests: true, componentManifests: true}
      );
      const pullRequests = await manifest.buildPullRequests();
      expect(pullRequests).lengthOf(2);
      const [prA, prB] = pullRequests;

      const updateA = assertHasUpdate(
        prA.updates,
        'path/a/.release-please-manifest.json',
        ReleasePleaseManifest
      );
      expect(updateA.createIfMissing).to.be.true;
      expect(updateA.updater.updateContent('')).to.eql(
        JSON.stringify({'path/a': '1.0.1'}, null, 2)
      );
      assertNoHasUpdate(prA.updates, 'path/b/.release-please-manifest.json');
      assertNoHasUpdate(prA.updates, '.release-please-manifest.json');

      assertHasUpdate(
        prB.updates,
        'path/b/.release-please-manifest.json',
        ReleasePleaseManifest
      );
      assertNoHasUpdate(prB.updates, 'path/a/.release-please-manifest.json');
      assertNoHasUpdate(prB.updates, '.release-please-manifest.json');
    });
  });

  describe('workspace plugin', () => {
    const fixturesPath = './test/fixtures/plugins/node-workspace';
    function buildMockPackageUpdate(path: string): Update {
      const cachedFileContents = buildGitHubFileContent(fixturesPath, path);
      return {
        path,
        createIfMissing: false,
        cachedFileContents,
        updater: new PackageJson({
          version: Version.parse(
            JSON.parse(cachedFileContents.parsedContent).version
          ),
        }),
      };
    }
    function buildCandidates(): CandidateReleasePullRequest[] {
      return [
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', {
          component: '@here/pkgA',
          updates: [buildMockPackageUpdate('node1/package.json')],
        }),
        buildMockCandidatePullRequest('node4', 'node', '4.4.5', {
          component: '@here/pkgD',
          updates: [buildMockPackageUpdate('node4/package.json')],
        }),
      ];
    }
    const repositoryConfig = {
      node1: {releaseType: 'node' as const},
      node2: {releaseType: 'node' as const},
      node3: {releaseType: 'node' as const},
      node4: {releaseType: 'node' as const},
      node5: {releaseType: 'node' as const},
    };
    // node1 and node4 have their own candidates (their manifest updates are
    // added by Manifest.buildPullRequests); node2, node3 and node5 are bumped
    // by the plugin because they depend on them.
    const forcedBumps: Record<string, string> = {
      node2: '2.2.3',
      node3: '1.1.2',
      node5: '1.0.1',
    };
    beforeEach(() => {
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: Object.keys(repositoryConfig).map(p => `${p}/package.json`),
        flatten: false,
        targetBranch: 'main',
      });
    });

    it('adds each forced bump to its own candidate when unmerged', async () => {
      const plugin = new NodeWorkspace(github, 'main', repositoryConfig, {
        componentManifests: true,
        merge: false,
      });
      const newCandidates = await plugin.run(buildCandidates());
      expect(newCandidates).lengthOf(5);
      for (const candidate of newCandidates) {
        const updates = candidate.pullRequest.updates;
        assertNoHasUpdate(updates, '.release-please-manifest.json');
        for (const path of Object.keys(repositoryConfig)) {
          if (path === candidate.path && forcedBumps[path]) {
            const update = assertHasUpdate(
              updates,
              componentManifestPath(path),
              ReleasePleaseManifest
            );
            expect(update.createIfMissing).to.be.true;
            expect(JSON.parse(update.updater.updateContent(''))).to.eql({
              [path]: forcedBumps[path],
            });
          } else {
            assertNoHasUpdate(updates, componentManifestPath(path));
          }
        }
      }
    });

    it('adds every forced bump to a merged candidate', async () => {
      const plugin = new NodeWorkspace(github, 'main', repositoryConfig, {
        componentManifests: true,
      });
      const newCandidates = await plugin.run(buildCandidates());
      expect(newCandidates).lengthOf(1);
      const updates = newCandidates[0].pullRequest.updates;
      assertNoHasUpdate(updates, '.release-please-manifest.json');
      for (const path of Object.keys(forcedBumps)) {
        assertHasUpdate(updates, componentManifestPath(path));
      }
    });
  });
});
