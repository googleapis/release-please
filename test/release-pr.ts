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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {expect} from 'chai';
import * as nock from 'nock';
nock.disableNetConnect();

import {ConventionalCommits} from '../src/conventional-commits';
import {GitHub, GitHubTag, GitHubPR, GitHubFileContents} from '../src/github';
import {ReleaseCandidate, ReleasePR, OpenPROptions} from '../src/release-pr';
import * as sinon from 'sinon';
import {Node} from '../src/releasers/node';
import {readFileSync} from 'fs';
import {resolve} from 'path';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures';

class TestableReleasePR extends Node {
  openPROpts?: GitHubPR;
  async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag?: GitHubTag,
    preRelease = false
  ): Promise<ReleaseCandidate> {
    return super.coerceReleaseCandidate(cc, latestTag, preRelease);
  }
  async openPR(options: OpenPROptions) {
    this.gh = {
      openPR: async (opts: GitHubPR): Promise<number> => {
        this.openPROpts = opts;
        return 0;
      },
      getFileContents: async (_file: string): Promise<GitHubFileContents> => {
        return {sha: 'abc123', content: '{}', parsedContent: '{}'};
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
        github: new GitHub({owner: 'googleapis', repo: 'nodejs'}),
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
        owner: 'googleapis',
        repository: 'nodejs',
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
        github: new GitHub({owner: 'googleapis', repo: 'nodejs'}),
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
        owner: 'googleapis',
        repository: 'nodejs',
      });
      const candidate = await rp.coerceReleaseCandidate(cc);
      expect(candidate.version).to.equal('2.0.0');
    });

    it('it handles additional content after release-as: footer', async () => {
      const rp = new TestableReleasePR({
        github: new GitHub({owner: 'googleapis', repo: 'nodejs'}),
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
        owner: 'googleapis',
        repository: 'nodejs',
      });
      const candidate = await rp.coerceReleaseCandidate(cc);
      expect(candidate.version).to.equal('2.0.0');
    });

    describe('preRelease', () => {
      it('increments a prerelease appropriately', async () => {
        const rp = new TestableReleasePR({
          github: new GitHub({owner: 'googleapis', repo: 'nodejs'}),
        });
        const cc = new ConventionalCommits({
          commits: [],
          owner: 'googleapis',
          repository: 'nodejs',
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
          github: new GitHub({owner: 'googleapis', repo: 'nodejs'}),
        });
        const cc = new ConventionalCommits({
          commits: [],
          owner: 'googleapis',
          repository: 'nodejs',
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
        github: new GitHub({owner: 'googleapis', repo: 'nodejs'}),
        packageName: '@google-cloud/nodejs',
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

  describe('getPackageName', () => {
    const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
    for (const name of ['foo', '@foo/bar', '@foo-bar/baz']) {
      it(`base implementation: ${name}`, async () => {
        const releasePR = new ReleasePR({github, packageName: name});
        const packageName = await releasePR.getPackageName();
        expect(packageName.name).to.equal(name);
        expect(packageName.getComponent()).to.equal(name);
      });
    }
  });

  describe('latestTag', () => {
    let req: nock.Scope;
    let releasePR: ReleasePR;

    beforeEach(() => {
      req = nock('https://api.github.com/');
      releasePR = new ReleasePR({
        github: new GitHub({owner: 'fake', repo: 'fake'}),
      });

      sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('main');
    });

    it('handles monorepo composite branch names properly', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag-monorepo.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await releasePR.latestTag('complex-package_name-v1-');
      expect(latestTag!.version).to.equal('1.1.0');
      req.done();
    });

    it('does not return monorepo composite tag, if no prefix provided', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag-monorepo.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await releasePR.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('returns the latest tag on the main branch, based on PR date', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await releasePR.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('returns the latest tag on a sub branch, based on PR date', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'latest-tag-alternate-branch.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });

      // We need a special one here to set an alternate branch.
      releasePR = new ReleasePR({
        github: new GitHub({
          owner: 'fake',
          repo: 'fake',
          defaultBranch: 'legacy-8',
        }),
      });

      const latestTag = await releasePR.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('does not return pre-releases as latest tag', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });

      const latestTag = await releasePR.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('returns pre-releases on the main branch as latest, when preRelease is true', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await releasePR.latestTag(undefined, true);
      expect(latestTag!.version).to.equal('2.0.0-rc1');
      req.done();
    });

    it('returns pre-releases on a sub branch as latest, when preRelease is true', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'latest-tag-alternate-branch.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });

      // We need a special one here to set an alternate branch.
      releasePR = new ReleasePR({
        github: new GitHub({
          owner: 'fake',
          repo: 'fake',
          defaultBranch: 'prerelease',
        }),
      });

      const latestTag = await releasePR.latestTag(undefined, true);
      expect(latestTag!.version).to.equal('2.0.0-rc1');
      req.done();
    });

    it('ignores associatedPullRequests that do not match the commit sha', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'latest-tag-extra-pull-requests.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await releasePR.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });
  });

  it('returns early if outstanding release is found', async () => {
    const releasePR = new ReleasePR({
      github: new GitHub({
        owner: 'fake',
        repo: 'fake',
        defaultBranch: 'legacy-8',
      }),
    });
    const findMergedReleasePRStub = sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .resolves({
        sha: 'abc123',
        number: 33,
        baseRefName: 'main',
        headRefName: 'foo',
        labels: [],
        title: 'chore: release',
        body: 'release',
      });
    await releasePR.run();
    // It's important to assert that we only iterate over a reasonable
    // number of commits looking for outstanding release PRs, if this
    // step is allowed to run to completion it may timeout on large
    // repos with no open PRs:
    sandbox.assert.calledWith(
      findMergedReleasePRStub,
      sandbox.match(['autorelease: pending']),
      sandbox.match.any,
      sinon.match.truthy,
      sandbox.match(100)
    );
  });
});
