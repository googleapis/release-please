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

import {GitHub, GitHubTag} from '../src/github';
import {Update, UpdateOptions} from '../src/updaters/update';

const {resolve} = require('path');

// configure nock to record HTTP responses as fixtures.
const nockBack = require('nock').back;
if (process.env.RECORD) {
  nockBack.setMode('record');
}
nockBack.fixtures = resolve(__dirname, '../../system-test/fixtures/gh');

require('chai').should();

interface NockBackResponse {
  nockDone: Function;
}

// Updaters update files such as CHANGELOG,
// package.json, setup.py; we use a fake updater
// in tests so that changes to our updateContent
// method don't break fixtures.
class FakeFileUpdater implements Update {
  path: string;
  changelogEntry: string;
  version: string;
  create: boolean;
  packageName: string;

  constructor(options: UpdateOptions) {
    this.create = true;
    this.path = options.path;
    this.changelogEntry = options.changelogEntry;
    this.version = options.version;
    this.packageName = options.packageName;
  }
  updateContent(content: string): string {
    return this.changelogEntry + content;
  }
}

describe('GitHub', () => {
  describe('latestRelease', () => {
    it('returns the latest semver valid tag', async () => {
      const gh = new GitHub({
        token: process.env.GH_TOKEN,
        owner: 'google',
        repo: 'js-green-licenses'
      });
      const latestTag =
          await nockBack('latest-tag.json').then((nbr: NockBackResponse) => {
            return gh.latestTag(4).then((res: GitHubTag) => {
              nbr.nockDone();
              return res;
            });
          });
      latestTag.should.eql({
        name: 'v0.5.0',
        version: '0.5.0',
        sha: 'c16bcdee9fbac799c8ffb28d7447487a7f94b929'
      });
    });
  });

  describe('commitsSinceSha', () => {
    it('returns all commits until immediately before SHA', async () => {
      const gh = new GitHub({
        token: process.env.GH_TOKEN,
        owner: 'google',
        repo: 'js-green-licenses'
      });
      const commitsSinceSha =
          await nockBack('commits-since-sha.json')
              .then((nbr: NockBackResponse) => {
                return gh
                    .commitsSinceSha(
                        'c16bcdee9fbac799c8ffb28d7447487a7f94b929', 10)
                    .then((res: string[]) => {
                      nbr.nockDone();
                      return res;
                    });
              });
      commitsSinceSha[0].should.include(
          'chore(deps): update dependency @types/nock to v10');
      commitsSinceSha[commitsSinceSha.length - 1].should.include(
          'define regexp only once in circleci config');
    });
  });

  describe('openPR', () => {
    it('throws AuthError if user lacks write permissions', async () => {
      const gh = new GitHub({owner: 'google', repo: 'js-green-licenses'});
      await nockBack('open-pr-no-write.json').then((nbr: NockBackResponse) => {
        return gh
            .openPR({
              branch: 'greenkeeper/@types/node-10.10.0',
              sha: 'abc123',
              version: '1.3.0',
              updates: []
            })
            .catch(err => {
              nbr.nockDone();
              err.status.should.equal(401);
              err.message.should.equal('unauthorized');
            });
      });
    });

    describe('user has write permissions', () => {
      it('creates branch with updated content, if file in updates array exists',
         async () => {
           const version = '7.0.0';
           const branch = `release-${version}`;
           const gh = new GitHub({
             token: process.env.GH_TOKEN,
             owner: 'bcoe',
             repo: 'examples-conventional-commits'
           });
           const cl = new FakeFileUpdater({
             path: 'CHANGELOG.md',
             version,
             changelogEntry: 'fixed all the things',
             packageName: '@google-cloud/foo'
           });
           const ref = await nockBack('open-pr-update-file.json')
                           .then(async (nbr: NockBackResponse) => {
                             await gh.openPR({
                               branch,
                               sha: '42f90e2646c49a79bb2c98b658021d468ad5e814',
                               version,
                               updates: [cl]
                             });
                             const ref = await gh.refByBranchName(branch);
                             nbr.nockDone();
                             return ref;
                           });
           ref.should.equal('refs/heads/release-7.0.0');
         });

      it('creates branch with updated content, if file in updates does not exist',
         async () => {
           const version = '8.0.0';
           const branch = `release-${version}`;
           const gh = new GitHub({
             token: process.env.GH_TOKEN,
             owner: 'bcoe',
             repo: 'examples-conventional-commits'
           });
           const cl = new FakeFileUpdater({
             path: 'CHANGELOG-FOO.md',
             version,
             changelogEntry: 'fixed all the things',
             packageName: '@google-cloud/foo'
           });
           const ref = await nockBack('open-pr-create-file.json')
                           .then(async (nbr: NockBackResponse) => {
                             await gh.openPR({
                               branch,
                               sha: '42f90e2646c49a79bb2c98b658021d468ad5e814',
                               version,
                               updates: [cl]
                             });
                             const ref = await gh.refByBranchName(branch);
                             nbr.nockDone();
                             return ref;
                           });
           ref.should.equal('refs/heads/release-8.0.0');
         });
    });
  });
});
