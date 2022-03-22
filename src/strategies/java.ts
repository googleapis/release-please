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
import {Version, VersionsMap} from '../version';
import {BaseStrategy, BaseStrategyOptions, BuildUpdatesOptions} from './base';
import {Changelog} from '../updaters/changelog';
import {JavaSnapshot} from '../versioning-strategies/java-snapshot';
import {Commit, ConventionalCommit} from '../commit';
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
import {Generic} from '../updaters/generic';
import {PomXml} from '../updaters/java/pom-xml';
import {JavaReleased} from '../updaters/java/java-released';

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

export interface JavaBuildUpdatesOption extends BuildUpdatesOptions {
  isSnapshot?: boolean;
}

export class Java extends BaseStrategy {
  protected readonly snapshotVersioning: VersioningStrategy;
  protected readonly snapshotLabels: string[];

  constructor(options: BaseStrategyOptions) {
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
    const versionsMap = await this.updateSnapshotsVersionsMap(
      await this.buildVersionsMap([]),
      newVersion
    );
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
    return {
      title: pullRequestTitle,
      body: pullRequestBody,
      updates,
      labels: labels,
      headRefName: branchName.toString(),
      version: newVersion,
      draft: draft ?? false,
    };
  }

  /**
   * Override this method to post process commits
   * @param {ConventionalCommit[]} commits parsed commits
   * @returns {ConventionalCommit[]} modified commits
   */
  protected async postProcessCommits(
    commits: ConventionalCommit[]
  ): Promise<ConventionalCommit[]> {
    if (commits.length === 0) {
      // For Java commits, push a fake commit, so we force a
      // SNAPSHOT release
      commits.push({
        type: 'fake',
        bareMessage: 'fake commit',
        message: 'fake commit',
        breaking: false,
        scope: null,
        notes: [],
        files: [],
        references: [],
        sha: 'fake',
      });
    }
    return commits;
  }

  private static isSnapshot(version?: Version): boolean {
    return !!version?.preRelease && version.preRelease.indexOf('SNAPSHOT') >= 0;
  }

  protected async needsSnapshot(
    commits: Commit[],
    latestRelease?: Release
  ): Promise<boolean> {
    const version = latestRelease?.tag?.version;
    if (!version) {
      // Don't bump snapshots for first release ever
      return false;
    }

    // Found snapshot as a release, this is unexpected, but use it
    if (Java.isSnapshot(version)) {
      return false;
    }

    // Search commits for snapshot bump
    const snapshotCommits = commits
      .map(commit =>
        PullRequestTitle.parse(
          commit.pullRequest?.title || commit.message,
          this.pullRequestTitlePattern
        )
      )
      .map(pullRequest => pullRequest?.getVersion())
      .filter(Java.isSnapshot);
    return snapshotCommits.length === 0;
  }

  protected async updateVersionsMap(
    versionsMap: VersionsMap,
    conventionalCommits: ConventionalCommit[],
    newVersion: Version
  ): Promise<VersionsMap> {
    versionsMap = await super.updateVersionsMap(
      versionsMap,
      conventionalCommits,
      newVersion
    );
    return await this.addComponentVersion(versionsMap, newVersion);
  }

  protected async updateSnapshotsVersionsMap(
    versionsMap: VersionsMap,
    version: Version
  ) {
    for (const versionKey of versionsMap.keys()) {
      const version = versionsMap.get(versionKey);
      if (!version) {
        logger.warn(`didn't find version for ${versionKey}`);
        continue;
      }
      const newVersion = await this.snapshotVersioning.bump(version, []);
      versionsMap.set(versionKey, newVersion);
    }

    return await this.addComponentVersion(versionsMap, version);
  }

  protected async addComponentVersion(
    versionMap: VersionsMap,
    version: Version
  ): Promise<VersionsMap> {
    // Don't use this.getComponent(), because that depends on includeComponentInTag, and we want an actual name
    const component =
      this.component || (await this.getDefaultComponent()) || '';
    if (!versionMap.has(component)) {
      versionMap.set(component, version);
    }
    return versionMap;
  }

  isValidRelease(version: Version): boolean {
    return !version.preRelease || version.preRelease.indexOf('SNAPSHOT') < 0;
  }

  protected async buildUpdates(
    options: JavaBuildUpdatesOption
  ): Promise<Update[]> {
    const updates: Update[] = [];

    const pomFilesSearch = this.github.findFilesByFilenameAndRef(
      'pom.xml',
      this.targetBranch,
      this.path
    );
    const buildFilesSearch = this.github.findFilesByFilenameAndRef(
      'build.gradle',
      this.targetBranch,
      this.path
    );
    const dependenciesSearch = this.github.findFilesByFilenameAndRef(
      'dependencies.properties',
      this.targetBranch,
      this.path
    );

    const allFiles = await Promise.all([
      pomFilesSearch,
      buildFilesSearch,
      dependenciesSearch,
    ]).then(result => result.flat());
    allFiles.forEach(path => {
      this.buildFileUpdates(updates, path, options);
    });

    if (!options.isSnapshot) {
      this.extraFiles.forEach(extraFile => {
        if (typeof extraFile === 'object') {
          return;
        }
        // Note: Generic updater is added by base class
        updates.push({
          path: this.addPath(extraFile),
          createIfMissing: false,
          updater: new JavaReleased({
            version: options.newVersion,
            versionsMap: options.versionsMap,
          }),
        });
      });

      updates.push({
        path: this.addPath(this.changelogPath),
        createIfMissing: true,
        updater: new Changelog({
          version: options.newVersion,
          changelogEntry: options.changelogEntry,
        }),
      });
    }

    return updates;
  }

  protected buildFileUpdates(
    updates: Update[],
    path: string,
    options: JavaBuildUpdatesOption
  ) {
    if (path.match(/(^|\/|\\)pom.xml$/)) {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new PomXml(options.newVersion),
      });
    }

    updates.push({
      path: this.addPath(path),
      createIfMissing: false,
      updater: new Generic({
        version: options.newVersion,
        versionsMap: options.versionsMap,
      }),
    });

    if (!options.isSnapshot) {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new JavaReleased({
          version: options.newVersion,
          versionsMap: options.versionsMap,
        }),
      });
    }
  }
}
