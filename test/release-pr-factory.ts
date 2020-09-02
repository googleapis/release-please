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

import {describe, it, afterEach} from 'mocha';
import * as assert from 'assert';
import * as nock from 'nock';
import {ReleasePRFactory} from '../src/release-pr-factory';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';

import * as suggester from 'code-suggester';
import * as sinon from 'sinon';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/simple';

describe('ReleasePRFactory', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('build', () => {
    it('returns instance of dynamically loaded releaser', async () => {
      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
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
        // Check if a release PR already exists
        .get('/repos/googleapis/simple-test-repo/pulls?state=open&per_page=100')
        .reply(200, [])
        // check for CHANGELOG
        .get(
          '/repos/googleapis/simple-test-repo/contents/CHANGELOG.md?ref=refs%2Fheads%2Fmain'
        )
        .reply(404)
        // Update the version.txt file:
        .get(
          '/repos/googleapis/simple-test-repo/contents/version.txt?ref=refs%2Fheads%2Fmain'
        )
        .reply(200, {
          content: Buffer.from(versionContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // check for default branch
        .get('/repos/googleapis/simple-test-repo')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../test/fixtures/repo-get-2.json'))
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/simple-test-repo/pulls?state=open&per_page=100')
        .reply(200, [])
        .post(
          '/repos/googleapis/simple-test-repo/issues/22/labels',
          (req: {[key: string]: string}) => {
            assert.strictEqual(req.labels[0], 'autorelease: pending');
            return true;
          }
        )
        .reply(200);
      const releasePR = ReleasePRFactory.build('simple', {
        repoUrl: 'googleapis/simple-test-repo',
        // not actually used by this type of repo.
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
      snapshot(JSON.stringify(expectedChanges, null, 2));
    });
  });

  describe('buildStatic', () => {
    it('returns an instance of a statically loaded releaser', async () => {
      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
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
        // Check if a release PR already exists
        .get('/repos/googleapis/simple-test-repo/pulls?state=open&per_page=100')
        .reply(200, [])
        // check for CHANGELOG
        .get(
          '/repos/googleapis/simple-test-repo/contents/CHANGELOG.md?ref=refs%2Fheads%2Fmain'
        )
        .reply(404)
        // Update the version.txt file:
        .get(
          '/repos/googleapis/simple-test-repo/contents/version.txt?ref=refs%2Fheads%2Fmain'
        )
        .reply(200, {
          content: Buffer.from(versionContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // check for default branch
        .get('/repos/googleapis/simple-test-repo')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../test/fixtures/repo-get-2.json'))
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/simple-test-repo/pulls?state=open&per_page=100')
        .reply(200, [])
        .post(
          '/repos/googleapis/simple-test-repo/issues/22/labels',
          (req: {[key: string]: string}) => {
            assert.strictEqual(req.labels[0], 'autorelease: pending');
            return true;
          }
        )
        .reply(200);
      const releasePR = ReleasePRFactory.buildStatic('simple', {
        repoUrl: 'googleapis/simple-test-repo',
        // not actually used by this type of repo.
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
      snapshot(JSON.stringify(expectedChanges, null, 2));
    });
  });
});
