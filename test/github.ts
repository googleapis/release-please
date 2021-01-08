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

import * as nock from 'nock';
import {expect} from 'chai';
import {beforeEach, describe, it} from 'mocha';
nock.disableNetConnect();

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';

import {GitHub} from '../src/github';

const fixturesPath = './test/fixtures';

describe('GitHub', () => {
  let github: GitHub;
  let req: nock.Scope;

  function getNock() {
    return nock('https://api.github.com/')
      .get('/repos/fake/fake')
      .optionally()
      .reply(200, {
        default_branch: 'main',
      });
  }

  beforeEach(() => {
    // Reset this before each test so we get a consistent
    // set of requests (some things are cached).
    github = new GitHub({owner: 'fake', repo: 'fake'});

    // This shared nock will take care of some common requests.
    req = getNock();
  });

  describe('commitsSinceSha', () => {
    it('returns commits immediately before sha', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const commitsSinceSha = await github.commitsSinceSha(
        'cf52ec0bcdc777dc9c5e76153d7d253bea95d44b'
      );
      snapshot(commitsSinceSha);
      req.done();
    });
  });

  describe('findFilesByfilename', () => {
    it('returns files matching the requested pattern', async () => {
      const fileSearchResponse = JSON.parse(
        readFileSync(resolve(fixturesPath, 'pom-file-search.json'), 'utf8')
      );
      req
        .get('/search/code?q=filename%3Apom.xml+repo%3Afake%2Ffake')
        .reply(200, fileSearchResponse);
      const pomFiles = await github.findFilesByFilename('pom.xml');
      snapshot(pomFiles);
      req.done();
    });

    const prefixes = [
      'appengine',
      'appengine/',
      '/appengine',
      '/appengine/',
      'appengine\\',
      '\\appengine',
      '\\appengine\\',
    ];
    prefixes.forEach(prefix => {
      it(`scopes pattern matching files to prefix(${prefix})`, async () => {
        const fileSearchResponse = JSON.parse(
          readFileSync(
            resolve(fixturesPath, 'pom-file-search-with-prefix.json'),
            'utf8'
          )
        );
        req
          .get(
            '/search/code?q=filename%3Apom.xml+repo%3Afake%2Ffake+path%3Aappengine'
          )
          .reply(200, fileSearchResponse);
        const pomFiles = await github.findFilesByFilename('pom.xml', prefix);
        req.done();
        expect(pomFiles).to.deep.equal(['pom.xml', 'foo/pom.xml']);
      });
    });
  });

  describe('findOpenReleasePRs', () => {
    it('returns PRs that have all release labels', async () => {
      req.get('/repos/fake/fake/pulls?state=open&per_page=100').reply(200, [
        {
          number: 99,
          labels: [{name: 'autorelease: pending'}, {name: 'process'}],
          base: {
            label: 'fake:main',
          },
        },
        {
          number: 100,
          labels: [{name: 'autorelease: pending'}],
          base: {
            label: 'fake:main',
          },
        },
      ]);
      const prs = await github.findOpenReleasePRs([
        'autorelease: pending',
        'process',
      ]);
      const numbers = prs.map(pr => pr.number);
      expect(numbers).to.include(99);
      expect(numbers).to.not.include(100);
      req.done();
    });

    it('returns PRs when only one release label is configured', async () => {
      req.get('/repos/fake/fake/pulls?state=open&per_page=100').reply(200, [
        {
          number: 99,
          labels: [{name: 'autorelease: pending'}, {name: 'process'}],
          base: {
            label: 'fake:main',
          },
        },
        {
          number: 100,
          labels: [{name: 'autorelease: pending'}],
          base: {
            label: 'fake:main',
          },
        },
      ]);
      const prs = await github.findOpenReleasePRs(['autorelease: pending']);
      const numbers = prs.map(pr => pr.number);
      expect(numbers).to.include(99);
      expect(numbers).to.include(100);
      req.done();
    });

    // Todo - not finding things from other branches
  });

  describe('latestTag', () => {
    const samplePrReturn = [
      {
        base: {
          label: 'fake:prerelease',
        },
        head: {
          label: 'fake:release-v3.0.0-rc1',
        },
        merged_at: new Date().toISOString(),
      },
      {
        base: {
          label: 'fake:main',
        },
        head: {
          label: 'fake:release-v2.0.0-rc1',
        },
        merged_at: new Date().toISOString(),
      },
      {
        base: {
          label: 'fake:legacy-8',
        },
        head: {
          label: 'fake:release-v1.1.5',
        },
        merged_at: new Date().toISOString(),
      },
      {
        base: {
          label: 'fake:main',
        },
        head: {
          label: 'fake:release-v1.3.0',
        },
        merged_at: new Date().toISOString(),
      },
      {
        base: {
          label: 'fake:main',
        },
        head: {
          label: 'fake:release-v1.2.0',
        },
        merged_at: new Date().toISOString(),
      },
      {
        base: {
          label: 'fake:main',
        },
        head: {
          label: 'fake:release-v1.1.0',
        },
        merged_at: new Date().toISOString(),
      },
    ];

    it('handles monorepo composite branch names properly', async () => {
      const sampleResults = [
        {
          base: {
            label: 'fake:main',
          },
          head: {
            label: 'fake:release-complex-package_name-v1-v1.1.0',
          },
          merged_at: new Date().toISOString(),
        },
        {
          base: {
            label: 'fake:main',
          },
          head: {
            label: 'fake:release-complex-package_name-v2.1-v2.0.0-beta',
          },
          merged_at: new Date().toISOString(),
        },
      ];
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, sampleResults);
      const latestTag = await github.latestTag('complex-package_name-v1-');
      expect(latestTag!.version).to.equal('1.1.0');
      req.done();
    });

    it('does not return monorepo composite tag, if no prefix provided', async () => {
      const sampleResults = [
        {
          base: {
            label: 'fake:main',
          },
          head: {
            label: 'fake:release-complex-package_name-v1-v1.1.0',
          },
          merged_at: new Date().toISOString(),
        },
        {
          base: {
            label: 'fake:main',
          },
          head: {
            label: 'fake:release-complex-package_name-v2.1-v2.0.0-beta',
          },
          merged_at: new Date().toISOString(),
        },
        {
          base: {
            label: 'fake:main',
          },
          head: {
            label: 'fake:release-v1.3.0',
          },
          merged_at: new Date().toISOString(),
        },
      ];
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, sampleResults);
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('returns the latest tag on the main branch, based on PR date', async () => {
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, samplePrReturn);
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('returns the latest tag on a sub branch, based on PR date', async () => {
      // We need a special one here to set an alternate branch.
      github = new GitHub({
        owner: 'fake',
        repo: 'fake',
        defaultBranch: 'legacy-8',
      });

      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, samplePrReturn);
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.1.5');
      req.done();
    });

    it('does not return pre-releases as latest tag', async () => {
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, samplePrReturn);
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('returns pre-releases on the main branch as latest, when preRelease is true', async () => {
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, samplePrReturn);
      const latestTag = await github.latestTag(undefined, true);
      expect(latestTag!.version).to.equal('2.0.0-rc1');
      req.done();
    });

    it('returns pre-releases on a sub branch as latest, when preRelease is true', async () => {
      // We need a special one here to set an alternate branch.
      github = new GitHub({
        owner: 'fake',
        repo: 'fake',
        defaultBranch: 'prerelease',
      });

      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, samplePrReturn);
      const latestTag = await github.latestTag(undefined, true);
      expect(latestTag!.version).to.equal('3.0.0-rc1');
      req.done();
    });
    it('falls back to using tags, for simple case', async () => {
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, [])
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.0.0',
            commit: {sha: 'abc123'},
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'deadbeef'},
          },
        ]);
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.1.0');
      req.done();
    });
    it('falls back to using tags, when prefix is provided', async () => {
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, [])
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.0.0',
            commit: {sha: 'abc123'},
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'deadbeef'},
          },
          {
            name: 'foo-v1.9.0',
            commit: {sha: 'deadbeef'},
          },
          {
            name: 'v1.2.0',
            commit: {sha: 'deadbeef'},
          },
        ]);
      const latestTag = await github.latestTag('foo-');
      expect(latestTag!.version).to.equal('1.9.0');
      req.done();
    });
    it('allows for "@" rather than "-" when fallback used', async () => {
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, [])
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.0.0',
            commit: {sha: 'abc123'},
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'deadbeef'},
          },
          {
            name: 'foo@v1.9.0',
            commit: {sha: 'dead'},
          },
          {
            name: 'v1.2.0',
            commit: {sha: 'beef'},
          },
          {
            name: 'foo@v2.1.0',
            commit: {sha: '123abc'},
          },
        ]);
      const latestTag = await github.latestTag('foo-');
      expect(latestTag!.version).to.equal('2.1.0');
      req.done();
    });
    it('allows for "/" rather than "-" when fallback used', async () => {
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, [])
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.0.0',
            commit: {sha: 'abc123'},
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'deadbeef'},
          },
          {
            name: 'foo/v2.3.0',
            commit: {sha: 'dead'},
          },
          {
            name: 'v1.2.0',
            commit: {sha: 'beef'},
          },
          {
            name: 'foo/v2.1.0',
            commit: {sha: '123abc'},
          },
        ]);
      const latestTag = await github.latestTag('foo-');
      expect(latestTag!.version).to.equal('2.3.0');
      req.done();
    });
  });

  describe('getFileContents', () => {
    it('should support Github Data API in case of a big file', async () => {
      const simpleAPIResponse = JSON.parse(
        readFileSync(
          resolve(
            fixturesPath,
            'github-data-api',
            '403-too-large-file-response.json'
          ),
          'utf8'
        )
      );
      const dataAPITreesResponse = JSON.parse(
        readFileSync(
          resolve(
            fixturesPath,
            'github-data-api',
            'data-api-trees-successful-response.json'
          ),
          'utf8'
        )
      );
      const dataAPIBlobResponse = JSON.parse(
        readFileSync(
          resolve(
            fixturesPath,
            'github-data-api',
            'data-api-blobs-successful-response.json'
          ),
          'utf8'
        )
      );
      const req1 = nock('https://api.github.com/')
        .get(
          '/repos/fake/fake/contents/package-lock.json?ref=refs%2Fheads%2Fmain'
        )
        .reply(403, simpleAPIResponse);
      const req2 = nock('https://api.github.com/')
        .get('/repos/fake/fake/git/trees/main')
        .reply(200, dataAPITreesResponse);
      const req3 = nock('https://api.github.com/')
        .get(
          '/repos/fake/fake/git/blobs/2f3d2c47bf49f81aca0df9ffc49524a213a2dc33'
        )
        .reply(200, dataAPIBlobResponse);

      const fileContents = await github.getFileContents('package-lock.json');
      expect(fileContents).to.have.property('content');
      expect(fileContents).to.have.property('parsedContent');
      expect(fileContents)
        .to.have.property('sha')
        .equal('2f3d2c47bf49f81aca0df9ffc49524a213a2dc33');
      snapshot(fileContents);
      req1.done();
      req2.done();
      req3.done();
    });
  });
});
