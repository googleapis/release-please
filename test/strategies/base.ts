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
import * as sinon from 'sinon';
import {expect} from 'chai';
import {BaseStrategy} from '../../src/strategies/base';
import {Update} from '../../src/update';
import {GitHub} from '../../src/github';
import {PullRequestBody} from '../../src/util/pull-request-body';
import snapshot = require('snap-shot-it');
import {dateSafe, assertHasUpdate} from '../helpers';
import {GenericJson} from '../../src/updaters/generic-json';
import {Generic} from '../../src/updaters/generic';
import {GenericXml} from '../../src/updaters/generic-xml';

const sandbox = sinon.createSandbox();

class TestStrategy extends BaseStrategy {
  async buildUpdates(): Promise<Update[]> {
    return [];
  }
}

describe('Strategy', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'base-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('should ignore empty commits', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const pullRequest = await strategy.buildReleasePullRequest([]);
      expect(pullRequest).to.be.undefined;
    });
    it('allows overriding initial version', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const commits = [
        {
          sha: 'abc123',
          message: 'chore: initial commit\n\nRelease-As: 2.3.4',
        },
      ];
      const pullRequest = await strategy.buildReleasePullRequest(commits);
      expect(pullRequest).to.not.be.undefined;
      expect(pullRequest?.version?.toString()).to.eql('2.3.4');
      snapshot(dateSafe(pullRequest!.body.toString()));
    });
    it('updates extra files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: ['0', 'foo/1.~csv', 'foo/2.bak', 'foo/baz/bar/', '/3.java'],
      });
      const pullRequest = await strategy.buildReleasePullRequest(
        [{sha: 'aaa', message: 'fix: a bugfix'}],
        undefined
      );
      expect(pullRequest).to.exist;
      expect(pullRequest?.updates).to.be.an('array');
      expect(pullRequest?.updates.map(update => update.path))
        .to.include.members([
          '0',
          '3.java',
          'foo/1.~csv',
          'foo/2.bak',
          'foo/baz/bar',
        ])
        .and.not.include('foo/baz/bar/', 'expected file but got directory');
    });
    it('updates extra JSON files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: ['0', {type: 'json', path: '/3.json', jsonpath: '$.foo'}],
      });
      const pullRequest = await strategy.buildReleasePullRequest(
        [{sha: 'aaa', message: 'fix: a bugfix'}],
        undefined
      );
      expect(pullRequest).to.exist;
      const updates = pullRequest?.updates;
      expect(updates).to.be.an('array');
      assertHasUpdate(updates!, '0', Generic);
      assertHasUpdate(updates!, '3.json', GenericJson);
    });
    it('updates extra Xml files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: ['0', {type: 'xml', path: '/3.xml', xpath: '$.foo'}],
      });
      const pullRequest = await strategy.buildReleasePullRequest(
        [{sha: 'aaa', message: 'fix: a bugfix'}],
        undefined
      );
      expect(pullRequest).to.exist;
      const updates = pullRequest?.updates;
      expect(updates).to.be.an('array');
      assertHasUpdate(updates!, '0', Generic);
      assertHasUpdate(updates!, '3.xml', GenericXml);
    });
    it('rejects relative extra files', async () => {
      const extraFiles = [
        './bar',
        './../../../etc/hosts',
        '../../../../etc/hosts',
        '~/./5',
        '~/.ssh/config',
        '~/../../.././level/../../../up',
        '/../../../opt',
        'foo/bar/../baz',
        'foo/baz/../../../../../etc/hostname',
      ];
      for (const file of extraFiles) {
        try {
          const strategy = new TestStrategy({
            targetBranch: 'main',
            github,
            component: 'google-cloud-automl',
            extraFiles: [file],
          });
          await strategy.buildReleasePullRequest(
            [{sha: 'aaa', message: 'fix: a bugfix'}],
            undefined
          );
          expect.fail(`expected [addPath] to reject path: ${file}`);
        } catch (err) {
          expect(err).to.be.instanceof(Error);
          expect(err.message).to.have.string(
            'illegal pathing characters in path'
          );
        }
      }
    });
  });
  describe('buildRelease', () => {
    it('builds a release tag', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('google-cloud-automl-v1.2.3');
    });
    it('overrides the tag separator', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        tagSeparator: '/',
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('google-cloud-automl/v1.2.3');
    });
    it('skips component in release tag', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        includeComponentInTag: false,
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('v1.2.3');
    });
  });
});
