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

import * as nock from 'nock';
import {expect} from 'chai';
import {describe, it} from 'mocha';
import {Octokit} from '@octokit/rest';
import {resolve} from 'path';
import {BranchFileCache} from '../../src/util/file-cache';
import * as assert from 'assert';
import {FileNotFoundError} from '../../src/errors';

nock.disableNetConnect();

const octokit = new Octokit({
  auth: 'sometoken',
});
const fixturesPath = './test/fixtures';

describe('BranchFileCache', () => {
  let cache: BranchFileCache;
  beforeEach(() => {
    cache = new BranchFileCache(
      octokit,
      {owner: 'testOwner', repo: 'testRepo', defaultBranch: 'main'},
      'feature-branch'
    );
  });
  describe('with small repository', () => {
    it('fetches a file', async () => {
      const req = nock('https://api.github.com')
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=true'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-recursive'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/blobs/3c3629e647f5ddf82548912e337bea9826b434af'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-blobs-successful-response'
          ))
        );
      const contents = await cache.getFileContents('pkg/a/foo.json');
      expect(contents.mode).to.eql('100644');
      expect(contents.sha).to.eql('3c3629e647f5ddf82548912e337bea9826b434af');
      req.done();
    });

    it('caches a file', async () => {
      const req = nock('https://api.github.com')
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=true'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-recursive'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/blobs/3c3629e647f5ddf82548912e337bea9826b434af'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-blobs-successful-response'
          ))
        );
      const contents = await cache.getFileContents('pkg/a/foo.json');
      expect(contents.mode).to.eql('100644');
      expect(contents.sha).to.eql('3c3629e647f5ddf82548912e337bea9826b434af');
      const contents2 = await cache.getFileContents('pkg/a/foo.json');
      expect(contents2.mode).to.eql('100644');
      expect(contents2.sha).to.eql('3c3629e647f5ddf82548912e337bea9826b434af');
      req.done();
    });

    it('throws on missing file', async () => {
      const req = nock('https://api.github.com')
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=true'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-recursive'
          ))
        );
      await assert.rejects(async () => {
        await cache.getFileContents('missing-file');
      }, FileNotFoundError);
      req.done();
    });
  });

  describe('with large repository', () => {
    it('fetches a file', async () => {
      const req = nock('https://api.github.com')
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=true'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-truncated'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=false'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/trees/cc64165cf5da91810ab7edc1143a47be42513c0a?recursive=false'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-subdir-pkg'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/trees/1143a47be42513c0acc64165cf5da91810ab7edc?recursive=false'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-subdir-pkg-a'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/trees/0acc64165cf5da91810ab7edc1143a47be42513c?recursive=false'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-subdir-pkg-b'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/blobs/2f3d2c47bf49f81aca0df9ffc49524a213a2dc33'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-blobs-successful-response'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/blobs/47bf49f81aca0df9ffc49524a213a2dc332f3d2c'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-blobs-successful-response'
          ))
        );

      const contents = await cache.getFileContents('pkg/a/foo.json');
      expect(contents.mode).to.eql('100644');
      expect(contents.sha).to.eql('2f3d2c47bf49f81aca0df9ffc49524a213a2dc33');
      const contents2 = await cache.getFileContents('pkg/b/foo.json');
      expect(contents2.mode).to.eql('100644');
      expect(contents2.sha).to.eql('47bf49f81aca0df9ffc49524a213a2dc332f3d2c');
      req.done();
    });

    it('caches a file', async () => {
      const req = nock('https://api.github.com')
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=true'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-truncated'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=false'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/trees/cc64165cf5da91810ab7edc1143a47be42513c0a?recursive=false'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-subdir-pkg'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/trees/1143a47be42513c0acc64165cf5da91810ab7edc?recursive=false'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-subdir-pkg-a'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/blobs/2f3d2c47bf49f81aca0df9ffc49524a213a2dc33'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-blobs-successful-response'
          ))
        );

      const contents = await cache.getFileContents('pkg/a/foo.json');
      expect(contents.mode).to.eql('100644');
      expect(contents.sha).to.eql('2f3d2c47bf49f81aca0df9ffc49524a213a2dc33');
      const contents2 = await cache.getFileContents('pkg/a/foo.json');
      expect(contents2.mode).to.eql('100644');
      expect(contents2.sha).to.eql('2f3d2c47bf49f81aca0df9ffc49524a213a2dc33');
      req.done();
    });

    it('throws on missing file', async () => {
      const req = nock('https://api.github.com')
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=true'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-truncated'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=false'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response'
          ))
        );
      await assert.rejects(async () => {
        await cache.getFileContents('missing-file');
      }, FileNotFoundError);
      req.done();
    });

    it('throws on missing directory', async () => {
      const req = nock('https://api.github.com')
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=true'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response-truncated'
          ))
        )
        .get(
          '/repos/testOwner/testRepo/git/trees/feature-branch?recursive=false'
        )
        .reply(
          200,
          require(resolve(
            fixturesPath,
            'github-data-api/data-api-trees-successful-response'
          ))
        );
      await assert.rejects(async () => {
        await cache.getFileContents('missing-dir/foo.json');
      }, FileNotFoundError);
      req.done();
    });
  });
});

describe('RepositoryFileCache', () => {
  it('fetches a file', async () => {});

  it('caches same file on different branches separately', async () => {});
});
