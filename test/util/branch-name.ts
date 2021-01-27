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

import {BranchName} from '../../src/util/branch-name';
import {describe, it} from 'mocha';
import {expect} from 'chai';

describe('BranchName', () => {
  describe('parse', () => {
    describe('autorelease branch name', () => {
      it('parses a versioned branch name', () => {
        const name = 'release-v1.2.3';
        const branchName = BranchName.parse(name);
        expect(branchName).to.not.be.undefined;
        expect(branchName?.getTargetBranch()).to.be.undefined;
        expect(branchName?.getComponent()).to.be.undefined;
        expect(branchName?.getVersion()).to.eql('1.2.3');
        expect(branchName?.toString()).to.eql(name);
      });
      it('parses a versioned branch name with component', () => {
        const name = 'release-storage-v1.2.3';
        const branchName = BranchName.parse(name);
        expect(branchName).to.not.be.undefined;
        expect(branchName?.getTargetBranch()).to.be.undefined;
        expect(branchName?.getComponent()).to.eql('storage');
        expect(branchName?.getVersion()).to.eql('1.2.3');
        expect(branchName?.toString()).to.eql(name);
      });
    });
    it('parses a target branch', () => {
      const name = 'release-please/branches/main';
      const branchName = BranchName.parse(name);
      expect(branchName).to.not.be.undefined;
      expect(branchName?.getTargetBranch()).to.eql('main');
      expect(branchName?.getComponent()).to.be.undefined;
      expect(branchName?.getVersion()).to.be.undefined;
      expect(branchName?.toString()).to.eql(name);
    });

    it('parses a target branch and component', () => {
      const name = 'release-please/branches/main/components/storage';
      const branchName = BranchName.parse(name);
      expect(branchName).to.not.be.undefined;
      expect(branchName?.getTargetBranch()).to.eql('main');
      expect(branchName?.getComponent()).to.eql('storage');
      expect(branchName?.getVersion()).to.be.undefined;
      expect(branchName?.toString()).to.eql(name);
    });

    it('fails to parse', () => {
      const branchName = BranchName.parse('release-foo');
      expect(branchName).to.be.undefined;
    });
  });
  describe('ofVersion', () => {
    it('builds the autorelease versioned branch name', () => {
      const branchName = BranchName.ofVersion('1.2.3');
      expect(branchName.toString()).to.eql('release-v1.2.3');
    });
  });
  describe('ofComponentVersion', () => {
    it('builds the autorelease versioned branch name with component', () => {
      const branchName = BranchName.ofComponentVersion('storage', '1.2.3');
      expect(branchName.toString()).to.eql('release-storage-v1.2.3');
    });
  });
});
