// Copyright 2020 Google LLC
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

import {describe, it} from 'mocha';
import * as nock from 'nock';
import {ReleasePRFactory} from '../src/release-pr-factory';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';

const fixturesPath = './test/releasers/fixtures/simple';

interface MochaThis {
  [skip: string]: Function;
}

describe('ReleasePRFactory', () => {
  describe('build', () => {
    it('returns instance of dynamically loaded releaser', async () => {
      const versionContent = readFileSync(
        resolve(fixturesPath, 'version.txt'),
        'utf8'
      );
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits.json'), 'utf8')
      );
      const req = nock('https://api.github.com')
        .get(
          '/repos/googleapis/simple-test-repo/pulls?state=closed&per_page=100'
        )
        .reply(200, undefined)
        .get('/repos/googleapis/simple-test-repo/contents/version.txt')
        .reply(200, {
          content: Buffer.from(versionContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get('/repos/googleapis/simple-test-repo/tags?per_page=100')
        .reply(200, [
          {
            name: 'v0.123.4',
            commit: {
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
          },
        ])
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // getting the latest tag
        .get('/repos/googleapis/simple-test-repo/git/refs?per_page=100')
        .reply(200, [{ref: 'refs/tags/v0.123.4'}])
        // creating a new branch
        .post('/repos/googleapis/simple-test-repo/git/refs')
        .reply(200)
        // check for CHANGELOG
        .get(
          '/repos/googleapis/simple-test-repo/contents/CHANGELOG.md?ref=refs%2Fheads%2Frelease-v0.123.5'
        )
        .reply(404)
        .put(
          '/repos/googleapis/simple-test-repo/contents/CHANGELOG.md',
          (req: {[key: string]: string}) => {
            snapshot(
              Buffer.from(req.content, 'base64')
                .toString('utf8')
                .replace(/\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g, '')
            );
            return true;
          }
        )
        .reply(201)
        // update version.txt
        .get(
          '/repos/googleapis/simple-test-repo/contents/version.txt?ref=refs%2Fheads%2Frelease-v0.123.5'
        )
        .reply(200, {
          content: Buffer.from(versionContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .put(
          '/repos/googleapis/simple-test-repo/contents/version.txt',
          (req: {[key: string]: string}) => {
            snapshot(Buffer.from(req.content, 'base64').toString('utf8'));
            return true;
          }
        )
        .reply(200)
        // create release
        .post(
          '/repos/googleapis/simple-test-repo/pulls',
          (req: {[key: string]: string}) => {
            const body = req.body.replace(
              /\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g,
              ''
            );
            snapshot(body);
            return true;
          }
        )
        .reply(200, {number: 1})
        .post(
          '/repos/googleapis/simple-test-repo/issues/1/labels',
          (req: {[key: string]: string}) => {
            snapshot(req);
            return true;
          }
        )
        .reply(200, {})
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/simple-test-repo/pulls?state=open&per_page=100')
        .reply(200, []);
      const releasePR = ReleasePRFactory.build('simple', {
        repoUrl: 'googleapis/simple-test-repo',
        // not actually used by this type of repo.
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
    });
  });

  describe('buildStatic', () => {
    it('returns an instance of a statically loaded releaser', async () => {
      const versionContent = readFileSync(
        resolve(fixturesPath, 'version.txt'),
        'utf8'
      );
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits.json'), 'utf8')
      );
      const req = nock('https://api.github.com')
        .get(
          '/repos/googleapis/simple-test-repo/pulls?state=closed&per_page=100'
        )
        .reply(200, undefined)
        .get('/repos/googleapis/simple-test-repo/contents/version.txt')
        .reply(200, {
          content: Buffer.from(versionContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get('/repos/googleapis/simple-test-repo/tags?per_page=100')
        .reply(200, [
          {
            name: 'v0.123.4',
            commit: {
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
          },
        ])
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // getting the latest tag
        .get('/repos/googleapis/simple-test-repo/git/refs?per_page=100')
        .reply(200, [{ref: 'refs/tags/v0.123.4'}])
        // creating a new branch
        .post('/repos/googleapis/simple-test-repo/git/refs')
        .reply(200)
        // check for CHANGELOG
        .get(
          '/repos/googleapis/simple-test-repo/contents/CHANGELOG.md?ref=refs%2Fheads%2Frelease-v0.123.5'
        )
        .reply(404)
        .put(
          '/repos/googleapis/simple-test-repo/contents/CHANGELOG.md',
          (req: {[key: string]: string}) => {
            snapshot(
              Buffer.from(req.content, 'base64')
                .toString('utf8')
                .replace(/\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g, '')
            );
            return true;
          }
        )
        .reply(201)
        // update version.txt
        .get(
          '/repos/googleapis/simple-test-repo/contents/version.txt?ref=refs%2Fheads%2Frelease-v0.123.5'
        )
        .reply(200, {
          content: Buffer.from(versionContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .put(
          '/repos/googleapis/simple-test-repo/contents/version.txt',
          (req: {[key: string]: string}) => {
            snapshot(Buffer.from(req.content, 'base64').toString('utf8'));
            return true;
          }
        )
        .reply(200)
        // create release
        .post(
          '/repos/googleapis/simple-test-repo/pulls',
          (req: {[key: string]: string}) => {
            const body = req.body.replace(
              /\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g,
              ''
            );
            snapshot(body);
            return true;
          }
        )
        .reply(200, {number: 1})
        .post(
          '/repos/googleapis/simple-test-repo/issues/1/labels',
          (req: {[key: string]: string}) => {
            snapshot(req);
            return true;
          }
        )
        .reply(200, {})
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/simple-test-repo/pulls?state=open&per_page=100')
        .reply(200, []);
      const releasePR = ReleasePRFactory.buildStatic('simple', {
        repoUrl: 'googleapis/simple-test-repo',
        // not actually used by this type of repo.
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
    });
  });
});
