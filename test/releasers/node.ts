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

import * as assert from 'assert';
import {describe, it, afterEach} from 'mocha';
import {expect} from 'chai';
import * as nock from 'nock';
import {GitHub} from '../../src/github';
import {Node} from '../../src/releasers/node';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/node';

function mockRequest(snapName: string, requestPrefix = '') {
  const packageContent = readFileSync(
    resolve(fixturesPath, 'package.json'),
    'utf8'
  );
  const graphql = JSON.parse(
    readFileSync(resolve(fixturesPath, 'commits.json'), 'utf8')
  );
  const req = nock('https://api.github.com')
    // This step checks for an existing open release PR:
    .get('/repos/googleapis/node-test-repo/pulls?state=open&per_page=100')
    .reply(200, [])
    // check for default branch
    .get('/repos/googleapis/node-test-repo')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .reply(200, require('../../../test/fixtures/repo-get-1.json'))
    .get(
      '/repos/googleapis/node-test-repo/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
    )
    .reply(200, undefined)
    .get(
      `/repos/googleapis/node-test-repo/contents/${requestPrefix}package.json?ref=refs/heads/master`
    )
    .reply(200, {
      content: Buffer.from(packageContent, 'utf8').toString('base64'),
      sha: 'abc123',
    })
    // fetch semver tags, this will be used to determine
    // the delta since the last release.
    .get(
      '/repos/googleapis/node-test-repo/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
    )
    .reply(200, [
      {
        base: {
          label: 'googleapis:master',
        },
        head: {
          label: 'googleapis:release-v0.123.4',
          sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
        },
        merged_at: new Date().toISOString(),
        labels: [],
      },
    ])
    .post('/graphql', (body: object) => {
      snapshot(`graphql-body-${snapName}`, body);
      return true;
    })
    .reply(200, {
      data: graphql,
    })
    // check for CHANGELOG
    .get(
      `/repos/googleapis/node-test-repo/contents/${requestPrefix}CHANGELOG.md?ref=refs%2Fheads%2Fmaster`
    )
    .reply(404)
    // update package.json
    .get(
      `/repos/googleapis/node-test-repo/contents/${requestPrefix}package.json?ref=refs%2Fheads%2Fmaster`
    )
    .reply(200, {
      content: Buffer.from(packageContent, 'utf8').toString('base64'),
      sha: 'abc123',
    })
    .get(
      `/repos/googleapis/node-test-repo/contents/${requestPrefix}samples%2Fpackage.json?ref=refs%2Fheads%2Fmaster`
    )
    .reply(404)
    .post(
      '/repos/googleapis/node-test-repo/issues/22/labels',
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
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('creates a release PR without package-lock.json', async () => {
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
      const req = mockRequest('')
        .get(
          '/repos/googleapis/node-test-repo/contents/package-lock.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404);
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-testno-package-lock-repo',
        apiUrl: 'https://api.github.com',
      });
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      req.done();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('creates a release PR with package-lock.json', async () => {
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
      const packageLockContent = readFileSync(
        resolve(fixturesPath, 'package-lock.json'),
        'utf8'
      );
      const req = mockRequest('with-package-lock')
        .get(
          '/repos/googleapis/node-test-repo/contents/package-lock.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from(packageLockContent, 'utf8').toString('base64'),
          sha: 'abc123',
        });

      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('creates release PR relative to a path', async () => {
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      const req = mockRequest('with-path', 'packages%2Ffoo%2F')
        .get(
          '/repos/googleapis/node-test-repo/contents/packages%2Ffoo%2Fpackage-lock.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404);

      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
        path: 'packages/foo',
      });
      await releasePR.run();
      req.done();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('does not support snapshot releases', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
        snapshot: true,
      });
      const pr = await releasePR.run();
      assert.strictEqual(pr, undefined);
    });
  });

  describe('lookupPackageName', () => {
    it('finds package name in package.json', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const packageContent = readFileSync(
        resolve(fixturesPath, 'package.json'),
        'utf8'
      );
      const req = nock('https://api.github.com')
        .get('/repos/googleapis/node-test-repo')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../../test/fixtures/repo-get-1.json'))
        .get(
          '/repos/googleapis/node-test-repo/contents/package.json?ref=refs/heads/master'
        )
        .reply(200, {
          content: Buffer.from(packageContent, 'utf8').toString('base64'),
          sha: 'abc123',
        });
      const expectedPackageName = await Node.lookupPackageName(github);
      expect(expectedPackageName).to.equal('node-test-repo');
      req.done();
    });

    it('finds package name in submodule package.json', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const packageContent = readFileSync(
        resolve(fixturesPath, 'package.json'),
        'utf8'
      );
      const req = nock('https://api.github.com')
        .get('/repos/googleapis/node-test-repo')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../../test/fixtures/repo-get-1.json'))
        .get(
          '/repos/googleapis/node-test-repo/contents/some-path%2Fpackage.json?ref=refs/heads/master'
        )
        .reply(200, {
          content: Buffer.from(packageContent, 'utf8').toString('base64'),
          sha: 'abc123',
        });
      const expectedPackageName = await Node.lookupPackageName(
        github,
        'some-path'
      );
      expect(expectedPackageName).to.equal('node-test-repo');
      req.done();
    });
  });
});
