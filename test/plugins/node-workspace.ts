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
import {CandidateReleasePullRequest} from '../../src/manifest';
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
  readFixture,
} from '../helpers';
import snapshot = require('snap-shot-it');
import {ManifestPlugin} from '../../src/plugin';
import {Changelog} from '../../src/updaters/changelog';
import {ReleasePleaseManifest} from '../../src/updaters/release-please-manifest';
import {Node} from '../../src/strategies/node';
import {TagName} from '../../src/util/tag-name';
import {Generic} from '../../src/updaters/generic';
import {PrereleaseVersioningStrategy} from '../../src/versioning-strategies/prerelease';

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

/**
 * Helper test to ensure that the file update exists and that
 * the file is a json file with a .version equal to the provided
 * version string.
 *
 * @param {Update[]} updates List of updates to search for
 * @param {string} fixture Fixture name
 * @param {string} expectedVersion Expected version string
 */
function assertHasVersionUpdate(
  updates: Update[],
  fixture: string,
  expectedVersion: string
) {
  const update = assertHasUpdate(updates, fixture);
  const originalContent = readFixture(fixturesPath, fixture);
  const content = update.updater.updateContent(originalContent);
  const data = JSON.parse(content);
  expect(data.version).to.eql(expectedVersion);
}

/**
 * Helper test to snapshot the final contents of a file update.
 *
 * @param {Update[]} updates List of updates to search for
 * @param {string} fixture Fixture name
 */
