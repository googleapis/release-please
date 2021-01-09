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

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';

import {ReleaseCandidate, ReleasePR, OpenPROptions} from '../src/release-pr';
import {PHPYoshi} from '../src/releasers/php-yoshi';

import * as suggester from 'code-suggester';
import * as sinon from 'sinon';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures';

class TestableReleasePR extends ReleasePR {
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

  describe('Yoshi PHP Mono-Repo', () => {
    it('generates CHANGELOG and aborts if duplicate', async () => {
      // Fake the createPullRequest step, and capture a set of files to
      // assert against:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
          'utf8'
        )
      );
      const req = nock('https://api.github.com')
        // check to see if this PR was already landed and we're
        // just waiting on the autorelease.
        .get(
          '/repos/googleapis/release-please/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, undefined)
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get(
          '/repos/googleapis/release-please/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, [
          {
            base: {
              label: 'googleapis:master',
            },
            head: {
              label: 'googleapis:release-v0.20.3',
            },
            merged_at: new Date().toISOString(),
            merge_commit_sha: 'bf69d0f204474b88b3f8b5a72a392129d16a3929',
          },
        ])
        // now we fetch the commits via the graphql API;
        // note they will be truncated to just before the tag's sha.
        .post('/graphql', () => {
          return true;
        })
        .reply(200, {
          data: graphql,
        })
        // Look for any existing release PRs that are still open:
        .get('/repos/googleapis/release-please/pulls?state=open&per_page=100')
        .reply(200, [])
        // fetch the current version of each library.
        .get(
          '/repos/googleapis/release-please/contents/AutoMl%2Fcomposer.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('{"name": "automl"}', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/AutoMl%2FVERSION?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('1.8.3', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/Datastore%2Fcomposer.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('{"name": "datastore"}', 'utf8').toString(
            'base64'
          ),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/Datastore%2FVERSION?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('2.0.0', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/PubSub%2Fcomposer.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('{"name": "pubsub"}', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/PubSub%2FVERSION?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('1.0.1', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/Speech%2Fcomposer.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('{"name": "speech"}', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/Speech%2FVERSION?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('1.0.0', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/WebSecurityScanner%2Fcomposer.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from(
            '{"name": "websecurityscanner"}',
            'utf8'
          ).toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/WebSecurityScanner%2FVERSION?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('0.8.0', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // besides the composer.json and VERSION files that need to be
        // processed for each individual module, there are several
        // overarching meta-information files that need updating.
        .get(
          '/repos/googleapis/release-please/contents/docs%2FVERSION?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/CHANGELOG.md?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/src%2FVersion.php?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/src%2FServiceBuilder.php?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/composer.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from('{"replace": {}}', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/docs%2Fmanifest.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from(
            '{"modules": [{"name": "google/cloud", "versions": []}, {"name": "datastore", "versions": []}]}',
            'utf8'
          ).toString('base64'),
          sha: 'abc123',
        })
        // Add autorelease: pending label to release PR:
        .post('/repos/googleapis/release-please/issues/22/labels')
        .reply(200)
        // check for default branch
        .get('/repos/googleapis/release-please')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../test/fixtures/repo-get-1.json'))
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/release-please/pulls?state=open&per_page=100')
        .reply(200, []);

      const releasePR = new PHPYoshi({
        repoUrl: 'googleapis/release-please',
        label: 'autorelease: pending',
        releaseType: 'php-yoshi',
        // not actually used by this type of repo.
        packageName: 'yoshi-php',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
      snapshot(JSON.stringify(expectedChanges, null, 2));
    });
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
        apiUrl: 'github.com',
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
});
