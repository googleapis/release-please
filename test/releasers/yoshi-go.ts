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
import {describe, it, before, afterEach} from 'mocha';
import * as nock from 'nock';
import {GoYoshi} from '../../src/releasers/go-yoshi';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {stringifyExpectedChanges} from '../helpers';

import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/yoshi-go';

describe('YoshiGo', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    before(() => {
      nock.disableNetConnect();
    });
    it('creates a release PR for google-cloud-go', async () => {
      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges: [string, object][] = [];
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'cloud-go-commits.json'), 'utf8')
      );
      const req = nock('https://api.github.com')
        // Check for in progress, merged release PRs:
        .get(
          '/repos/googleapis/google-cloud-go/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, undefined)
        // Check for existing open release PRs.
        .get('/repos/googleapis/google-cloud-go/pulls?state=open&per_page=100')
        .reply(200, undefined)
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get(
          '/repos/googleapis/google-cloud-go/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
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
          },
        ])
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // check for CHANGES.md
        .get(
          '/repos/googleapis/google-cloud-go/contents/CHANGES.md?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        // check for default branch
        .get('/repos/googleapis/google-cloud-go')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../../test/fixtures/repo-get-1.json'))
        // create release
        .post(
          '/repos/googleapis/google-cloud-go/issues/22/labels',
          (req: {[key: string]: string}) => {
            snapshot('labels-go-yoshi', req);
            return true;
          }
        )
        .reply(200, {})
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/google-cloud-go/pulls?state=open&per_page=100')
        .reply(200, []);
      const releasePR = new GoYoshi({
        repoUrl: 'googleapis/google-cloud-go',
        releaseType: 'yoshi-go',
        // not actually used by this type of repo.
        packageName: 'yoshi-go',
        apiUrl: 'https://api.github.com',
      });

      await releasePR.run();
      req.done();
      snapshot(stringifyExpectedChanges(expectedChanges));
    });
    it('creates a release PR for google-api-go-client', async () => {
      const releasePR = new GoYoshi({
        repoUrl: 'googleapis/google-api-go-client',
        releaseType: 'yoshi-go',
        // not actually used by this type of repo.
        packageName: 'yoshi-go',
        apiUrl: 'https://api.github.com',
      });

      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges: [string, object][] = [];
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );

      // Indicates that there are no PRs currently waiting to be released:
      sandbox
        .stub(releasePR.gh, 'findMergedReleasePR')
        .returns(Promise.resolve(undefined));

      // Return latest tag used to determine next version #:
      sandbox.stub(releasePR.gh, 'latestTag').returns(
        Promise.resolve({
          sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          name: 'v0.123.4',
          version: '0.123.4',
        })
      );

      // See if there are any release PRs already open, we do this as
      // we consider opening a new release-pr:
      sandbox
        .stub(releasePR.gh, 'findOpenReleasePRs')
        .returns(Promise.resolve([]));

      // Call made to close any stale release PRs still open on GitHub:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sandbox.stub(releasePR as any, 'closeStaleReleasePRs');

      // Call to add autorelease: pending label:
      sandbox.stub(releasePR.gh, 'addLabels');

      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'discovery-commits.json'), 'utf8')
      );

      const req = nock('https://api.github.com')
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // check for CHANGES.md
        .get(
          '/repos/googleapis/google-api-go-client/contents/CHANGES.md?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        // check for default branch
        .get('/repos/googleapis/google-api-go-client')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../../test/fixtures/repo-get-1.json'));

      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      req.done();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshot(stringifyExpectedChanges(expectedChanges));
    });
  });
  it('supports releasing submodule from google-cloud-go', async () => {
    const releasePR = new GoYoshi({
      repoUrl: 'googleapis/google-cloud-go',
      releaseType: 'yoshi-go',
      packageName: 'pubsublite',
      monorepoTags: true,
      path: 'pubsublite',
      apiUrl: 'https://api.github.com',
    });

    // We stub the entire suggester API, asserting only that the
    // the appropriate changes are proposed:
    let expectedChanges: [string, object][] = [];
    sandbox.replace(
      suggester,
      'createPullRequest',
      (_octokit, changes): Promise<number> => {
        expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
        return Promise.resolve(22);
      }
    );

    // Indicates that there are no PRs currently waiting to be released:
    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Return latest tag used to determine next version #:
    sandbox.stub(releasePR.gh, 'latestTag').returns(
      Promise.resolve({
        sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
        name: 'v0.123.4',
        version: '0.123.4',
      })
    );

    // See if there are any release PRs already open, we do this as
    // we consider opening a new release-pr:
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    // Call made to close any stale release PRs still open on GitHub:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sandbox.stub(releasePR as any, 'closeStaleReleasePRs');

    // Call to add autorelease: pending label:
    sandbox.stub(releasePR.gh, 'addLabels');

    const graphql = JSON.parse(
      readFileSync(resolve(fixturesPath, 'cloud-go-commits.json'), 'utf8')
    );

    const req = nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {
        data: graphql,
      })
      // check for CHANGES.md
      .get(
        '/repos/googleapis/google-cloud-go/contents/pubsublite%2FCHANGES.md?ref=refs%2Fheads%2Fmaster'
      )
      .reply(404)
      // check for default branch
      .get('/repos/googleapis/google-cloud-go')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .reply(200, require('../../../test/fixtures/repo-get-1.json'));

    const pr = await releasePR.run();
    assert.strictEqual(pr, 22);
    req.done();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snapshot(stringifyExpectedChanges(expectedChanges));
  });
});
