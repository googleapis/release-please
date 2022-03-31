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

import {Update} from '../update';
import {Version} from '../version';
import {BaseStrategy, BaseStrategyOptions, BuildUpdatesOptions} from './base';
import {Changelog} from '../updaters/changelog';
import {JavaSnapshot} from '../versioning-strategies/java-snapshot';
import {Commit} from '../commit';
import {Release} from '../release';
import {ReleasePullRequest} from '../release-pull-request';
import {logger} from '../util/logger';
import {PullRequestTitle} from '../util/pull-request-title';
import {BranchName} from '../util/branch-name';
import {PullRequestBody} from '../util/pull-request-body';
import {VersioningStrategy} from '../versioning-strategy';
import {DefaultVersioningStrategy} from '../versioning-strategies/default';
import {JavaAddSnapshot} from '../versioning-strategies/java-add-snapshot';
import {DEFAULT_SNAPSHOT_LABELS} from '../manifest';
import {JavaReleased} from '../updaters/java/java-released';
import {mergeUpdates} from '../updaters/composite';

const CHANGELOG_SECTIONS = [
  {type: 'feat', section: 'Features'},
  {type: 'fix', section: 'Bug Fixes'},
  {type: 'perf', section: 'Performance Improvements'},
  {type: 'deps', section: 'Dependencies'},
  {type: 'revert', section: 'Reverts'},
  {type: 'docs', section: 'Documentation'},
  {type: 'style', section: 'Styles', hidden: true},
  {type: 'chore', section: 'Miscellaneous Chores', hidden: true},
  {type: 'refactor', section: 'Code Refactoring', hidden: true},
  {type: 'test', section: 'Tests', hidden: true},
  {type: 'build', section: 'Build System', hidden: true},
  {type: 'ci', section: 'Continuous Integration', hidden: true},
];

export interface JavaStrategyOptions extends BaseStrategyOptions {
  snapshotLabels?: string[];
}

export interface JavaBuildUpdatesOption extends BuildUpdatesOptions {
  isSnapshot?: boolean;
}

/**
 * A strategy that generates SNAPSHOT version after each release, which is standard especially in Maven projects.
 *
 * This is universal strategy that does not update any files on its own. Use maven strategy for Maven projects.
 */
export class Java extends BaseStrategy {
  protected readonly snapshotVersioning: VersioningStrategy;
  protected readonly snapshotLabels: string[];

  constructor(options: JavaStrategyOptions) {
    options.changelogSections = options.changelogSections ?? CHANGELOG_SECTIONS;
    // wrap the configured versioning strategy with snapshotting
    const parentVersioningStrategy =
      options.versioningStrategy || new DefaultVersioningStrategy();
    options.versioningStrategy = new JavaSnapshot(parentVersioningStrategy);
    super(options);
    this.snapshotVersioning = new JavaAddSnapshot(parentVersioningStrategy);
    this.snapshotLabels = options.snapshotLabels || DEFAULT_SNAPSHOT_LABELS;
  }

  async buildReleasePullRequest(
    commits: Commit[],
    latestRelease?: Release,
    draft?: boolean,
    labels: string[] = []
  ): Promise<ReleasePullRequest | undefined> {
    if (await this.needsSnapshot(commits, latestRelease)) {
      logger.info('Repository needs a snapshot bump.');
      return await this.buildSnapshotPullRequest(
        latestRelease,
        draft,
        this.snapshotLabels
      );
    }
    logger.info('No Java snapshot needed');
    return await super.buildReleasePullRequest(
      commits,
      latestRelease,
      draft,
      labels
    );
  }

  protected async buildSnapshotPullRequest(
    latestRelease?: Release,
    draft?: boolean,
    labels: string[] = []
  ): Promise<ReleasePullRequest> {
    const component = await this.getComponent();
    const newVersion = latestRelease
      ? await this.snapshotVersioning.bump(latestRelease.tag.version, [])
      : this.initialReleaseVersion();
    const versionsMap = await this.buildVersionsMap([]);
    const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
      component || '',
      this.targetBranch,
      newVersion
    );
    const branchName = component
      ? BranchName.ofComponentTargetBranch(component, this.targetBranch)
      : BranchName.ofTargetBranch(this.targetBranch);
    const notes =
      '### Updating meta-information for bleeding-edge SNAPSHOT release.';
    const pullRequestBody = new PullRequestBody([
      {
        component,
        version: newVersion,
        notes,
      },
    ]);
    const updates = await this.buildUpdates({
      newVersion,
      versionsMap,
      changelogEntry: notes,
      isSnapshot: true,
    });
    const updatesWithExtras = mergeUpdates(
      updates.concat(...this.extraFileUpdates(newVersion, versionsMap))
    );
    return {
      title: pullRequestTitle,
      body: pullRequestBody,
      updates: updatesWithExtras,
      labels: labels,
      headRefName: branchName.toString(),
      version: newVersion,
      draft: draft ?? false,
    };
  }

  isPublishedVersion(version: Version): boolean {
    return !version.preRelease || version.preRelease.indexOf('SNAPSHOT') < 0;
  }

  protected async needsSnapshot(
    commits: Commit[],
    latestRelease?: Release
  ): Promise<boolean> {
    const component = await this.getComponent();
    logger.debug('component:', component);

    const version = latestRelease?.tag?.version;
    if (!version) {
      // Don't bump snapshots for the first release ever
      return false;
    }

    // Found snapshot as a release, this is unexpected, but use it
    if (!this.isPublishedVersion(version)) {
      return false;
    }

    // Search commits for snapshot bump
    const pullRequests = commits
      .map(commit =>
        PullRequestTitle.parse(
          commit.pullRequest?.title || commit.message,
          this.pullRequestTitlePattern
        )
      )
      .filter(pullRequest => pullRequest);

    const snapshotCommits = pullRequests
      .filter(pullRequest => (pullRequest?.component || '') === component)
      .map(pullRequest => pullRequest?.getVersion())
      .filter(version => version && !this.isPublishedVersion(version));
    return snapshotCommits.length === 0;
  }

  protected async buildUpdates(
    options: JavaBuildUpdatesOption
  ): Promise<Update[]> {
    const version = options.newVersion;
    const versionsMap = options.versionsMap;

    const updates: Update[] = [];

    if (!options.isSnapshot) {
      // Append java-specific updater for extraFiles
      this.extraFiles.forEach(extraFile => {
        if (typeof extraFile === 'string') {
          updates.push({
            path: this.addPath(extraFile),
            createIfMissing: false,
            updater: new JavaReleased({version, versionsMap}),
          });
        }
      });

      // Update changelog
      updates.push({
        path: this.addPath(this.changelogPath),
        createIfMissing: true,
        updater: new Changelog({
          version,
          changelogEntry: options.changelogEntry,
        }),
      });
    }

    return updates;
  }
}
