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

import {GitHub} from '../src/github';
import {describe, it} from 'mocha';
import {readFileSync} from 'fs';

const token = readFileSync(process.env.TOKEN_PATH!, 'utf8').trim();
const apiUrl = readFileSync(process.env.API_URL_PATH!, 'utf8').trim();
const proxyKey = readFileSync(process.env.PROXY_KEY_PATH!, 'utf8').trim();

require('chai').should();

describe('GitHub', () => {
  describe('latestRelease', () => {
    it('returns the latest semver valid tag', async () => {
      const gh = new GitHub({
        owner: 'googleapis',
        repo: 'release-please',
        token,
        apiUrl,
        proxyKey,
      });
      const latestTag = await gh.latestTag(4);
      if (latestTag === undefined) throw Error('latestTag not found');
      latestTag.sha.should.match(/[a-z0-9]{40}/);
    });
  });

  describe('commitsSinceSha', () => {
    it('returns all commits until immediately before SHA', async () => {
      const gh = new GitHub({
        owner: 'google',
        repo: 'js-green-licenses',
        token,
        apiUrl,
        proxyKey,
      });
      const commitsSinceSha = await gh.commitsSinceSha(
        'c16bcdee9fbac799c8ffb28d7447487a7f94b929',
        20
      );
      commitsSinceSha.length.should.be.gt(2);
    });

    it('returns all commits if sha is undefined', async () => {
      const gh = new GitHub({
        owner: 'bcoe',
        repo: 'node-25650-bug',
        token,
        apiUrl,
        proxyKey,
      });
      const commitsSinceSha = await gh.commitsSinceSha(undefined, 20);
      commitsSinceSha.length.should.be.gte(2);
    });
  });
});
