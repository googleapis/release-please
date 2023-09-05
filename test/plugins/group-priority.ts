// Copyright 2022 Google LLC
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
import {describe, it, beforeEach} from 'mocha';
import {expect} from 'chai';
import {GitHub} from '../../src/github';
import {GroupPriority} from '../../src/plugins/group-priority';
import {
  CandidateReleasePullRequest,
  DEFAULT_RELEASE_PLEASE_MANIFEST,
} from '../../src/manifest';
import {buildMockCandidatePullRequest} from '../helpers';

describe('GroupPriority plugin', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'node-test-repo',
      defaultBranch: 'main',
    });
  });
  describe('run', () => {
    it('prioritizes a group', async () => {
      const plugin = new GroupPriority(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {},
        ['snapshot']
      );
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('path1', 'java', '1.2.3-SNAPSHOT', {
          component: 'component1',
          group: 'snapshot',
        }),
        buildMockCandidatePullRequest('path2', 'java', '2.3.4', {
          component: 'component2',
        }),
        buildMockCandidatePullRequest('path3', 'java', '3.4.5', {
          component: 'component3',
        }),
      ];
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      expect(newCandidates[0].path).to.eql('path1');
    });
    it('falls back to all pull requests if prioritized group not found', async () => {
      const plugin = new GroupPriority(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {},
        ['snapshot']
      );
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('path1', 'java', '1.2.3', {
          component: 'component1',
          group: 'group1',
        }),
        buildMockCandidatePullRequest('path2', 'java', '2.3.4', {
          component: 'component2',
          group: 'group2',
        }),
        buildMockCandidatePullRequest('path3', 'java', '3.4.5', {
          component: 'component3',
        }),
      ];
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(3);
    });
  });
});
