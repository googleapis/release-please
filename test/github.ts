// Copyright 2019 Google LLC
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

const nock = require('nock');
nock.disableNetConnect();

import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as snapshot from 'snap-shot-it';

import { GitHub } from '../src/github';
const github = new GitHub({ owner: 'fake', repo: 'fake' });

const fixturesPath = './test/fixtures';

describe('GitHub', () => {
  describe('commitsSinceSha', () => {
    it('returns commits immediately before sha', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
          'utf8'
        )
      );
      const req = nock('https://api.github.com')
        .post('/graphql')
        .reply(200, {
          data: graphql,
        });
      const commitsSinceSha = await github.commitsSinceSha(
        'cf52ec0bcdc777dc9c5e76153d7d253bea95d44b'
      );
      snapshot(commitsSinceSha);
      req.done();
    });
  });

  describe('findFilesByfilename', () => {
    it('returns files matching the requested pattern', async () => {
      const fileSearchResponse = JSON.parse(
        readFileSync(resolve(fixturesPath, 'pom-file-search.json'), 'utf8')
      );
      const req = nock('https://api.github.com')
        .get('/search/code?q=filename%3Apom.xml+repo%3Afake%2Ffake')
        .reply(200, fileSearchResponse);
      const pomFiles = await github.findFilesByFilename('pom.xml');
      snapshot(pomFiles);
      req.done();
    });
  });
});
