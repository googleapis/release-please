// Copyright 2019 Google LLC
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

import {describe, it, afterEach} from 'mocha';
import {expect} from 'chai';
import * as nock from 'nock';
nock.disableNetConnect();

import {ConventionalCommits} from '../src/conventional-commits';
import {GitHub, GitHubTag, GitHubPR} from '../src/github';
import {ReleaseCandidate, ReleasePR, OpenPROptions} from '../src/release-pr';
import * as sinon from 'sinon';
import {Node} from '../src/releasers/node';

const sandbox = sinon.createSandbox();

class TestableReleasePR extends Node {
  openPROpts?: GitHubPR;
  async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag?: GitHubTag,
    preRelese = false
  ): Promise<ReleaseCandidate> {
    return super.coerceReleaseCandidate(cc, latestTag, preRelese);
  }
  async openPR(options: OpenPROptions) {
    this.gh = {
      openPR: async (opts: GitHubPR): Promise<number> => {
        this.openPROpts = opts;
        return 0;
      },
    } as GitHub;
    return super.openPR(options);
  }
}

describe('Release-PR', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('coerceReleaseCandidate', () => {
    it('suggests next version #, based on commit types', async () => {
      const rp = new TestableReleasePR({
        repoUrl: 'googleapis/nodejs',
        packageName: '@google-cloud/nodejs',
        apiUrl: 'github.com',
        releaseType: 'node',
      });
      const cc = new ConventionalCommits({
        commits: [
          {
            sha: 'abc123',
            message: 'fix: addresses issues with library',
            files: [],
          },
          {
            sha: 'abc124',
            message: 'feat!: adds a slick new feature',
            files: [],
          },
          {
            sha: 'abc125',
            message: 'fix: another fix',
            files: [],
          },
        ],
        githubRepoUrl: 'googleapis/nodejs',
      });
      const candidate = await rp.coerceReleaseCandidate(cc, {
        name: 'tag',
        sha: 'abc123',
        version: '2.0.0',
      });
      expect(candidate.version).to.equal('3.0.0');
    });

    it('reads release-as footer, and allows it to override recommended bump', async () => {
      const rp = new TestableReleasePR({
        repoUrl: 'googleapis/nodejs',
        packageName: '@google-cloud/nodejs',
        apiUrl: 'github.com',
        releaseType: 'node',
      });
      const cc = new ConventionalCommits({
        commits: [
          {
            sha: 'abc123',
            message: 'fix: addresses issues with library',
            files: [],
          },
          {
            sha: 'abc124',
            message: 'feat: adds a slick new feature\nRelease-As: 2.0.0',
            files: [],
          },
          {
            sha: 'abc125',
            message: 'fix: another fix\n\nRelease-As: 3.0.0',
            files: [],
          },
        ],
        githubRepoUrl: 'googleapis/nodejs',
      });
      const candidate = await rp.coerceReleaseCandidate(cc);
      expect(candidate.version).to.equal('2.0.0');
    });

    it('it handles additional content after release-as: footer', async () => {
      const rp = new TestableReleasePR({
        repoUrl: 'googleapis/nodejs',
        packageName: '@google-cloud/nodejs',
        apiUrl: 'github.com',
        releaseType: 'node',
      });
      const cc = new ConventionalCommits({
        commits: [
          {
            sha: 'abc123',
            message: 'fix: addresses issues with library',
            files: [],
          },
          {
            sha: 'abc124',
            message:
              'feat: adds a slick new feature\nRelease-As: 2.0.0\r\nSecond Footer: hello',
            files: [],
          },
          {
            sha: 'abc125',
            message: 'fix: another fix\n\nRelease-As: 3.0.0',
            files: [],
          },
        ],
        githubRepoUrl: 'googleapis/nodejs',
      });
      const candidate = await rp.coerceReleaseCandidate(cc);
      expect(candidate.version).to.equal('2.0.0');
    });

    describe('preRelease', () => {
      it('increments a prerelease appropriately', async () => {
        const rp = new TestableReleasePR({
          repoUrl: 'googleapis/nodejs',
          packageName: '@google-cloud/nodejs',
          apiUrl: 'github.com',
          releaseType: 'node',
        });
        const cc = new ConventionalCommits({
          commits: [],
          githubRepoUrl: 'googleapis/nodejs',
        });
        const candidate = await rp.coerceReleaseCandidate(
          cc,
          {
            name: 'tag',
            sha: 'abc123',
            version: '1.0.0-alpha9',
          },
          true
        );
        expect(candidate.version).to.equal('1.0.0-alpha10');
      });

      it('handles pre-release when there is no suffix', async () => {
        const rp = new TestableReleasePR({
          repoUrl: 'googleapis/nodejs',
          packageName: '@google-cloud/nodejs',
          apiUrl: 'github.com',
          releaseType: 'node',
        });
        const cc = new ConventionalCommits({
          commits: [],
          githubRepoUrl: 'googleapis/nodejs',
        });
        const candidate = await rp.coerceReleaseCandidate(
          cc,
          {
            name: 'tag',
            sha: 'abc123',
            version: '1.0.0',
          },
          true
        );
        expect(candidate.version).to.equal('1.0.0-alpha1');
      });
    });
  });

  describe('openPR', () => {
    it('drops npm style @org/ prefix', async () => {
      const rp = new TestableReleasePR({
        repoUrl: 'googleapis/nodejs',
        packageName: '@google-cloud/nodejs',
        apiUrl: 'https://api.github.com',
        releaseType: 'node',
      });
      await rp.openPR({
        sha: 'abc123',
        changelogEntry: 'changelog',
        updates: [],
        version: '1.3.0',
        includePackageName: true,
      });
      expect(rp.openPROpts?.branch).to.equal('release-nodejs-v1.3.0');
    });
  });

  describe('lookupPackageName', () => {
    it('noop, child releasers need to implement', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const name = await ReleasePR.lookupPackageName(github);
      expect(name).to.be.undefined;
    });
  });

  describe('coercePackagePrefix', () => {
    it('should default to the package name', () => {
      const inputs = ['foo/bar', 'foobar', ''];
      inputs.forEach(input => {
        const releasePR = new ReleasePR({
          packageName: input,
          repoUrl: 'owner/repo',
          apiUrl: 'unused',
          releaseType: 'unused',
        });
        expect(releasePR.packagePrefix).to.eql(input);
      });
    });
  });
});
