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

describe('GitHub', () => {
  describe('Yoshi PHP Mono-Repo', () => {
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
        });
      const releasePR = new ReleasePR({
        repoUrl: 'googleapis/release-please',
        label: 'autorelease: pending',
        releaseType: ReleaseType.PHPYoshi,
        // not actually used by this type of repo.
        packageName: 'yoshi-php',
      });
      await releasePR.run();
      req.done();
    });
  });
});
