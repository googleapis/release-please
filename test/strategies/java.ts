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
import {Java} from '../../src/strategies/java';
import * as sinon from 'sinon';
import {
  assertHasUpdate,
  assertHasUpdates,
  assertNoHasUpdate,
  buildMockConventionalCommit,
} from '../helpers';
import {expect} from 'chai';
import {Version} from '../../src/version';
import {TagName} from '../../src/util/tag-name';
import {Changelog} from '../../src/updaters/changelog';
import {DEFAULT_LABELS, DEFAULT_SNAPSHOT_LABELS} from '../../src/manifest';
import {Generic} from '../../src/updaters/generic';
import {JavaReleased} from '../../src/updaters/java/java-released';

const sandbox = sinon.createSandbox();

describe('Java', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'java-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    describe('for default component', () => {
      const COMMITS_NO_SNAPSHOT = [
        ...buildMockConventionalCommit('fix(deps): update dependency'),
        ...buildMockConventionalCommit('fix(deps): update dependency'),
        ...buildMockConventionalCommit('chore: update common templates'),
      ];
      const COMMITS_WITH_SNAPSHOT = [
        ...COMMITS_NO_SNAPSHOT,
        ...buildMockConventionalCommit('chore(main): release 2.3.4-SNAPSHOT'),
      ];

      it('returns release PR changes with defaultInitialVersion', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
        });

        const latestRelease = undefined;
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_WITH_SNAPSHOT,
          latestRelease,
          draft: false,
          labels: DEFAULT_LABELS,
        });

        expect(release?.version?.toString()).to.eql('0.0.1');
        expect(release?.title.toString()).to.eql('chore(main): release 0.0.1');
        expect(release?.headRefName).to.eql('release-please--branches--main');
        expect(release?.draft).to.eql(false);
        expect(release?.labels).to.eql(DEFAULT_LABELS);
        assertHasUpdate(release!.updates, 'CHANGELOG.md', Changelog);
      });

      it('returns release PR changes with semver patch bump', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.3')),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_WITH_SNAPSHOT,
          latestRelease,
          draft: false,
          labels: DEFAULT_LABELS,
        });

        expect(release?.version?.toString()).to.eql('2.3.4');
        expect(release?.title.toString()).to.eql('chore(main): release 2.3.4');
        expect(release?.headRefName).to.eql('release-please--branches--main');
        expect(release?.draft).to.eql(false);
        expect(release?.labels).to.eql(DEFAULT_LABELS);
        assertHasUpdate(release!.updates, 'CHANGELOG.md', Changelog);
      });

      it('returns a snapshot bump PR', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.3')),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_NO_SNAPSHOT,
          latestRelease,
          draft: false,
          labels: DEFAULT_LABELS,
        });

        expect(release?.version?.toString()).to.eql('2.3.4-SNAPSHOT');
        expect(release?.title.toString()).to.eql(
          'chore(main): release 2.3.4-SNAPSHOT'
        );
        expect(release?.headRefName).to.eql('release-please--branches--main');
        expect(release?.draft).to.eql(false);
        expect(release?.labels).to.eql(DEFAULT_SNAPSHOT_LABELS);
        assertNoHasUpdate(release!.updates, 'CHANGELOG.md');
      });

      it('skips a snapshot bump PR', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
          skipSnapshot: true,
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.3')),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_NO_SNAPSHOT,
          latestRelease,
          draft: false,
          labels: DEFAULT_LABELS,
        });

        expect(release?.version?.toString()).to.eql('2.3.4');
        expect(release?.title.toString()).to.eql('chore(main): release 2.3.4');
        expect(release?.headRefName).to.eql('release-please--branches--main');
        expect(release?.draft).to.eql(false);
        expect(release?.labels).to.eql(DEFAULT_LABELS);
        assertHasUpdate(release!.updates, 'CHANGELOG.md');
      });

      it('use snapshot latest release', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.4-SNAPSHOT')),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_NO_SNAPSHOT, // no snapshot in commits
          latestRelease,
        });

        expect(release?.version?.toString()).to.eql('2.3.4');
        assertHasUpdate(release!.updates, 'CHANGELOG.md', Changelog);
      });

      it('ignores snapshot of another component', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.3')),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: [
            ...buildMockConventionalCommit(
              'chore(main): release other 2.3.4-SNAPSHOT'
            ),
            ...COMMITS_NO_SNAPSHOT,
          ],
          latestRelease,
        });

        expect(release?.version?.toString()).to.eql('2.3.4-SNAPSHOT');
        expect(release?.title.toString()).to.eql(
          'chore(main): release 2.3.4-SNAPSHOT'
        );
        assertNoHasUpdate(release!.updates, 'CHANGELOG.md');
      });

      it('uses custom snapshotLabels', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
          snapshotLabels: ['bot', 'custom:snapshot'],
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.3')),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_NO_SNAPSHOT,
          latestRelease,
          draft: false,
          labels: ['custom:pending'],
        });

        expect(release?.labels).to.eql(['bot', 'custom:snapshot']);
      });

      it('creates draft snapshot PR', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.3')),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_NO_SNAPSHOT,
          latestRelease,
          draft: true,
        });

        expect(release?.draft).to.eql(true);
      });

      it('updates released version in extra files', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
          extraFiles: ['foo/bar.java', 'pom.xml'],
        });
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_NO_SNAPSHOT,
          latestRelease: undefined,
        });

        const updates = release!.updates;
        assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
        assertHasUpdates(updates, 'pom.xml', JavaReleased, Generic);
        assertHasUpdates(updates, 'foo/bar.java', JavaReleased, Generic);
      });

      it('does not update released version in extra files for snapshot', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
          extraFiles: ['foo/bar.java', 'pom.xml'],
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.3')),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_NO_SNAPSHOT,
          latestRelease,
        });

        const updates = release!.updates;
        assertNoHasUpdate(updates, 'CHANGELOG.md');
        assertHasUpdate(updates, 'foo/bar.java', Generic);
        assertHasUpdate(updates, 'pom.xml', Generic);
      });
    });

    describe('with includeComponentInTag', () => {
      const COMMITS_NO_SNAPSHOT = [
        ...buildMockConventionalCommit('fix(deps): update dependency'),
        ...buildMockConventionalCommit('fix(deps): update dependency'),
        ...buildMockConventionalCommit('chore: update common templates'),
        ...buildMockConventionalCommit(
          'chore(main): release other-sample 13.3.5'
        ),
      ];
      const COMMITS_WITH_SNAPSHOT = COMMITS_NO_SNAPSHOT.concat(
        ...buildMockConventionalCommit(
          'chore(main): release other-sample 13.3.6-SNAPSHOT'
        ),
        ...buildMockConventionalCommit(
          'chore(main): release test-sample 2.3.4-SNAPSHOT'
        )
      );

      it('returns release PR changes with defaultInitialVersion', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
          component: 'test-sample',
          includeComponentInTag: true,
        });

        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_WITH_SNAPSHOT,
          latestRelease: undefined,
          draft: false,
          labels: DEFAULT_LABELS,
        });

        expect(release?.version?.toString()).to.eql('0.0.1');
        expect(release?.title.toString()).to.eql(
          'chore(main): release test-sample 0.0.1'
        );
        expect(release?.headRefName).to.eql(
          'release-please--branches--main--components--test-sample'
        );
        expect(release?.draft).to.eql(false);
        expect(release?.labels).to.eql(DEFAULT_LABELS);
        assertHasUpdate(release!.updates, 'CHANGELOG.md', Changelog);
      });

      it('returns release PR changes with semver patch bump', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
          component: 'test-sample',
          includeComponentInTag: true,
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.3'), 'test-sample'),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_WITH_SNAPSHOT,
          latestRelease,
          draft: false,
          labels: DEFAULT_LABELS,
        });

        expect(release?.version?.toString()).to.eql('2.3.4');
        expect(release?.title.toString()).to.eql(
          'chore(main): release test-sample 2.3.4'
        );
        expect(release?.headRefName).to.eql(
          'release-please--branches--main--components--test-sample'
        );
        expect(release?.draft).to.eql(false);
        expect(release?.labels).to.eql(DEFAULT_LABELS);
        assertHasUpdate(release!.updates, 'CHANGELOG.md', Changelog);
      });

      it('returns a snapshot bump PR', async () => {
        const strategy = new Java({
          targetBranch: 'main',
          github,
          component: 'test-sample',
          includeComponentInTag: true,
        });

        const latestRelease = {
          tag: new TagName(Version.parse('2.3.3'), 'test-sample'),
          sha: 'abc123',
          notes: 'some notes',
        };
        const release = await strategy.buildReleasePullRequest({
          commits: COMMITS_NO_SNAPSHOT,
          latestRelease,
          draft: false,
          labels: DEFAULT_LABELS,
        });

        expect(release?.version?.toString()).to.eql('2.3.4-SNAPSHOT');
        expect(release?.title.toString()).to.eql(
          'chore(main): release test-sample 2.3.4-SNAPSHOT'
        );
        expect(release?.headRefName).to.eql(
          'release-please--branches--main--components--test-sample'
        );
        expect(release?.draft).to.eql(false);
        expect(release?.labels).to.eql(DEFAULT_SNAPSHOT_LABELS);
        assertNoHasUpdate(release!.updates, 'CHANGELOG.md');
      });
    });
  });
});
