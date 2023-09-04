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
import {GitHub} from '../../src/github';
import {Manifest} from '../../src/manifest';
import {Update} from '../../src/update';
import {
  buildGitHubFileContent,
  mockReleases,
  mockCommits,
  safeSnapshot,
} from '../helpers';
import {Version} from '../../src/version';
import {CargoToml} from '../../src/updaters/rust/cargo-toml';
import {parseCargoManifest} from '../../src/updaters/rust/common';
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

describe('LinkedVersions plugin', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'fake-owner',
      repo: 'fake-repo',
      defaultBranch: 'main',
    });

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
        tagName: 'pkg2-v0.2.3',
        url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v0.2.3',
      },
      {
        id: 3,
        sha: 'def234',
        tagName: 'pkg3-v0.2.3',
        url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg3-v0.2.3',
      },
      {
        id: 4,
        sha: 'abc123',
        tagName: 'pkg4-v1.0.0',
        url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
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
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('should sync versions pull requests', async () => {
    const manifest = new Manifest(
      github,
      'target-branch',
      {
        'path/a': {
          releaseType: 'simple',
          component: 'pkg1',
        },
        'path/b': {
          releaseType: 'simple',
          component: 'pkg2',
        },
        'path/c': {
          releaseType: 'simple',
          component: 'pkg3',
        },
      },
      {
        'path/a': Version.parse('1.0.0'),
        'path/b': Version.parse('0.2.3'),
        'path/c': Version.parse('0.2.3'),
      },
      {
        plugins: [
          {
            type: 'linked-versions',
            groupName: 'group name',
            components: ['pkg2', 'pkg3'],
          },
        ],
      }
    );
    const pullRequests = await manifest.buildPullRequests([], []);
    expect(pullRequests).lengthOf(1);
    const pullRequest = pullRequests[0];
    const packageData2 = pullRequest.body.releaseData.find(
      data => data.component === 'pkg2'
    );
    expect(packageData2).to.not.be.undefined;
    const packageData3 = pullRequest.body.releaseData.find(
      data => data.component === 'pkg3'
    );
    expect(packageData3).to.not.be.undefined;
    expect(packageData2?.version).to.eql(packageData3?.version);
    safeSnapshot(pullRequest.body.toString());
  });
  it('should group pull requests', async () => {
    const manifest = new Manifest(
      github,
      'target-branch',
      {
        'path/a': {
          releaseType: 'simple',
          component: 'pkg1',
        },
        'path/b': {
          releaseType: 'simple',
          component: 'pkg2',
        },
        'path/c': {
          releaseType: 'simple',
          component: 'pkg3',
        },
      },
      {
        'path/a': Version.parse('1.0.0'),
        'path/b': Version.parse('0.2.3'),
        'path/c': Version.parse('0.2.3'),
      },
      {
        separatePullRequests: true,
        plugins: [
          {
            type: 'linked-versions',
            groupName: 'group name',
            components: ['pkg2', 'pkg3'],
          },
        ],
      }
    );
    const pullRequests = await manifest.buildPullRequests([], []);
    expect(pullRequests).lengthOf(2);
    const singlePullRequest = pullRequests[0];
    safeSnapshot(singlePullRequest.body.toString());

    const pullRequest = pullRequests[1];
    const packageData2 = pullRequest.body.releaseData.find(
      data => data.component === 'pkg2'
    );
    expect(packageData2).to.not.be.undefined;
    const packageData3 = pullRequest.body.releaseData.find(
      data => data.component === 'pkg3'
    );
    expect(packageData3).to.not.be.undefined;
    expect(packageData2?.version).to.eql(packageData3?.version);
    safeSnapshot(pullRequest.body.toString());
  });
  it('can skip grouping pull requests', async () => {
    const manifest = new Manifest(
      github,
      'target-branch',
      {
        'path/a': {
          releaseType: 'simple',
          component: 'pkg1',
        },
        'path/b': {
          releaseType: 'simple',
          component: 'pkg2',
        },
        'path/c': {
          releaseType: 'simple',
          component: 'pkg3',
        },
      },
      {
        'path/a': Version.parse('1.0.0'),
        'path/b': Version.parse('0.2.3'),
        'path/c': Version.parse('0.2.3'),
      },
      {
        separatePullRequests: true,
        plugins: [
          {
            type: 'linked-versions',
            groupName: 'group name',
            components: ['pkg2', 'pkg3'],
            merge: false,
          },
        ],
      }
    );
    const pullRequests = await manifest.buildPullRequests([], []);
    for (const pullRequest of pullRequests) {
      safeSnapshot(pullRequest.body.toString());
    }
  });
  it('should allow multiple groups of linked versions', async () => {
    const manifest = new Manifest(
      github,
      'target-branch',
      {
        'path/a': {
          releaseType: 'simple',
          component: 'pkg1',
        },
        'path/b': {
          releaseType: 'simple',
          component: 'pkg2',
        },
        'path/c': {
          releaseType: 'simple',
          component: 'pkg3',
        },
        'path/d': {
          releaseType: 'simple',
          component: 'pkg4',
        },
      },
      {
        'path/a': Version.parse('1.0.0'),
        'path/b': Version.parse('0.2.3'),
        'path/c': Version.parse('0.2.3'),
        'path/d': Version.parse('1.0.0'),
      },
      {
        separatePullRequests: true,
        plugins: [
          {
            type: 'linked-versions',
            groupName: 'group name',
            components: ['pkg2', 'pkg3'],
          },
          {
            type: 'linked-versions',
            groupName: 'second group name',
            components: ['pkg1', 'pkg4'],
          },
        ],
      }
    );
    const pullRequests = await manifest.buildPullRequests([], []);
    expect(pullRequests).lengthOf(2);
    const groupPullRequest1 = pullRequests[1];
    const packageData1 = groupPullRequest1.body.releaseData.find(
      data => data.component === 'pkg1'
    );
    expect(packageData1).to.not.be.undefined;
    const packageData4 = groupPullRequest1.body.releaseData.find(
      data => data.component === 'pkg4'
    );
    expect(packageData4).to.not.be.undefined;
    safeSnapshot(groupPullRequest1.body.toString());
    safeSnapshot(groupPullRequest1.headRefName);

    const groupPullRequest2 = pullRequests[0];
    const packageData2 = groupPullRequest2.body.releaseData.find(
      data => data.component === 'pkg2'
    );
    expect(packageData2).to.not.be.undefined;
    const packageData3 = groupPullRequest2.body.releaseData.find(
      data => data.component === 'pkg3'
    );
    expect(packageData3).to.not.be.undefined;
    expect(packageData2?.version).to.eql(packageData3?.version);
    safeSnapshot(groupPullRequest2.body.toString());
    safeSnapshot(groupPullRequest2.headRefName);

    expect(groupPullRequest1.headRefName).not.to.eql(
      groupPullRequest2.headRefName
    );
    expect(groupPullRequest1.headRefName).to.not.include(' ');
    expect(groupPullRequest2.headRefName).to.not.include(' ');
  });
});
