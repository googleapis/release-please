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

import {describe, it, afterEach, beforeEach} from 'mocha';
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';
import {NodeWorkspace} from '../../src/plugins/node-workspace';
import {
  CandidateReleasePullRequest,
  DEFAULT_RELEASE_PLEASE_MANIFEST,
} from '../../src/manifest';
import {expect} from 'chai';
import {Version} from '../../src/version';
import {Update} from '../../src/update';
import {PackageJson} from '../../src/updaters/node/package-json';
import {
  buildGitHubFileContent,
  assertHasUpdate,
  stubFilesFromFixtures,
  dateSafe,
  assertNoHasUpdate,
  buildMockCandidatePullRequest,
  buildGitHubFileRaw,
} from '../helpers';
import {RawContent} from '../../src/updaters/raw-content';
import snapshot = require('snap-shot-it');
import {ManifestPlugin} from '../../src/plugin';
import {Changelog} from '../../src/updaters/changelog';
import {ReleasePleaseManifest} from '../../src/updaters/release-please-manifest';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/plugins/node-workspace';

export function buildMockPackageUpdate(
  path: string,
  fixtureName: string
): Update {
  const cachedFileContents = buildGitHubFileContent(fixturesPath, fixtureName);
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

function buildMockChangelogUpdate(
  path: string,
  versionString: string,
  changelogEntry: string
): Update {
  const cachedFileContents = buildGitHubFileRaw(changelogEntry);
  return {
    path,
    createIfMissing: false,
    cachedFileContents,
    updater: new Changelog({
      changelogEntry,
      version: Version.parse(versionString),
    }),
  };
}

function assertHasVersionUpdate(update: Update, expectedVersion: string) {
  expect(update.updater).instanceof(RawContent);
  const updater = update.updater as RawContent;
  const data = JSON.parse(updater.rawContent);
  expect(data.version).to.eql(expectedVersion);
}

describe('NodeWorkspace plugin', () => {
  let github: GitHub;
  let plugin: ManifestPlugin;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'node-test-repo',
      defaultBranch: 'main',
    });
    plugin = new NodeWorkspace(
      github,
      'main',
      DEFAULT_RELEASE_PLEASE_MANIFEST,
      {
        node1: {
          releaseType: 'node',
        },
        node2: {
          releaseType: 'node',
        },
        node3: {
          releaseType: 'node',
        },
        node4: {
          releaseType: 'node',
        },
        node5: {
          releaseType: 'node',
        },
      }
    );
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('does nothing for non-node strategies', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0'),
      ];
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).to.eql(candidates);
    });
    it('handles a single node package', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0'),
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
          ],
        }),
      ];
      plugin = new NodeWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          python: {
            releaseType: 'python',
          },
          node1: {
            releaseType: 'node',
          },
        }
      );
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(2);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'node1/package.json');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
    });
    it('respects version prefix', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('plugin1', 'node', '4.4.4', {
          component: '@here/plugin1',
          updates: [
            buildMockPackageUpdate(
              'plugin1/package.json',
              'plugin1/package.json'
            ),
          ],
        }),
        buildMockCandidatePullRequest('node1', 'node', '2.2.2', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
          ],
        }),
      ];
      plugin = new NodeWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          plugin1: {releaseType: 'node'},
          node1: {releaseType: 'node'},
        }
      );
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'node1/package.json');

      const update = assertHasUpdate(
        updates,
        'plugin1/package.json',
        RawContent
      );
      const updater = update.updater as RawContent;
      snapshot(updater.rawContent);
    });
    it('combines node packages', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('.', 'node', '5.5.6', {
          component: '@here/root',
          updates: [buildMockPackageUpdate('package.json', 'package.json')],
        }),
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
          ],
        }),
        buildMockCandidatePullRequest('node4', 'node', '4.4.5', {
          component: '@here/pkgD',
          updates: [
            buildMockPackageUpdate('node4/package.json', 'node4/package.json'),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: ['package.json', 'node1/package.json', 'node4/package.json'],
        flatten: false,
        targetBranch: 'main',
      });
      plugin = new NodeWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          '.': {
            releaseType: 'node',
          },
          node1: {
            releaseType: 'node',
          },
          node4: {
            releaseType: 'node',
          },
        }
      );
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'package.json');
      assertHasUpdate(updates, 'node1/package.json');
      assertHasUpdate(updates, 'node4/package.json');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
    });
    it('walks dependency tree and updates previously untouched packages', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
          ],
        }),
        buildMockCandidatePullRequest('node4', 'node', '4.4.5', {
          component: '@here/pkgD',
          updates: [
            buildMockPackageUpdate('node4/package.json', 'node4/package.json'),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'node1/package.json',
          'node2/package.json',
          'node3/package.json',
          'node4/package.json',
          'node5/package.json',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      assertHasVersionUpdate(
        assertHasUpdate(updates, 'node1/package.json', RawContent),
        '3.3.4'
      );
      assertHasVersionUpdate(
        assertHasUpdate(updates, 'node2/package.json', RawContent),
        '2.2.3'
      );
      assertHasVersionUpdate(
        assertHasUpdate(updates, 'node3/package.json', RawContent),
        '1.1.2'
      );
      assertHasVersionUpdate(
        assertHasUpdate(updates, 'node4/package.json', RawContent),
        '4.4.5'
      );
      assertHasVersionUpdate(
        assertHasUpdate(updates, 'node5/package.json', RawContent),
        '1.0.1'
      );
      const updater = assertHasUpdate(
        updates,
        '.release-please-manifest.json',
        ReleasePleaseManifest
      ).updater as ReleasePleaseManifest;
      expect(updater.versionsMap?.get('node2')?.toString()).to.eql('2.2.3');
      expect(updater.versionsMap?.get('node3')?.toString()).to.eql('1.1.2');
      expect(updater.versionsMap?.get('node5')?.toString()).to.eql('1.0.1');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
    });
    it('appends dependency notes to an updated module', async () => {
      const existingNotes =
        '### Dependencies\n\n* update dependency foo/bar to 1.2.3';
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
            buildMockChangelogUpdate(
              'node1/CHANGELOG.md',
              '3.3.4',
              'other notes'
            ),
          ],
        }),
        buildMockCandidatePullRequest('node2', 'node', '2.2.3', {
          component: '@here/pkgB',
          updates: [
            buildMockPackageUpdate('node2/package.json', 'node2/package.json'),
            buildMockChangelogUpdate(
              'node2/CHANGELOG.md',
              '3.3.4',
              existingNotes
            ),
          ],
          notes: existingNotes,
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'node1/package.json',
          'node2/package.json',
          'node3/package.json',
          'node4/package.json',
          'node5/package.json',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      assertHasVersionUpdate(
        assertHasUpdate(updates, 'node1/package.json', RawContent),
        '3.3.4'
      );
      assertHasVersionUpdate(
        assertHasUpdate(updates, 'node2/package.json', RawContent),
        '2.2.3'
      );
      assertHasVersionUpdate(
        assertHasUpdate(updates, 'node3/package.json', RawContent),
        '1.1.2'
      );
      assertNoHasUpdate(updates, 'node4/package.json');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
      const update = assertHasUpdate(updates, 'node1/CHANGELOG.md', Changelog);
      snapshot((update.updater as Changelog).changelogEntry);
      const update2 = assertHasUpdate(updates, 'node2/CHANGELOG.md', Changelog);
      snapshot((update2.updater as Changelog).changelogEntry);
      const update3 = assertHasUpdate(updates, 'node3/CHANGELOG.md', Changelog);
      snapshot((update3.updater as Changelog).changelogEntry);
    });
    it('should ignore peer dependencies', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: ['node1/package.json', 'plugin1/package.json'],
        flatten: false,
        targetBranch: 'main',
      });
      plugin = new NodeWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          node1: {
            releaseType: 'node',
          },
          plugin1: {
            releaseType: 'node',
          },
        }
      );
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'node1/package.json');
      assertNoHasUpdate(updates, 'plugin1/package.json');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
    });
  });
});
