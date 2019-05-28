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

import {expect} from 'chai';

import {GitHub, GitHubTag} from '../src/github';
import {Commit} from '../src/graphql-to-commits';
import {Update, UpdateOptions} from '../src/updaters/update';

const {resolve} = require('path');

require('chai').should();

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
      const gh = new GitHub({owner: 'google', repo: 'js-green-licenses'});
      const latestTag = await gh.latestTag(4);
      if (latestTag === undefined) throw Error('latestTag not found');
      latestTag.sha.should.match(/[a-z0-9]{40}/);
    });

    it('returns undefined if no tags exist', async () => {
      const gh = new GitHub({owner: 'bcoe', repo: 'node-25650-bug'});
      const latestTag = await gh.latestTag(4);
      expect(latestTag).to.equal(undefined);
    });
  });

  describe('commitsSinceSha', () => {
    it('returns all commits until immediately before SHA', async () => {
      const gh = new GitHub({owner: 'google', repo: 'js-green-licenses'});
      const commitsSinceSha = await gh.commitsSinceSha(
          'c16bcdee9fbac799c8ffb28d7447487a7f94b929', 10);
      commitsSinceSha.length.should.be.gt(2);
    });

    it('returns all commits if sha is undefined', async () => {
      const gh = new GitHub({owner: 'bcoe', repo: 'node-25650-bug'});
      const commitsSinceSha = await gh.commitsSinceSha(undefined, 10);
      commitsSinceSha.length.should.be.gte(2);
    });
  });

  describe('openPR', () => {
    it('throws AuthError if user lacks write permissions', async () => {
      const gh = new GitHub({owner: 'google', repo: 'js-green-licenses'});
      await gh
          .openPR({
            branch: 'greenkeeper/@types/node-10.10.0',
            sha: 'abc123',
            version: '1.3.0',
            title: 'version 1.3.0',
            body: 'my PR body',
            updates: [],
            labels: []
          })
          .catch(err => {
            err.status.should.equal(401);
            err.message.should.equal('unauthorized');
          });
    });
  });

  describe('findExistingReleaseIssue', () => {
    it('returns an open issue matching the title provided', async () => {
      const gh = new GitHub({owner: 'bcoe', repo: 'node-25650-bug'});
      const issue = await gh.findExistingReleaseIssue(
          'this issue is a fixture', ['type: process', 'release-candidate']);
      if (issue === undefined) throw Error('issue not found');
      issue.number.should.be.gt(0);
    });
  });

  describe('latestReleasePR', () => {
    it('returns the latest closed PR with "autorelease: pending"/"type: process" tag',
       async () => {
         const gh = new GitHub({owner: 'bcoe', repo: 'node-25650-bug'});
         const pr = await gh.findMergedReleasePR(
             ['type: process', 'autorelease: pending']);
         if (pr === undefined) throw Error('PR not found');
         pr.should.eql({
           version: 'v1.1.0',
           sha: 'f52c585f1319b789ff75e864fe9bf7479f72ae0e',
           number: 6
         });
       });
  });
});
