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
} from '../helpers';
import {RawContent} from '../../src/updaters/raw-content';
import snapshot = require('snap-shot-it');
import {ManifestPlugin} from '../../src/plugin';

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
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', '@here/pkgA', [
          buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
        ]),
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
    it('combines node packages', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', '@here/pkgA', [
          buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
        ]),
        buildMockCandidatePullRequest('node4', 'node', '4.4.5', '@here/pkgD', [
          buildMockPackageUpdate('node4/package.json', 'node4/package.json'),
        ]),
      ];
      plugin = new NodeWorkspace(github, 'main', {
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
      assertHasUpdate(updates, 'node1/package.json');
      assertHasUpdate(updates, 'node4/package.json');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
    });
    it('walks dependency tree and updates previously untouched packages', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', '@here/pkgA', [
          buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
        ]),
        buildMockCandidatePullRequest('node4', 'node', '4.4.5', '@here/pkgD', [
          buildMockPackageUpdate('node4/package.json', 'node4/package.json'),
        ]),
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
      assertHasUpdate(updates, 'node1/package.json', RawContent);
      assertHasUpdate(updates, 'node2/package.json', RawContent);
      assertHasUpdate(updates, 'node3/package.json', RawContent);
      assertHasUpdate(updates, 'node4/package.json', RawContent);
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
    });
    it('appends dependency notes to an updated module', async () => {
      const existingNotes =
        '### Dependencies\n\n* update dependency foo/bar to 1.2.3';
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('node1', 'node', '3.3.4', '@here/pkgA', [
          buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
        ]),
        buildMockCandidatePullRequest(
          'node2',
          'node',
          '2.2.3',
          '@here/pkgB',
          [buildMockPackageUpdate('node2/package.json', 'node2/package.json')],
          existingNotes
        ),
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
      assertHasUpdate(updates, 'node1/package.json', RawContent);
      assertHasUpdate(updates, 'node2/package.json', RawContent);
      assertHasUpdate(updates, 'node3/package.json', RawContent);
      assertNoHasUpdate(updates, 'node4/package.json');
      snapshot(dateSafe(nodeCandidate!.pullRequest.body.toString()));
    });
  });
});
