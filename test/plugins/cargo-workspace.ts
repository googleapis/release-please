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
import {
  CandidateReleasePullRequest,
  DEFAULT_RELEASE_PLEASE_MANIFEST,
} from '../../src/manifest';
import {Update} from '../../src/update';
import {
  buildGitHubFileContent,
  buildMockCandidatePullRequest,
  assertHasUpdate,
  dateSafe,
  stubFilesFromFixtures,
  assertNoHasUpdate,
  safeSnapshot,
} from '../helpers';
import {Version} from '../../src/version';
import {ManifestPlugin} from '../../src/plugin';
import {CargoWorkspace} from '../../src/plugins/cargo-workspace';
import {expect} from 'chai';
import snapshot = require('snap-shot-it');
import {RawContent} from '../../src/updaters/raw-content';
import {CargoToml} from '../../src/updaters/rust/cargo-toml';
import {parseCargoManifest} from '../../src/updaters/rust/common';
import {ConfigurationError} from '../../src/errors';
import assert = require('assert');

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/plugins/cargo-workspace';

export function buildMockPackageUpdate(
  path: string,
  fixtureName: string
): Update {
  const cachedFileContents = buildGitHubFileContent(fixturesPath, fixtureName);
  const manifest = parseCargoManifest(cachedFileContents.parsedContent);
  return {
    path,
    createIfMissing: false,
    cachedFileContents,
    updater: new CargoToml({
      version: Version.parse(manifest.package?.version || 'FIXME'),
    }),
  };
}

