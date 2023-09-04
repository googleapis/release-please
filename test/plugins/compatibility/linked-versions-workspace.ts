// Copyright 2022 Google LLC
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
import {GitHub} from '../../../src/github';
import {Manifest} from '../../../src/manifest';
import {Update} from '../../../src/update';
import {
  buildGitHubFileContent,
  mockReleases,
  mockCommits,
  safeSnapshot,
  stubFilesFromFixtures,
  assertHasUpdates,
  assertHasUpdate,
} from '../../helpers';
import {Version} from '../../../src/version';
import {CargoToml} from '../../../src/updaters/rust/cargo-toml';
import {parseCargoManifest} from '../../../src/updaters/rust/common';
import {expect} from 'chai';
import {Changelog} from '../../../src/updaters/changelog';
import {ReleasePleaseManifest} from '../../../src/updaters/release-please-manifest';
import {CompositeUpdater} from '../../../src/updaters/composite';

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

describe('Plugin compatibility', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'fake-owner',
      repo: 'fake-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('linked-versions and workspace', () => {
    it('should version bump dependencies together', async () => {
      // Scenario:
      //   - package b depends on a
      //   - package a receives a new feature
      //   - package b version bumps its dependency on a
      //   - package a and b should both use a minor version bump
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'pkgA-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkgA-v1.0.0',
        },
        {
          id: 654321,
          sha: 'abc123',
          tagName: 'pkgB-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkgB-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'feat: some feature',
          files: ['packages/rustA/foo'],
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
      ]);
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [],
        flatten: false,
        targetBranch: 'main',
        inlineFiles: [
          [
            'Cargo.toml',
            '[workspace]\nmembers = ["packages/rustA", "packages/rustB"]',
          ],
          [
            'packages/rustA/Cargo.toml',
            '[package]\nname = "pkgA"\nversion = "1.0.0"',
          ],
          [
            'packages/rustB/Cargo.toml',
            '[package]\nname = "pkgB"\nversion = "1.0.0"\n\n[dependencies]\npkgA = { version = "1.0.0", path = "../pkgA" }',
          ],
        ],
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/rustA', 'main')
        .resolves(['packages/rustA'])
        .withArgs('packages/rustB', 'main')
        .resolves(['packages/rustB']);
      const manifest = new Manifest(
        github,
        'main',
        {
          'packages/rustA': {
            releaseType: 'rust',
            component: 'pkgA',
          },
          'packages/rustB': {
            releaseType: 'rust',
            component: 'pkgB',
          },
        },
        {
          'packages/rustA': Version.parse('1.0.0'),
          'packages/rustB': Version.parse('1.0.0'),
        },
        {
          plugins: [
            {type: 'cargo-workspace', merge: false},
            {
              type: 'linked-versions',
              groupName: 'my group',
              components: ['pkgA', 'pkgB'],
            },
          ],
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      safeSnapshot(pullRequest.body.toString());
      const updater = (
        assertHasUpdates(
          pullRequest.updates,
          'packages/rustA/CHANGELOG.md',
          Changelog
        ) as Update
      ).updater as Changelog;
      expect(updater.version.toString()).to.eql('1.1.0');
      const updaterB = (
        assertHasUpdates(
          pullRequest.updates,
          'packages/rustB/CHANGELOG.md',
          Changelog
        ) as Update
      ).updater as Changelog;
      expect(updaterB.version.toString()).to.eql('1.1.0');
      const manifestUpdate = assertHasUpdate(
        pullRequest.updates,
        '.release-please-manifest.json',
        CompositeUpdater
      );
      expect(manifestUpdate.updater).instanceOf(CompositeUpdater);
      const manifestUpdaters = (manifestUpdate.updater as CompositeUpdater)
        .updaters;
      expect(manifestUpdaters).not.empty;
      for (const manifestUpdater of manifestUpdaters) {
        expect(manifestUpdater).instanceOf(ReleasePleaseManifest);
        const versionsMap = (manifestUpdater as ReleasePleaseManifest)
          .versionsMap;
        expect(versionsMap).to.not.be.undefined;
        for (const [path, version] of versionsMap!.entries()) {
          expect(version.toString(), `${path} version`).to.eql('1.1.0');
        }
      }
    });
  });
});
