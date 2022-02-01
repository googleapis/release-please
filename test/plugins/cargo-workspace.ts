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
import {CandidateReleasePullRequest} from '../../src/manifest';
import {Update} from '../../src/update';
import {
  buildGitHubFileContent,
  buildMockCandidatePullRequest,
  assertHasUpdate,
  dateSafe,
  stubFilesFromFixtures,
} from '../helpers';
import {Version} from '../../src/version';
import {ManifestPlugin} from '../../src/plugin';
import {CargoWorkspace} from '../../src/plugins/cargo-workspace';
import {expect} from 'chai';
import snapshot = require('snap-shot-it');
import {RawContent} from '../../src/updaters/raw-content';
import {CargoToml} from '../../src/updaters/rust/cargo-toml';
import {parseCargoManifest} from '../../src/updaters/rust/common';

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
    plugin = new CargoWorkspace(github, 'main', {
      'packages/rustA': {
        releaseType: 'rust',
      },
      'packages/rustB': {
        releaseType: 'rust',
      },
      'packages/rustC': {
        releaseType: 'rust',
      },
    });
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
        buildMockCandidatePullRequest(
          'packages/rustA',
          'rust',
          '1.1.2',
          'pkgA',
          [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ]
        ),
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
      plugin = new CargoWorkspace(github, 'main', {
        python: {
          releaseType: 'python',
        },
        'packages/rustA': {
          releaseType: 'rust',
        },
      });
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
        buildMockCandidatePullRequest(
          'packages/rustA',
          'rust',
          '1.1.2',
          '@here/pkgA',
          [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ]
        ),
        buildMockCandidatePullRequest(
          'packages/rustD',
          'rust',
          '4.4.5',
          '@here/pkgD',
          [
            buildMockPackageUpdate(
              'packages/rustD/Cargo.toml',
              'packages/rustD/Cargo.toml'
            ),
          ]
        ),
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
      plugin = new CargoWorkspace(github, 'main', {
        'packages/rustA': {
          releaseType: 'rust',
        },
        'packages/rustD': {
          releaseType: 'rust',
        },
      });
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
        buildMockCandidatePullRequest(
          'packages/rustA',
          'rust',
          '1.1.2',
          '@here/pkgA',
          [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ]
        ),
        buildMockCandidatePullRequest(
          'packages/rustD',
          'rust',
          '4.4.5',
          '@here/pkgD',
          [
            buildMockPackageUpdate(
              'packages/rustD/Cargo.toml',
              'packages/rustD/Cargo.toml'
            ),
          ]
        ),
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
        ],
        flatten: false,
        targetBranch: 'main',
      });
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
      snapshot(dateSafe(rustCandidate!.pullRequest.body.toString()));
    });
    it('appends dependency notes to an updated module', async () => {
      const existingNotes =
        '### Dependencies\n\n* update dependency foo/bar to 1.2.3';
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest(
          'packages/rustA',
          'rust',
          '1.1.2',
          '@here/pkgA',
          [
            buildMockPackageUpdate(
              'packages/rustA/Cargo.toml',
              'packages/rustA/Cargo.toml'
            ),
          ]
        ),
        buildMockCandidatePullRequest(
          'packages/rustB',
          'rust',
          '2.2.3',
          '@here/pkgB',
          [
            buildMockPackageUpdate(
              'packages/rustB/Cargo.toml',
              'packages/rustB/Cargo.toml'
            ),
          ],
          existingNotes
        ),
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
        ],
        flatten: false,
        targetBranch: 'main',
      });
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
      snapshot(dateSafe(rustCandidate!.pullRequest.body.toString()));
    });
  });
});
