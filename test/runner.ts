// Copyright 2021 Google LLC
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

import {resolve} from 'path';
import {readFileSync} from 'fs';

import {describe, it, afterEach} from 'mocha';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import * as nock from 'nock';
import * as snapshot from 'snap-shot-it';

import runner from '../src/runner';

const sandbox = sinon.createSandbox();

describe('Runner', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('release-pr', () => {
    it('allows customization of changelog sections', async () => {
      // Fake the createPullRequest step, and capture a set of files to assert against:
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
          resolve('./test/releasers/fixtures/node', 'commits.json'),
          'utf8'
        )
      );

      const existingPackageResponse = {
        content: Buffer.from(
          JSON.stringify({
            name: 'runner-package',
            version: '1.0.0',
          }),
          'utf8'
        ).toString('base64'),
        sha: 'abc123',
      };

      const scope = nock('https://api.github.com')
        // Check for in progress, merged release PRs:
        .get(
          '/repos/googleapis/release-please/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, undefined)
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get('/repos/googleapis/release-please/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.0.0',
            commit: {
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
          },
        ])
        .get(
          '/repos/googleapis/release-please/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, undefined)
        // now we fetch the commits via the graphql API;
        // note they will be truncated to just before the tag's sha.
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        .get(
          '/repos/googleapis/release-please/contents/package.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, existingPackageResponse)
        .get('/repos/googleapis/release-please')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../test/fixtures/repo-get-1.json'))
        .get(
          '/repos/googleapis/release-please/contents/CHANGELOG.md?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/package-lock.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/samples%2Fpackage.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/package.json?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, existingPackageResponse)
        // this step tries to match any existing PRs; just return an empty list.
        .get('/repos/googleapis/release-please/pulls?state=open&per_page=100')
        .reply(200, [])
        // Add autorelease: pending label to release PR:
        .post('/repos/googleapis/release-please/issues/22/labels')
        .reply(200)
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/release-please/pulls?state=open&per_page=100')
        .reply(200, []);

      await runner(
        {
          apiUrl: 'https://api.github.com',
          repoUrl: 'googleapis/release-please',
          releaseType: 'node',
          packageName: 'runner-package',
          changelogSections: [
            {type: 'feat', section: 'Features'},
            {type: 'fix', section: 'Other'},
            {type: 'chore', section: 'Other'},
          ],
        },
        'release-pr'
      );

      scope.done();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });
  });
});
