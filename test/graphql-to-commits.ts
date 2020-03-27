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

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {GitHub} from '../src/github';
import {graphqlToCommits} from '../src/graphql-to-commits';

const fixturesPath = './test/fixtures';

const github = new GitHub({owner: 'fake', repo: 'fake'});

describe('graphqlToCommits', () => {
  it('converts raw graphql response into Commits object', async () => {
    const graphql = JSON.parse(
      readFileSync(
        resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
        'utf8'
      )
    );
    const commits = await graphqlToCommits(github, graphql);
    snapshot(commits);
  });

  it('uses label for conventional commit prefix, if no prefix provided', async () => {
    const graphql = JSON.parse(
      readFileSync(resolve(fixturesPath, 'commits-with-labels.json'), 'utf8')
    );
    const commits = await graphqlToCommits(github, graphql);
    snapshot(commits);
  });
});