function snapshotUpdate(
  updates: Update[],
  file: string,
  originalContent?: string
) {
  if (!originalContent) {
    originalContent = readFixture(fixturesPath, file);
  }
  const update = assertHasUpdate(updates, file);
  snapshot(update.updater.updateContent(originalContent));
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
    plugin = new NodeWorkspace(github, 'main', {
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
    });
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
      plugin = new NodeWorkspace(github, 'main', {
        python: {
          releaseType: 'python',
        },
        node1: {
          releaseType: 'node',
        },
      });
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
        buildMockCandidatePullRequest('node1', 'node', '3.3.3', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
          ],
        }),
      ];
      plugin = new NodeWorkspace(github, 'main', {
        plugin1: {releaseType: 'node'},
        node1: {releaseType: 'node'},
      });
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'node1/package.json');
      snapshotUpdate(updates, 'plugin1/package.json');
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
      plugin = new NodeWorkspace(github, 'main', {
        '.': {
          releaseType: 'node',
        },
        node1: {
          releaseType: 'node',
        },
        node4: {
          releaseType: 'node',
        },
      });
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
      snapshotUpdate(updates, 'package.json');
      snapshotUpdate(updates, 'node1/package.json');
      snapshotUpdate(updates, 'node4/package.json');
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
      assertHasVersionUpdate(updates, 'node1/package.json', '3.3.4');
      assertHasVersionUpdate(updates, 'node2/package.json', '2.2.3');
      assertHasVersionUpdate(updates, 'node3/package.json', '1.1.2');
      assertHasVersionUpdate(updates, 'node4/package.json', '4.4.5');
      assertHasVersionUpdate(updates, 'node5/package.json', '1.0.1');
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
    it('walks dependency tree and updates previously untouched packages (prerelease)', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('node1', 'node', '3.3.4-beta', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
          ],
        }),
        buildMockCandidatePullRequest('node4', 'node', '4.4.5-beta', {
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

      await plugin.preconfigure(
        {
          node1: new Node({
            github,
            targetBranch: 'main',
            path: 'node1',
            packageName: '@here/pkgA',
            versioningStrategy: new PrereleaseVersioningStrategy({
              prereleaseType: 'beta',
            }),
          }),
          node2: new Node({
            github,
            targetBranch: 'main',
            path: 'node2',
            packageName: '@here/pkgB',
            versioningStrategy: new PrereleaseVersioningStrategy({
              prereleaseType: 'beta',
            }),
          }),
          node3: new Node({
            github,
            targetBranch: 'main',
            path: 'node3',
            packageName: '@here/pkgC',
            versioningStrategy: new PrereleaseVersioningStrategy({
              prereleaseType: 'beta',
            }),
          }),
          node4: new Node({
            github,
            targetBranch: 'main',
            path: 'node4',
            packageName: '@here/pkgD',
            versioningStrategy: new PrereleaseVersioningStrategy({
              prereleaseType: 'beta',
            }),
          }),
          node5: new Node({
            github,
            targetBranch: 'main',
            path: 'node5',
            packageName: '@here/pkgE',
            versioningStrategy: new PrereleaseVersioningStrategy({
              prereleaseType: 'beta',
            }),
          }),
        },
        {},
        {
          node2: {
            tag: new TagName(new Version(2, 2, 2, 'beta'), 'pkgB'),
            sha: '',
            notes: '',
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
      assertHasVersionUpdate(updates, 'node1/package.json', '3.3.4-beta');
      assertHasVersionUpdate(updates, 'node2/package.json', '2.2.3-beta');
      assertHasVersionUpdate(updates, 'node3/package.json', '1.1.2-beta');
      assertHasVersionUpdate(updates, 'node4/package.json', '4.4.5-beta');
      assertHasVersionUpdate(updates, 'node5/package.json', '1.0.1-beta');
      const updater = assertHasUpdate(
        updates,
        '.release-please-manifest.json',
        ReleasePleaseManifest
      ).updater as ReleasePleaseManifest;
      expect(updater.versionsMap?.get('node2')?.toString()).to.eql(
        '2.2.3-beta'
      );
      expect(updater.versionsMap?.get('node3')?.toString()).to.eql(
        '1.1.2-beta'
      );
      expect(updater.versionsMap?.get('node5')?.toString()).to.eql(
        '1.0.1-beta'
      );
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
              '2.2.3',
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
      assertHasVersionUpdate(updates, 'node1/package.json', '3.3.4');
      assertHasVersionUpdate(updates, 'node2/package.json', '2.2.3');
      assertHasVersionUpdate(updates, 'node3/package.json', '1.1.2');
      assertNoHasUpdate(updates, 'node4/package.json');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
      const update = assertHasUpdate(updates, 'node1/CHANGELOG.md', Changelog);
      snapshot((update.updater as Changelog).changelogEntry);
      const update2 = assertHasUpdate(updates, 'node2/CHANGELOG.md', Changelog);
      snapshot((update2.updater as Changelog).changelogEntry);
      const update3 = assertHasUpdate(updates, 'node3/CHANGELOG.md', Changelog);
      snapshot((update3.updater as Changelog).changelogEntry);
    });
    it('includes headers for packages with configured strategies', async () => {
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
      await plugin.preconfigure(
        {
          node1: new Node({
            github,
            targetBranch: 'main',
            path: 'node1',
            packageName: '@here/pkgA',
          }),
          node2: new Node({
            github,
            targetBranch: 'main',
            path: 'node2',
            packageName: '@here/pkgB',
          }),
          node3: new Node({
            github,
            targetBranch: 'main',
            path: 'node3',
            packageName: '@here/pkgC',
          }),
          node4: new Node({
            github,
            targetBranch: 'main',
            path: 'node4',
            packageName: '@here/pkgD',
          }),
          node5: new Node({
            github,
            targetBranch: 'main',
            path: 'node5',
            packageName: '@here/pkgE',
          }),
        },
        {},
        {
          node2: {
            tag: new TagName(new Version(2, 2, 2), 'pkgB'),
            sha: '',
            notes: '',
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
      assertHasVersionUpdate(updates, 'node1/package.json', '3.3.4');
      assertHasVersionUpdate(updates, 'node2/package.json', '2.2.3');
      assertHasVersionUpdate(updates, 'node3/package.json', '1.1.2');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
      const update = assertHasUpdate(updates, 'node1/CHANGELOG.md', Changelog);
      snapshot(dateSafe((update.updater as Changelog).changelogEntry));
      const changelogUpdaterNode2 = assertHasUpdate(
        updates,
        'node2/CHANGELOG.md',
        Changelog
      ).updater as Changelog;
      snapshot(dateSafe(changelogUpdaterNode2.changelogEntry));

      const changelogUpdaterNode3 = assertHasUpdate(
        updates,
        'node3/CHANGELOG.md',
        Changelog
      ).updater as Changelog;

      snapshot(dateSafe(changelogUpdaterNode3.changelogEntry));
    });
    it('incorporates extra-files from strategy', async () => {
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
      await plugin.preconfigure(
        {
          node1: new Node({
            github,
            targetBranch: 'main',
            path: 'node1',
            packageName: '@here/pkgA',
          }),
          node2: new Node({
            github,
            targetBranch: 'main',
            path: 'node2',
            packageName: '@here/pkgB',
            extraFiles: ['my-file'],
          }),
        },
        {},
        {
          node2: {
            tag: new TagName(new Version(2, 2, 2), 'pkgB'),
            sha: '',
            notes: '',
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

      assertHasUpdate(updates, 'node2/my-file', Generic);
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
      plugin = new NodeWorkspace(github, 'main', {
        node1: {
          releaseType: 'node',
        },
        plugin1: {
          releaseType: 'node',
        },
      });
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
  describe('with updatePeerDependencies: true', () => {
    const options = {updatePeerDependencies: true};
    it('should not ignore peer dependencies', async () => {
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
        {
          node1: {
            releaseType: 'node',
          },
          plugin1: {
            releaseType: 'node',
          },
        },
        options
      );
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'node1/package.json');
      assertHasUpdate(updates, 'plugin1/package.json');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
    });

    it('respects version prefix and updates peer dependencies', async () => {
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
        {
          plugin1: {releaseType: 'node'},
          node1: {releaseType: 'node'},
        },
        options
      );
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const nodeCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'node'
      );
      expect(nodeCandidate).to.not.be.undefined;
      const updates = nodeCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'node1/package.json');
      snapshotUpdate(updates, 'plugin1/package.json');
    });
  });
});
