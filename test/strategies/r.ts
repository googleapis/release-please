// Copyright 2025 Google LLC
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

import {afterEach, beforeEach, describe, it} from 'mocha';
import {GitHub} from '../../src';
import * as sinon from 'sinon';
import {
  assertHasUpdate,
  assertHasUpdates,
  buildMockConventionalCommit,
} from '../helpers';
import {News} from '../../src/updaters/r/news';
import {DescriptionUpdater} from '../../src/updaters/r/description';
import {R} from '../../src/strategies/r';
import {expect} from 'chai';

const sandbox = sinon.createSandbox();

const COMMITS = [
  ...buildMockConventionalCommit('fix(deps): update dependency'),
  ...buildMockConventionalCommit('chore: update common templates'),
];

describe('R', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'r-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('updates DESCRIPTION and NEWS.md files', async () => {
      const strategy = new R({
        targetBranch: 'main',
        github,
        changelogPath: 'NEWS.md',
      });

      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('DESCRIPTION', 'main')
        .resolves(['DESCRIPTION']);

      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        undefined
      );

      expect(release?.version?.toString()).to.eql('0.1.0');

      const updates = release!.updates;
      assertHasUpdate(updates, 'NEWS.md', News);
      assertHasUpdates(updates, 'DESCRIPTION', DescriptionUpdater);
    });
  });
});