describe('CargoWorkspace plugin', () => {
  let github: GitHub;
  let plugin: ManifestPlugin;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'rust-test-repo',
      defaultBranch: 'main',
    });
    plugin = new CargoWorkspace(
      github,
      'main',
      DEFAULT_RELEASE_PLEASE_MANIFEST,
      {
        'packages/rustA': {
          releaseType: 'rust',
        },
        'packages/rustB': {
          releaseType: 'rust',
        },
        'packages/rustC': {
          releaseType: 'rust',
        },
      }
    );
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('rejects if not a workspace', async () => {});
    it('rejects if no workspace members', async () => {});
    it('does nothing for non-rust strategies', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0'),
      ];
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).to.eql(candidates);
    });
    it('handles a single rust package', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0'),
        buildMockCandidatePullRequest('packages/rustA', 'rust', '1.1.2', {
          component: 'pkgA',
          updates: [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: ['packages/rustA/Cargo.toml'],
        flatten: false,
        targetBranch: 'main',
        inlineFiles: [
          ['Cargo.toml', '[workspace]\nmembers = ["packages/rustA"]'],
        ],
      });
      plugin = new CargoWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          python: {
            releaseType: 'python',
          },
          'packages/rustA': {
            releaseType: 'rust',
          },
        }
      );
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/rustA', 'main')
        .resolves(['packages/rustA']);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(2);
      const rustCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'rust'
      );
      expect(rustCandidate).to.not.be.undefined;
      const updates = rustCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'packages/rustA/Cargo.toml');
      assertHasUpdate(updates, 'Cargo.lock');
      snapshot(dateSafe(rustCandidate!.pullRequest.body.toString()));
    });
    it('combines rust packages', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/rustA', 'rust', '1.1.2', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ],
        }),
        buildMockCandidatePullRequest('packages/rustD', 'rust', '4.4.5', {
          component: '@here/pkgD',
          updates: [
            buildMockPackageUpdate(
              'packages/rustD/Cargo.toml',
              'packages/rustD/Cargo.toml'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: ['packages/rustA/Cargo.toml', 'packages/rustD/Cargo.toml'],
        flatten: false,
        targetBranch: 'main',
        inlineFiles: [
          [
            'Cargo.toml',
            '[workspace]\nmembers = ["packages/rustA", "packages/rustD"]',
          ],
        ],
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/rustA', 'main')
        .resolves(['packages/rustA'])
        .withArgs('packages/rustD', 'main')
        .resolves(['packages/rustD']);
      plugin = new CargoWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          'packages/rustA': {
            releaseType: 'rust',
          },
          'packages/rustD': {
            releaseType: 'rust',
          },
        }
      );
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const rustCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'rust'
      );
      expect(rustCandidate).to.not.be.undefined;
      const updates = rustCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'packages/rustA/Cargo.toml');
      assertHasUpdate(updates, 'packages/rustD/Cargo.toml');
      snapshot(dateSafe(rustCandidate!.pullRequest.body.toString()));
    });
    it('handles glob paths', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/rustA', 'rust', '1.1.2', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ],
        }),
        buildMockCandidatePullRequest('packages/rustD', 'rust', '4.4.5', {
          component: '@here/pkgD',
          updates: [
            buildMockPackageUpdate(
              'packages/rustD/Cargo.toml',
              'packages/rustD/Cargo.toml'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: ['packages/rustA/Cargo.toml', 'packages/rustD/Cargo.toml'],
        flatten: false,
        targetBranch: 'main',
        inlineFiles: [['Cargo.toml', '[workspace]\nmembers = ["packages/*"]']],
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/*', 'main')
        .resolves(['packages/rustA', 'packages/rustD']);
      plugin = new CargoWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          'packages/rustA': {
            releaseType: 'rust',
          },
          'packages/rustD': {
            releaseType: 'rust',
          },
        }
      );
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const rustCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'rust'
      );
      expect(rustCandidate).to.not.be.undefined;
      const updates = rustCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'packages/rustA/Cargo.toml');
      assertHasUpdate(updates, 'packages/rustD/Cargo.toml');
      snapshot(dateSafe(rustCandidate!.pullRequest.body.toString()));
    });
    it('walks dependency tree and updates previously untouched packages', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/rustA', 'rust', '1.1.2', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ],
        }),
        buildMockCandidatePullRequest('packages/rustD', 'rust', '4.4.5', {
          component: '@here/pkgD',
          updates: [
            buildMockPackageUpdate(
              'packages/rustD/Cargo.toml',
              'packages/rustD/Cargo.toml'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'Cargo.toml',
          'packages/rustA/Cargo.toml',
          'packages/rustB/Cargo.toml',
          'packages/rustC/Cargo.toml',
          'packages/rustD/Cargo.toml',
          'packages/rustE/Cargo.toml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/rustA', 'main')
        .resolves(['packages/rustA'])
        .withArgs('packages/rustB', 'main')
        .resolves(['packages/rustB'])
        .withArgs('packages/rustC', 'main')
        .resolves(['packages/rustC'])
        .withArgs('packages/rustD', 'main')
        .resolves(['packages/rustD'])
        .withArgs('packages/rustE', 'main')
        .resolves(['packages/rustE']);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const rustCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'rust'
      );
      expect(rustCandidate).to.not.be.undefined;
      const updates = rustCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'packages/rustA/Cargo.toml', RawContent);
      assertHasUpdate(updates, 'packages/rustB/Cargo.toml', RawContent);
      assertHasUpdate(updates, 'packages/rustC/Cargo.toml', RawContent);
      assertHasUpdate(updates, 'packages/rustD/Cargo.toml', RawContent);
      assertHasUpdate(updates, 'packages/rustE/Cargo.toml', RawContent);
      snapshot(dateSafe(rustCandidate!.pullRequest.body.toString()));
    });
    it('can skip merging rust packages', async () => {
      // This is the same setup as 'walks dependency tree and updates previously untouched packages'
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/rustA', 'rust', '1.1.2', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ],
        }),
        buildMockCandidatePullRequest('packages/rustD', 'rust', '4.4.5', {
          component: '@here/pkgD',
          updates: [
            buildMockPackageUpdate(
              'packages/rustD/Cargo.toml',
              'packages/rustD/Cargo.toml'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'Cargo.toml',
          'packages/rustA/Cargo.toml',
          'packages/rustB/Cargo.toml',
          'packages/rustC/Cargo.toml',
          'packages/rustD/Cargo.toml',
          'packages/rustE/Cargo.toml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/rustA', 'main')
        .resolves(['packages/rustA'])
        .withArgs('packages/rustB', 'main')
        .resolves(['packages/rustB'])
        .withArgs('packages/rustC', 'main')
        .resolves(['packages/rustC'])
        .withArgs('packages/rustD', 'main')
        .resolves(['packages/rustD'])
        .withArgs('packages/rustE', 'main')
        .resolves(['packages/rustE']);
      plugin = new CargoWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          'packages/rustA': {
            releaseType: 'rust',
          },
          'packages/rustD': {
            releaseType: 'rust',
          },
        },
        {
          merge: false,
        }
      );
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(5);
      for (const newCandidate of newCandidates) {
        safeSnapshot(newCandidate.pullRequest.body.toString());
      }
    });
    it('appends dependency notes to an updated module', async () => {
      const existingNotes =
        '### Dependencies\n\n* update dependency foo/bar to 1.2.3';
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/rustA', 'rust', '1.1.2', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ],
        }),
        buildMockCandidatePullRequest('packages/rustB', 'rust', '2.2.3', {
          component: '@here/pkgB',
          updates: [
            buildMockPackageUpdate(
              'packages/rustB/Cargo.toml',
              'packages/rustB/Cargo.toml'
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
          'Cargo.toml',
          'packages/rustA/Cargo.toml',
          'packages/rustB/Cargo.toml',
          'packages/rustC/Cargo.toml',
          'packages/rustD/Cargo.toml',
          'packages/rustE/Cargo.toml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/rustA', 'main')
        .resolves(['packages/rustA'])
        .withArgs('packages/rustB', 'main')
        .resolves(['packages/rustB'])
        .withArgs('packages/rustC', 'main')
        .resolves(['packages/rustC'])
        .withArgs('packages/rustD', 'main')
        .resolves(['packages/rustD'])
        .withArgs('packages/rustE', 'main')
        .resolves(['packages/rustE']);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const rustCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'rust'
      );
      expect(rustCandidate).to.not.be.undefined;
      const updates = rustCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'packages/rustA/Cargo.toml', RawContent);
      assertHasUpdate(updates, 'packages/rustB/Cargo.toml', RawContent);
      assertHasUpdate(updates, 'packages/rustC/Cargo.toml', RawContent);
      assertHasUpdate(updates, 'packages/rustE/Cargo.toml', RawContent);
      snapshot(dateSafe(rustCandidate!.pullRequest.body.toString()));
    });
    it('skips component if not touched', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/rustB', 'rust', '2.3.0', {
          component: 'pkgB',
          updates: [
            buildMockPackageUpdate(
              'packages/rustB/Cargo.toml',
              'packages/rustB/Cargo.toml'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'Cargo.toml',
          'packages/rustA/Cargo.toml',
          'packages/rustB/Cargo.toml',
          'packages/rustC/Cargo.toml',
          'packages/rustD/Cargo.toml',
          'packages/rustE/Cargo.toml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/rustA', 'main')
        .resolves(['packages/rustA'])
        .withArgs('packages/rustB', 'main')
        .resolves(['packages/rustB'])
        .withArgs('packages/rustC', 'main')
        .resolves(['packages/rustC'])
        .withArgs('packages/rustD', 'main')
        .resolves(['packages/rustD'])
        .withArgs('packages/rustE', 'main')
        .resolves(['packages/rustE']);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const rustCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'rust'
      );
      expect(rustCandidate).to.not.be.undefined;
      const updates = rustCandidate!.pullRequest.updates;
      // pkgA is not touched and does not have a dependency on pkgB
      assertNoHasUpdate(updates, 'packages/rustA/Cargo.toml');
      assertNoHasUpdate(updates, 'packages/rustE/Cargo.toml');
      assertHasUpdate(updates, 'packages/rustB/Cargo.toml', RawContent);
      snapshot(dateSafe(rustCandidate!.pullRequest.body.toString()));
    });
    it('handles packages without version', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/rustA', 'rust', '1.1.2', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: ['packages/rustA/Cargo.toml'],
        flatten: false,
        targetBranch: 'main',
        inlineFiles: [
          [
            'Cargo.toml',
            '[workspace]\nmembers = ["packages/rustA", "packages/rustB"]',
          ],
          [
            'packages/rustB/Cargo.toml',
            '[package]\nname = "pkgB"\n\n[dependencies]\npkgA = { version = "1.1.1", path = "../pkgA" }',
          ],
        ],
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/rustA', 'main')
        .resolves(['packages/rustA'])
        .withArgs('packages/rustB', 'main')
        .resolves(['packages/rustB']);
      plugin = new CargoWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          'packages/rustA': {
            releaseType: 'rust',
          },
          'packages/rustB': {
            releaseType: 'rust',
          },
        }
      );
      await assert.rejects(
        async () => {
          await plugin.run(candidates);
        },
        err => {
          return (
            err instanceof ConfigurationError && err.message.includes('missing')
          );
        }
      );
    });
    it('handles packages with invalid version', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/rustA', 'rust', '1.1.2', {
          component: '@here/pkgA',
          updates: [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: ['packages/rustA/Cargo.toml'],
        flatten: false,
        targetBranch: 'main',
        inlineFiles: [
          [
            'Cargo.toml',
            '[workspace]\nmembers = ["packages/rustA", "packages/rustB"]',
          ],
          [
            'packages/rustB/Cargo.toml',
            '[package]\nname = "pkgB"\nversion = { major = 1, minor = 2, patch = 3 }\n\n[dependencies]\npkgA = { version = "1.1.1", path = "../pkgA" }',
          ],
        ],
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/rustA', 'main')
        .resolves(['packages/rustA'])
        .withArgs('packages/rustB', 'main')
        .resolves(['packages/rustB']);
      plugin = new CargoWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          'packages/rustA': {
            releaseType: 'rust',
          },
          'packages/rustB': {
            releaseType: 'rust',
          },
        }
      );
      await assert.rejects(
        async () => {
          await plugin.run(candidates);
        },
        err => {
          return (
            err instanceof ConfigurationError && err.message.includes('invalid')
          );
        }
      );
    });
  });
});
