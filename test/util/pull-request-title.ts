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

import {PullRequestTitle} from '../../src/util/pull-request-title';
import {describe, it} from 'mocha';
import {expect} from 'chai';

describe('PullRequestTitle', () => {
  describe('parse', () => {
    describe('autorelease branch name', () => {
      it('parses a versioned branch name', () => {
        const name = 'chore: release 1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(name);
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.be.undefined;
        expect(pullRequestTitle?.getVersion()).to.eql('1.2.3');
        expect(pullRequestTitle?.toString()).to.eql(name);
      });
      it('parses a versioned branch name with v', () => {
        const name = 'chore: release v1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(name);
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.be.undefined;
        expect(pullRequestTitle?.getVersion()).to.eql('1.2.3');
      });
      it('parses a versioned branch name with component', () => {
        const name = 'chore: release storage v1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(name);
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.eql('storage');
        expect(pullRequestTitle?.getVersion()).to.eql('1.2.3');
      });
    });

    it('parses a target branch', () => {
      const name = 'chore(main): release v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(name);
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.be.undefined;
      expect(pullRequestTitle?.getVersion()).to.eql('1.2.3');
    });

    it('parses a target branch and component', () => {
      const name = 'chore(main): release storage v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(name);
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.eql('storage');
      expect(pullRequestTitle?.getVersion()).to.eql('1.2.3');
    });

    it('fails to parse', () => {
      const pullRequestTitle = PullRequestTitle.parse('release-foo');
      expect(pullRequestTitle).to.be.undefined;
    });
  });
  describe('ofVersion', () => {
    it('builds the autorelease versioned branch name', () => {
      const pullRequestTitle = PullRequestTitle.ofVersion('1.2.3');
      expect(pullRequestTitle.toString()).to.eql('chore: release 1.2.3');
    });
  });
  describe('ofComponentVersion', () => {
    it('builds the autorelease versioned branch name with component', () => {
      const pullRequestTitle = PullRequestTitle.ofComponentVersion(
        'storage',
        '1.2.3'
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore: release storage 1.2.3'
      );
    });
  });
  describe('ofTargetBranch', () => {
    it('builds branchname with only target branch', () => {
      const pullRequestTitle = PullRequestTitle.ofTargetBranchVersion(
        'main',
        '1.2.3'
      );
      expect(pullRequestTitle.toString()).to.eql('chore(main): release 1.2.3');
    });
  });
  describe('ofComponentTargetBranch', () => {
    it('builds branchname with target branch and component', () => {
      const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
        'foo',
        'main',
        '1.2.3'
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore(main): release foo 1.2.3'
      );
    });
  });
});
