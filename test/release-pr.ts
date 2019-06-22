/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const nock = require('nock');
nock.disableNetConnect();

import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as snapshot from 'snap-shot-it';

import { ReleasePR, ReleaseType } from '../src/release-pr';

const fixturesPath = './test/fixtures';

interface MochaThis {
  [skip: string]: Function;
}
function requireNode10(this: MochaThis) {
  const match = process.version.match(/v([0-9]+)/);
  if (match) {
    if (Number(match[1]) < 10) this.skip();
  }
}

describe('GitHub', () => {
  describe('Yoshi PHP Mono-Repo', () => {
    before(requireNode10);
    it('generates CHANGELOG and aborts if duplicate', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
          'utf8'
        )
      );
      const req = nock('https://api.github.com')
        // check to see if this PR was already landed and we're
        // just waiting on the autorelease.
        .get('/repos/googleapis/release-please/pulls?state=closed&per_page=25')
        .reply(200, undefined)
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get('/repos/googleapis/release-please/tags?per_page=100')
        .reply(200, [
          {
            name: 'v0.20.3',
            commit: {
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
          },
        ])
        // now we fetch the commits via the graphql API;
        // note they will be truncated to just before the tag's sha.
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // fetch the current version of each library.
        .get('/repos/googleapis/release-please/contents/AutoMl/composer.json')
        .reply(200, {
          content: Buffer.from('{"name": "automl"}', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get('/repos/googleapis/release-please/contents/AutoMl/VERSION')
        .reply(200, {
          content: Buffer.from('1.8.3', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/Datastore/composer.json'
        )
        .reply(200, {
          content: Buffer.from('{"name": "datastore"}', 'utf8').toString(
            'base64'
          ),
          sha: 'abc123',
        })
        .get('/repos/googleapis/release-please/contents/Datastore/VERSION')
        .reply(200, {
          content: Buffer.from('2.0.0', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get('/repos/googleapis/release-please/contents/PubSub/composer.json')
        .reply(200, {
          content: Buffer.from('{"name": "pubsub"}', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get('/repos/googleapis/release-please/contents/PubSub/VERSION')
        .reply(200, {
          content: Buffer.from('1.0.1', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get('/repos/googleapis/release-please/contents/Speech/composer.json')
        .reply(200, {
          content: Buffer.from('{"name": "speech"}', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get('/repos/googleapis/release-please/contents/Speech/VERSION')
        .reply(200, {
          content: Buffer.from('1.0.0', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/WebSecurityScanner/composer.json'
        )
        .reply(200, {
          content: Buffer.from(
            '{"name": "websecurityscanner"}',
            'utf8'
          ).toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/WebSecurityScanner/VERSION'
        )
        .reply(200, {
          content: Buffer.from('0.8.0', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // besides the composer.json and VERSION files that need to be
        // processed for each individual module, there are several
        // overarching meta-information files that need updating.
        .get('/repos/googleapis/release-please/contents/docs/VERSION')
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/CHANGELOG.md?ref=refs%2Fheads%2Frelease-v0.21.0'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/src/Version.php?ref=refs%2Fheads%2Frelease-v0.21.0'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/src/ServiceBuilder.php?ref=refs%2Fheads%2Frelease-v0.21.0'
        )
        .reply(404)
        .get(
          '/repos/googleapis/release-please/contents/composer.json?ref=refs%2Fheads%2Frelease-v0.21.0'
        )
        .reply(200, {
          content: Buffer.from('{"replace": {}}', 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .get(
          '/repos/googleapis/release-please/contents/docs/manifest.json?ref=refs%2Fheads%2Frelease-v0.21.0'
        )
        .reply(200, {
          content: Buffer.from(
            '{"modules": [{"name": "google/cloud", "versions": []}, {"name": "datastore", "versions": []}]}',
            'utf8'
          ).toString('base64'),
          sha: 'abc123',
        })
        // we're on the home stretch I promise ...
        // fetch prior refs, to determine whether this is an update
        // to an existing branch or new PR.
        .get('/repos/googleapis/release-please/git/refs?per_page=100')
        .reply(200, [])
        .post('/repos/googleapis/release-please/git/refs')
        .reply(200)
        .post('/repos/googleapis/release-please/issues/1/labels')
        .reply(200, { number: 1 })
        .put('/repos/googleapis/release-please/contents/AutoMl/VERSION')
        .reply(200)
        .put('/repos/googleapis/release-please/contents/Datastore/VERSION')
        .reply(200)
        .put('/repos/googleapis/release-please/contents/PubSub/VERSION')
        .reply(200)
        .put('/repos/googleapis/release-please/contents/Speech/VERSION')
        .reply(200)
        .put(
          '/repos/googleapis/release-please/contents/WebSecurityScanner/VERSION'
        )
        .reply(200)
        .put('/repos/googleapis/release-please/contents/composer.json')
        .reply(200, [])
        .put(
          '/repos/googleapis/release-please/contents/docs/manifest.json',
          (req: { [key: string]: string }) => {
            const manifest = Buffer.from(req.content, 'base64').toString('utf8')
            snapshot(manifest);
            return true;
          }
        )
        .reply(200, [])
        .put('/repos/googleapis/release-please/contents/CHANGELOG.md')
        .reply(200, [])
        // actually open the darn PR, this is the exciting step,
        // so we snapshot it:
        .post(
          '/repos/googleapis/release-please/pulls',
          (req: { [key: string]: string }) => {
            const body = req.body.replace(
              /\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g,
              ''
            );
            snapshot(body);
            return true;
          }
        )
        .reply(200, { number: 1 })
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/release-please/pulls?state=open&per_page=25')
        .reply(200, []);

      const releasePR = new ReleasePR({
        repoUrl: 'googleapis/release-please',
        label: 'autorelease: pending',
        releaseType: ReleaseType.PHPYoshi,
        // not actually used by this type of repo.
        packageName: 'yoshi-php',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
    });
  });
});
