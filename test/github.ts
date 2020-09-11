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
import {describe, it} from 'mocha';
nock.disableNetConnect();

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';

import {GitHub} from '../src/github';
const github = new GitHub({owner: 'fake', repo: 'fake'});

const fixturesPath = './test/fixtures';

describe('GitHub', () => {
  describe('commitsSinceSha', () => {
    it('returns commits immediately before sha', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
          'utf8'
        )
      );
      const req = nock('https://api.github.com').post('/graphql').reply(200, {
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
      const req = nock('https://api.github.com')
        .get('/search/code?q=filename%3Apom.xml+repo%3Afake%2Ffake')
        .reply(200, fileSearchResponse);
      const pomFiles = await github.findFilesByFilename('pom.xml');
      snapshot(pomFiles);
      req.done();
    });
  });

  describe('findOpenReleasePRs', () => {
    it('returns PRs that have all release labels', async () => {
      const req = nock('https://api.github.com')
        .get('/repos/fake/fake/pulls?state=open&per_page=100')
        .reply(200, [
          {
            number: 99,
            labels: [{name: 'autorelease: pending'}, {name: 'process'}],
          },
          {
            number: 100,
            labels: [{name: 'autorelease: pending'}],
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
      const req = nock('https://api.github.com')
        .get('/repos/fake/fake/pulls?state=open&per_page=100')
        .reply(200, [
          {
            number: 99,
            labels: [{name: 'autorelease: pending'}, {name: 'process'}],
          },
          {
            number: 100,
            labels: [{name: 'autorelease: pending'}],
          },
        ]);
      const prs = await github.findOpenReleasePRs(['autorelease: pending']);
      const numbers = prs.map(pr => pr.number);
      expect(numbers).to.include(99);
      expect(numbers).to.include(100);
      req.done();
    });
  });

  describe('latestTag', () => {
    it('returns the largest tag, even if sorting is off', async () => {
      const req = nock('https://api.github.com')
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.2.0',
            commit: {sha: 'abc123'},
            version: 'v1.2.0',
          },
          {
            name: 'v1.3.0',
            commit: {sha: 'abc123'},
            version: 'v1.3.0',
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'abc123'},
            version: 'v1.1.0',
          },
        ]);
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('does not return pre-releases as latest tag', async () => {
      const req = nock('https://api.github.com')
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.2.0',
            commit: {sha: 'abc123'},
            version: 'v1.2.0',
          },
          {
            name: 'v1.3.0-beta.0',
            commit: {sha: 'abc123'},
            version: 'v1.3.0',
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'abc123'},
            version: 'v1.1.0',
          },
        ]);
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.2.0');
      req.done();
    });

    it('returns pre-releases as latest, when preRelease is true', async () => {
      const req = nock('https://api.github.com')
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.2.0',
            commit: {sha: 'abc123'},
            version: 'v1.2.0',
          },
          {
            name: 'v1.3.0-beta.0',
            commit: {sha: 'abc123'},
            version: 'v1.3.0',
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'abc123'},
            version: 'v1.1.0',
          },
          {
            name: 'v1.4.0-beta10',
            commit: {sha: 'abc123'},
            version: 'v1.3.0',
          },
          {
            name: 'v1.4.0-beta2',
            commit: {sha: 'abc123'},
            version: 'v1.3.0',
          },
          {
            name: 'v1.4.0-beta0',
            commit: {sha: 'abc123'},
            version: 'v1.3.0',
          },
          {
            name: 'v1.3.0',
            commit: {sha: 'abc123'},
            version: 'v1.1.0',
          },
        ]);
      const latestTag = await github.latestTag(undefined, true);
      expect(latestTag!.version).to.equal('1.4.0-beta10');
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
      const req1 = nock('https://api.github.com')
        .get(
          '/repos/fake/fake/contents/package-lock.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(403, simpleAPIResponse);
      const req2 = nock('https://api.github.com')
        .get('/repos/fake/fake/git/trees/master')
        .reply(200, dataAPITreesResponse);
      const req3 = nock('https://api.github.com')
        .get(
          '/repos/fake/fake/git/blobs/2f3d2c47bf49f81aca0df9ffc49524a213a2dc33'
        )
        .reply(200, dataAPIBlobResponse);

      const fileContents = await github.getFileContents(
        'package-lock.json',
        'master'
      );
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
