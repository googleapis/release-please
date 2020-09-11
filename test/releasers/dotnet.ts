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
import * as nock from 'nock';
import {DotNet} from '../../src/releasers/dotnet';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/dotnet';

describe('DotNet', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('creates a release PR', async () => {
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
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits.json'), 'utf8')
      );
      const req = nock('https://api.github.com')
        // Check for in progress, merged release PRs:
        .get('/repos/googleapis/foo-dot-net/pulls?state=closed&per_page=100')
        .reply(200, undefined)
        // Check for existing open release PRs:
        .get('/repos/googleapis/foo-dot-net/pulls?state=open&per_page=100')
        .reply(200, undefined)
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get('/repos/googleapis/foo-dot-net/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.2.0',
            commit: {
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
          },
        ])
        // Search for project files:
        .get(
          '/search/code?q=filename%3A*.csproj+repo%3Agoogleapis%2Ffoo-dot-net'
        )
        .reply(200, {
          items: [{path: 'foo.csproj'}],
        })
        .get(
          '/search/code?q=filename%3A*.fsproj+repo%3Agoogleapis%2Ffoo-dot-net'
        )
        .reply(200, {
          items: [],
        })
        .get(
          '/search/code?q=filename%3A*.vbproj+repo%3Agoogleapis%2Ffoo-dot-net'
        )
        .reply(200, {
          items: [],
        })
        // GraphQL request for commits:
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // check for history.md
        .get(
          '/repos/googleapis/foo-dot-net/contents/docs/history.md?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        // fetch the README.md, so that the version # can be updated:
        .get(
          '/repos/googleapis/foo-dot-net/contents/README.md?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: readFileSync(resolve(fixturesPath, './README.md')).toString(
            'base64'
          ),
          sha: 'abc123',
        })
        // fetch the CommonProperties.xml, so that the version # can be updated:
        .get(
          '/repos/googleapis/foo-dot-net/contents/src/CommonProperties.xml?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: readFileSync(
            resolve(fixturesPath, './CommonProperties.xml')
          ).toString('base64'),
          sha: 'abc123',
        })
        // fetch and update project files:
        .get(
          '/repos/googleapis/foo-dot-net/contents/foo.csproj?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: readFileSync(resolve(fixturesPath, './foo.csproj')).toString(
            'base64'
          ),
          sha: 'abc123',
        })
        // check for default branch
        .get('/repos/googleapis/foo-dot-net')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../../test/fixtures/repo-get-1.json'))
        .post('/repos/googleapis/foo-dot-net/issues/22/labels', () => {
          return true;
        })
        .reply(200, {})
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/foo-dot-net/pulls?state=open&per_page=100')
        .reply(200, []);
      const releasePR = new DotNet({
        repoUrl: 'googleapis/foo-dot-net',
        releaseType: 'dotnet',
        // Used when determining which version # to update.
        packageName: 'Google.Events',
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
  });
});
