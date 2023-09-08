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

import {afterEach, beforeEach, describe, it} from 'mocha';
import {GitHub} from '../../src';
import * as sinon from 'sinon';
import {
  assertHasUpdate,
  assertHasUpdates,
  buildMockConventionalCommit,
} from '../helpers';
import {Changelog} from '../../src/updaters/changelog';
import {Generic} from '../../src/updaters/generic';
import {JavaReleased} from '../../src/updaters/java/java-released';
import {Maven} from '../../src/strategies/maven';
import {PomXml} from '../../src/updaters/java/pom-xml';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {expect} from 'chai';

const sandbox = sinon.createSandbox();

const COMMITS = [
  ...buildMockConventionalCommit('fix(deps): update dependency'),
  ...buildMockConventionalCommit('chore: update common templates'),
];

describe('Maven', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'maven-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('updates pom.xml files', async () => {
      const strategy = new Maven({
        targetBranch: 'main',
        github,
        extraFiles: ['foo/bar.java'],
      });

      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('pom.xml', 'main')
        .resolves(['pom.xml', 'submodule/pom.xml']);

      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease: undefined,
      });

      expect(release?.version?.toString()).to.eql('0.0.1');

      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdates(updates, 'pom.xml', PomXml, JavaReleased, Generic);
      assertHasUpdates(
        updates,
        'submodule/pom.xml',
        PomXml,
        JavaReleased,
        Generic
      );
      assertHasUpdates(updates, 'foo/bar.java', JavaReleased, Generic);
    });

    it('does not update released version for snapshot bump', async () => {
      const strategy = new Maven({
        targetBranch: 'main',
        github,
        extraFiles: ['foo/bar.java'],
      });

      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('pom.xml', 'main')
        .resolves(['pom.xml', 'submodule/pom.xml']);

      const latestRelease = {
        tag: new TagName(Version.parse('2.3.3')),
        sha: 'abc123',
        notes: 'some notes',
      };

      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });

      expect(release?.version?.toString()).to.eql('2.3.4-SNAPSHOT');

      const updates = release!.updates;
      assertHasUpdates(updates, 'pom.xml', PomXml, Generic);
      assertHasUpdates(updates, 'submodule/pom.xml', PomXml, Generic);
      assertHasUpdates(updates, 'foo/bar.java', Generic);
    });
  });
});
