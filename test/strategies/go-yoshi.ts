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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {expect} from 'chai';
import {GitHub} from '../../src/scms/github';
import {GoYoshi} from '../../src/strategies/go-yoshi';
import * as sinon from 'sinon';
import {assertHasUpdate, dateSafe} from '../helpers';
import {buildMockCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import snapshot = require('snap-shot-it');
import {VersionGo} from '../../src/updaters/go/version-go';
import {Scm} from '../../src/scm';

const sandbox = sinon.createSandbox();

const COMMITS = [
  buildMockCommit(
    'fix(iam): update dependency com.google.cloud:google-cloud-storage to v1.120.0',
    ['iam/foo.go']
  ),
  buildMockCommit('chore: update common templates'),
];

describe('GoYoshi', () => {
  let scm: Scm;
  beforeEach(async () => {
    scm = await GitHub.create({
      owner: 'googleapis',
      repo: 'google-cloud-go',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.1.0';
      const strategy = new GoYoshi({
        targetBranch: 'main',
        scm,
        component: 'iam',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release?.version?.toString()).to.eql(expectedVersion);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new GoYoshi({
        targetBranch: 'main',
        scm,
        component: 'iam',
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'iam'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(release?.version?.toString()).to.eql(expectedVersion);
    });
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new GoYoshi({
        targetBranch: 'main',
        scm,
        component: 'iam',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGES.md', Changelog);
      assertHasUpdate(updates, 'internal/version.go', VersionGo);
    });
  });
  describe('buildReleasePullRequest', () => {
    it('filters out submodule commits', async () => {
      sandbox
        .stub(scm, 'findFilesByFilenameAndRef')
        .withArgs('go.mod', 'main')
        .resolves(['go.mod', 'internal/go.mod', 'logging/go.mod']);
      const strategy = new GoYoshi({
        targetBranch: 'main',
        scm,
        includeComponentInTag: false,
      });
      const commits = [
        buildMockCommit('fix: some generic fix'),
        buildMockCommit('fix(translate): some translate fix'),
        buildMockCommit('fix(logging): some logging fix'),
        buildMockCommit('feat: some generic feature'),
      ];
      const pullRequest = await strategy.buildReleasePullRequest(commits);
      const pullRequestBody = pullRequest!.body.toString();
      expect(pullRequestBody).to.not.include('logging');
      snapshot(dateSafe(pullRequestBody));
    });
    it('filters out touched files not matching submodule commits', async () => {
      sandbox
        .stub(scm, 'findFilesByFilenameAndRef')
        .withArgs('go.mod', 'main')
        .resolves(['go.mod', 'internal/go.mod', 'logging/go.mod']);
      const strategy = new GoYoshi({
        targetBranch: 'main',
        scm,
        includeComponentInTag: false,
      });
      const commits = [
        buildMockCommit('fix: some generic fix'),
        buildMockCommit('fix(iam/apiv1): some firestore fix', [
          'accessapproval/apiv1/access_approval_client.go',
          'iam/apiv1/admin/firestore_admin_client.go',
        ]),
        buildMockCommit('feat: some generic feature'),
      ];
      const pullRequest = await strategy.buildReleasePullRequest(commits);
      const pullRequestBody = pullRequest!.body.toString();
      expect(pullRequestBody).to.not.include('access');
      expect(pullRequestBody).to.include('iam');
      snapshot(dateSafe(pullRequestBody));
    });

    it('combines google-api-go-client autogenerated PR', async () => {
      scm = await GitHub.create({
        owner: 'googleapis',
        repo: 'google-api-go-client',
        defaultBranch: 'main',
      });
      const strategy = new GoYoshi({
        targetBranch: 'main',
        scm,
      });
      const commits = [
        buildMockCommit('feat(all): auto-regenerate discovery clients (#1281)'),
        buildMockCommit('feat(all): auto-regenerate discovery clients (#1280)'),
        buildMockCommit('feat(all): auto-regenerate discovery clients (#1279)'),
        buildMockCommit('feat(all): auto-regenerate discovery clients (#1278)'),
      ];
      const pullRequest = await strategy.buildReleasePullRequest(commits);
      const pullRequestBody = pullRequest!.body.toString();
      snapshot(dateSafe(pullRequestBody));
    });
  });
  describe('getIgnoredSubModules', () => {
    it('ignores non-google-cloud-go repos', async () => {
      scm = await GitHub.create({
        owner: 'googleapis',
        repo: 'google-cloud-foo',
        defaultBranch: 'main',
      });
      const strategy = new GoYoshi({
        targetBranch: 'main',
        scm,
        includeComponentInTag: false,
      });
      const ignoredSubModules = await strategy.getIgnoredSubModules();
      expect(ignoredSubModules.size).to.eql(0);
    });
    it('ignores submodule configurations', async () => {
      const strategy = new GoYoshi({
        targetBranch: 'main',
        scm,
        component: 'storage',
        includeComponentInTag: true,
      });
      const ignoredSubModules = await strategy.getIgnoredSubModules();
      expect(ignoredSubModules.size).to.eql(0);
    });
    it('fetches the list of submodules', async () => {
      sandbox
        .stub(scm, 'findFilesByFilenameAndRef')
        .withArgs('go.mod', 'main')
        .resolves([
          'storage/go.mod',
          'go.mod',
          'internal/foo/go.mod',
          'internal/go.mod',
          'pubsub/go.mod',
        ]);
      const strategy = new GoYoshi({
        targetBranch: 'main',
        scm,
        component: 'main',
        includeComponentInTag: false,
      });
      const ignoredSubModules = await strategy.getIgnoredSubModules();
      expect(ignoredSubModules.size).to.eql(2);
      expect(ignoredSubModules.has('storage')).to.be.true;
      expect(ignoredSubModules.has('pubsub')).to.be.true;
    });
  });
});
