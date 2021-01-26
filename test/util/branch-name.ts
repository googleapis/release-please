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
    describe('legacy branch name', () => {
      it('parses a legacy branch name', () => {
        const branchName = BranchName.parse('release-v1.2.3');
        expect(branchName).to.not.be.undefined;
        expect(branchName?.getTargetBranch()).to.be.undefined;
        expect(branchName?.getComponent()).to.be.undefined;
        expect(branchName?.getVersion()).to.eql('v1.2.3');
      });
      it('parses a legacy branch name with component', () => {
        const branchName = BranchName.parse('release-storage-v1.2.3');
        expect(branchName).to.not.be.undefined;
        expect(branchName?.getTargetBranch()).to.be.undefined;
        expect(branchName?.getComponent()).to.eql('storage');
        expect(branchName?.getVersion()).to.eql('v1.2.3');
      });
    });
    it('parses a target branch', () => {
      const branchName = BranchName.parse('release-please/branches/main');
      expect(branchName).to.not.be.undefined;
      expect(branchName?.getTargetBranch()).to.eql('main');
      expect(branchName?.getComponent()).to.be.undefined;
      expect(branchName?.getVersion()).to.be.undefined;
    });

    it('parses a target branch and component', () => {
      const branchName = BranchName.parse(
        'release-please/branches/main/components/storage'
      );
      expect(branchName).to.not.be.undefined;
      expect(branchName?.getTargetBranch()).to.eql('main');
      expect(branchName?.getComponent()).to.eql('storage');
      expect(branchName?.getVersion()).to.be.undefined;
    });

    it('fails to parse', () => {
      const branchName = BranchName.parse('release-foo');
      expect(branchName).to.be.undefined;
    });
  });
});
