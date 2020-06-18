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
import {Node} from '../../src/releasers/node';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';

const fixturesPath = './test/releasers/fixtures/node';

interface MochaThis {
  [skip: string]: Function;
}

function mockRequest(snapName: string) {
  const packageContent = readFileSync(
    resolve(fixturesPath, 'package.json'),
    'utf8'
  );
  const graphql = JSON.parse(
    readFileSync(resolve(fixturesPath, 'commits.json'), 'utf8')
  );

  const req = nock('https://api.github.com')
    // check for default branch
    .get('/repos/googleapis/node-test-repo')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .reply(200, require('../../../test/fixtures/repo-get-1.json'))
    .get('/repos/googleapis/node-test-repo/pulls?state=closed&per_page=100')
    .reply(200, undefined)
    .get('/repos/googleapis/node-test-repo/contents/package.json')
    .reply(200, {
      content: Buffer.from(packageContent, 'utf8').toString('base64'),
      sha: 'abc123',
    })
    // fetch semver tags, this will be used to determine
    // the delta since the last release.
    .get('/repos/googleapis/node-test-repo/tags?per_page=100')
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
    .get('/repos/googleapis/node-test-repo/git/refs?per_page=100')
    .reply(200, [{ref: 'refs/tags/v0.123.4'}])
    // creating a new branch
    .post('/repos/googleapis/node-test-repo/git/refs')
    .reply(200)
    // check for CHANGELOG
    .get(
      '/repos/googleapis/node-test-repo/contents/CHANGELOG.md?ref=refs%2Fheads%2Frelease-v0.123.5'
    )
    .reply(404)
    .put(
      '/repos/googleapis/node-test-repo/contents/CHANGELOG.md',
      (req: {[key: string]: string}) => {
        snapshot(`CHANGELOG-node-message-${snapName}`, req.message);
        snapshot(
          `CHANGELOG-node-${snapName}`,
          Buffer.from(req.content, 'base64')
            .toString('utf8')
            .replace(/\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g, '')
        );
        return true;
      }
    )
    .reply(201)
    // update package.json
    .get(
      '/repos/googleapis/node-test-repo/contents/package.json?ref=refs%2Fheads%2Frelease-v0.123.5'
    )
    .reply(200, {
      content: Buffer.from(packageContent, 'utf8').toString('base64'),
      sha: 'abc123',
    })
    .put(
      '/repos/googleapis/node-test-repo/contents/package.json',
      (req: {[key: string]: string}) => {
        snapshot(`package-json-node-message-${snapName}`, req.message);
        snapshot(
          `package-json-node-${snapName}`,
          Buffer.from(req.content, 'base64').toString('utf8')
        );
        return true;
      }
    )
    .reply(200)
    .get(
      '/repos/googleapis/node-test-repo/contents/samples/package.json?ref=refs%2Fheads%2Frelease-v0.123.5'
    )
    .reply(404)
    // create release
    .post(
      '/repos/googleapis/node-test-repo/pulls',
      (req: {[key: string]: string}) => {
        const body = req.body.replace(/\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g, '');
        snapshot(`PR body-node-${snapName}`, body);
        return true;
      }
    )
    .reply(200, {number: 1})
    .post(
      '/repos/googleapis/node-test-repo/issues/1/labels',
      (req: {[key: string]: string}) => {
        snapshot(`labels-node-${snapName}`, req);
        return true;
      }
    )
    .reply(200, {})
    // this step tries to close any existing PRs; just return an empty list.
    .get('/repos/googleapis/node-test-repo/pulls?state=open&per_page=100')
    .reply(200, []);

  return req;
}

describe('Node', () => {
  describe('run', () => {
    it('creates a release PR without package-lock.json', async () => {
      const req = mockRequest('no-package-lock')
        .get(
          '/repos/googleapis/node-test-repo/contents/package-lock.json?ref=refs%2Fheads%2Frelease-v0.123.5'
        )
        .reply(404);

      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
    });
    it('creates a release PR with package-lock.json', async () => {
      const packageLockContent = readFileSync(
        resolve(fixturesPath, 'package-lock.json'),
        'utf8'
      );
      const req = mockRequest('with-package-lock')
        .get(
          '/repos/googleapis/node-test-repo/contents/package-lock.json?ref=refs%2Fheads%2Frelease-v0.123.5'
        )
        .reply(200, {
          content: Buffer.from(packageLockContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .put(
          '/repos/googleapis/node-test-repo/contents/package-lock.json',
          (req: {[key: string]: string}) => {
            snapshot('package-lock-json-node-message', req.message);
            snapshot(
              'papckage-lock-json-node-with',
              Buffer.from(req.content, 'base64').toString('utf8')
            );
            return true;
          }
        )
        .reply(201);

      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
    });
  });
});
