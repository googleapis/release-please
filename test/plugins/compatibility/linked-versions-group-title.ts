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
  mockPullRequests,
} from '../../helpers';
import {Version} from '../../../src/version';
import {CargoToml} from '../../../src/updaters/rust/cargo-toml';
import {parseCargoManifest} from '../../../src/updaters/rust/common';
import {expect} from 'chai';

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
  describe('linked-versions and group-pull-request-title-pattern', () => {
    it('should find release to create', async () => {
      // Scenario:
      //   - package b depends on a
      //   - package a receives a new feature
      //   - package b version bumps its dependency on a
      //   - package a and b should both use a minor version bump
      mockReleases(sandbox, github, [
        {
          id: 123456,
          sha: 'abc123',
          tagName: 'primary-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/primary-v1.0.0',
        },
        {
          id: 654321,
          sha: 'abc123',
          tagName: 'pkgA-v1.0.0',
          url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkgA-v1.0.0',
        },
      ]);
      mockCommits(sandbox, github, [
        {
          sha: 'aaaaaa',
          message: 'feat: some feature',
          files: ['packages/nodeA/foo'],
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
          ['package.json', '{"name": "primary", "version": "1.0.0"}'],
          [
            'packages/nodeA/package.json',
            '{"name": "pkgA", "version": "1.0.0"}',
          ],
        ],
      });
      const manifest = new Manifest(
        github,
        'main',
        {
          '.': {
            releaseType: 'node',
            component: 'primary',
          },
          'packages/nodeA': {
            releaseType: 'node',
            component: 'pkgA',
          },
        },
        {
          '.': Version.parse('1.0.0'),
          'packages/nodeA': Version.parse('1.0.0'),
        },
        {
          plugins: [
            {
              type: 'linked-versions',
              groupName: 'my group',
              components: ['primary', 'pkgA'],
            },
          ],
          groupPullRequestTitlePattern: 'chore: Release${component} ${version}',
        }
      );
      const pullRequests = await manifest.buildPullRequests([], []);
      expect(pullRequests).lengthOf(1);
      const pullRequest = pullRequests[0];
      safeSnapshot(pullRequest.body.toString());
      expect(pullRequest.title.toString()).to.equal(
        'chore: Release primary 1.1.0'
      );

      console.log('-----------------------------------');

      mockPullRequests(sandbox, github, [
        {
          headBranchName: pullRequest.headRefName,
          baseBranchName: 'main',
          number: 1234,
          title: pullRequest.title.toString(),
          body: pullRequest.body.toString(),
          labels: pullRequest.labels,
          files: pullRequest.updates.map(update => update.path),
          sha: 'cccccc',
        },
      ]);
      const releases = await manifest.buildReleases();
      expect(releases).lengthOf(2);
    });
  });
});
