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

import * as path from 'path';
import {Strategy} from '../strategy';
import {GitHub} from '../github';
import {VersioningStrategy} from '../versioning-strategy';
import {Repository} from '../repository';
import {ChangelogNotes, ChangelogSection} from '../changelog-notes';
import {
  ROOT_PROJECT_PATH,
  MANIFEST_PULL_REQUEST_TITLE_PATTERN,
} from '../manifest';
import {DefaultVersioningStrategy} from '../versioning-strategies/default';
import {DefaultChangelogNotes} from '../changelog-notes/default';
import {Update} from '../update';
import {ConventionalCommit, Commit, parseConventionalCommits} from '../commit';
import {Version, VersionsMap} from '../version';
import {TagName} from '../util/tag-name';
import {Release} from '../release';
import {ReleasePullRequest} from '../release-pull-request';
import {logger} from '../util/logger';
import {PullRequestTitle} from '../util/pull-request-title';
import {BranchName} from '../util/branch-name';
import {PullRequestBody} from '../util/pull-request-body';
import {PullRequest} from '../pull-request';
import {mergeUpdates} from '../updaters/composite';
import {Generic} from '../updaters/generic';

const DEFAULT_CHANGELOG_PATH = 'CHANGELOG.md';

export interface BuildUpdatesOptions {
  changelogEntry: string;
  newVersion: Version;
  versionsMap: VersionsMap;
  latestVersion?: Version;
}
export interface BaseStrategyOptions {
  path?: string;
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;
  github: GitHub;
  component?: string;
  packageName?: string;
  versioningStrategy?: VersioningStrategy;
  targetBranch: string;
  changelogPath?: string;
  changelogSections?: ChangelogSection[];
  commitPartial?: string;
  headerPartial?: string;
  mainTemplate?: string;
  tagSeparator?: string;
  skipGitHubRelease?: boolean;
  releaseAs?: string;
  changelogNotes?: ChangelogNotes;
  includeComponentInTag?: boolean;
  pullRequestTitlePattern?: string;
  extraFiles?: string[];
}

/**
 * A strategy is responsible for determining which files are
 * necessary to update in a release pull request.
 */
export abstract class BaseStrategy implements Strategy {
  readonly path: string;
  protected github: GitHub;
  protected component?: string;
  protected packageName?: string;
  readonly versioningStrategy: VersioningStrategy;
  protected targetBranch: string;
  protected repository: Repository;
  protected changelogPath: string;
  protected tagSeparator?: string;
  private skipGitHubRelease: boolean;
  private releaseAs?: string;
  private includeComponentInTag: boolean;
  private pullRequestTitlePattern?: string;
  readonly extraFiles: string[];

  readonly changelogNotes: ChangelogNotes;

  // CHANGELOG configuration
  protected changelogSections?: ChangelogSection[];

  constructor(options: BaseStrategyOptions) {
    this.path = options.path || ROOT_PROJECT_PATH;
    this.github = options.github;
    this.packageName = options.packageName;
    this.component =
      options.component || this.normalizeComponent(this.packageName);
    this.versioningStrategy =
      options.versioningStrategy || new DefaultVersioningStrategy({});
    this.targetBranch = options.targetBranch;
    this.repository = options.github.repository;
    this.changelogPath = options.changelogPath || DEFAULT_CHANGELOG_PATH;
    this.changelogSections = options.changelogSections;
    this.tagSeparator = options.tagSeparator;
    this.skipGitHubRelease = options.skipGitHubRelease || false;
    this.releaseAs = options.releaseAs;
    this.changelogNotes =
      options.changelogNotes || new DefaultChangelogNotes(options);
    this.includeComponentInTag = options.includeComponentInTag ?? true;
    this.pullRequestTitlePattern = options.pullRequestTitlePattern;
    this.extraFiles = options.extraFiles || [];
  }

  /**
   * Specify the files necessary to update in a release pull request.
   * @param {BuildUpdatesOptions} options
   */
  protected abstract async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]>;

  /**
   * Return the component for this strategy. This may be a computed field.
   * @returns {string}
   */
  async getComponent(): Promise<string | undefined> {
    if (!this.includeComponentInTag) {
      return '';
    }
    return this.component || (await this.getDefaultComponent());
  }

  async getDefaultComponent(): Promise<string | undefined> {
    return this.normalizeComponent(await this.getDefaultPackageName());
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    return '';
  }

  protected normalizeComponent(component: string | undefined): string {
    if (!component) {
      return '';
    }
    return component;
  }

  /**
   * Override this method to post process commits
   * @param {ConventionalCommit[]} commits parsed commits
   * @returns {ConventionalCommit[]} modified commits
   */
  protected postProcessCommits(
    commits: ConventionalCommit[]
  ): ConventionalCommit[] {
    return commits;
  }

  protected async buildReleaseNotes(
    conventionalCommits: ConventionalCommit[],
    newVersion: Version,
    newVersionTag: TagName,
    latestRelease?: Release
  ): Promise<string> {
    return await this.changelogNotes.buildNotes(conventionalCommits, {
      owner: this.repository.owner,
      repository: this.repository.repo,
      version: newVersion.toString(),
      previousTag: latestRelease?.tag?.toString(),
      currentTag: newVersionTag.toString(),
      targetBranch: this.targetBranch,
      changelogSections: this.changelogSections,
    });
  }

  /**
   * Builds a candidate release pull request
   * @param {Commit[]} commits Raw commits to consider for this release.
   * @param {Release} latestRelease Optional. The last release for this
   *   component if available.
   * @param {boolean} draft Optional. Whether or not to create the pull
   *   request as a draft. Defaults to `false`.
   * @returns {ReleasePullRequest | undefined} The release pull request to
   *   open for this path/component. Returns undefined if we should not
   *   open a pull request.
   */
  async buildReleasePullRequest(
    commits: Commit[],
    latestRelease?: Release,
    draft?: boolean,
    labels: string[] = []
  ): Promise<ReleasePullRequest | undefined> {
    const conventionalCommits = this.postProcessCommits(
      parseConventionalCommits(commits)
    );

    const newVersion = await this.buildNewVersion(
      conventionalCommits,
      latestRelease
    );
    const versionsMap = await this.updateVersionsMap(
      await this.buildVersionsMap(conventionalCommits),
      conventionalCommits
    );
    const component = await this.getComponent();
    logger.debug('component:', component);

    const newVersionTag = new TagName(
      newVersion,
      this.includeComponentInTag ? component : undefined,
      this.tagSeparator
    );
    logger.warn('pull request title pattern:', this.pullRequestTitlePattern);
    const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
      component || '',
      this.targetBranch,
      newVersion,
      this.pullRequestTitlePattern
    );
    const branchName = component
      ? BranchName.ofComponentTargetBranch(component, this.targetBranch)
      : BranchName.ofTargetBranch(this.targetBranch);
    const releaseNotesBody = await this.buildReleaseNotes(
      conventionalCommits,
      newVersion,
      newVersionTag,
      latestRelease
    );
    if (this.changelogEmpty(releaseNotesBody)) {
      logger.info(
        `No user facing commits found since ${
          latestRelease ? latestRelease.sha : 'beginning of time'
        } - skipping`
      );
      return undefined;
    }
    const updates = await this.buildUpdates({
      changelogEntry: releaseNotesBody,
      newVersion,
      versionsMap,
      latestVersion: latestRelease?.tag.version,
    });
    const updatesWithExtras = mergeUpdates(
      updates.concat(...this.extraFileUpdates(newVersion))
    );
    const pullRequestBody = new PullRequestBody([
      {
        component,
        version: newVersion,
        notes: releaseNotesBody,
      },
    ]);

    return {
      title: pullRequestTitle,
      body: pullRequestBody,
      updates: updatesWithExtras,
      labels,
      headRefName: branchName.toString(),
      version: newVersion,
      draft: draft ?? false,
    };
  }

  private extraFileUpdates(version: Version): Update[] {
    const genericUpdater = new Generic({version});
    return this.extraFiles.map(path => ({
      path: this.addPath(path),
      createIfMissing: false,
      updater: genericUpdater,
    }));
  }

  protected changelogEmpty(changelogEntry: string): boolean {
    return changelogEntry.split('\n').length <= 1;
  }

  protected async updateVersionsMap(
    versionsMap: VersionsMap,
    conventionalCommits: ConventionalCommit[]
  ): Promise<VersionsMap> {
    for (const versionKey of versionsMap.keys()) {
      const version = versionsMap.get(versionKey);
      if (!version) {
        logger.warn(`didn't find version for ${versionKey}`);
        continue;
      }
      const newVersion = await this.versioningStrategy.bump(
        version,
        conventionalCommits
      );
      versionsMap.set(versionKey, newVersion);
    }
    return versionsMap;
  }

  protected async buildNewVersion(
    conventionalCommits: ConventionalCommit[],
    latestRelease?: Release
  ): Promise<Version> {
    if (this.releaseAs) {
      logger.warn(
        `Setting version for ${this.path} from release-as configuration`
      );
      return Version.parse(this.releaseAs);
    } else if (latestRelease) {
      return await this.versioningStrategy.bump(
        latestRelease.tag.version,
        conventionalCommits
      );
    } else {
      return this.initialReleaseVersion();
    }
  }

  protected async buildVersionsMap(
    _conventionalCommits: ConventionalCommit[]
  ): Promise<VersionsMap> {
    return new Map();
  }

  /**
   * Given a merged pull request, build the candidate release.
   * @param {PullRequest} mergedPullRequest The merged release pull request.
   * @returns {Release} The candidate release.
   */
  async buildRelease(
    mergedPullRequest: PullRequest
  ): Promise<Release | undefined> {
    if (this.skipGitHubRelease) {
      logger.info('Release skipped from strategy config');
      return;
    }
    if (!mergedPullRequest.sha) {
      logger.error('Pull request should have been merged');
      return;
    }

    const pullRequestTitle =
      PullRequestTitle.parse(
        mergedPullRequest.title,
        this.pullRequestTitlePattern
      ) ||
      PullRequestTitle.parse(
        mergedPullRequest.title,
        MANIFEST_PULL_REQUEST_TITLE_PATTERN
      );
    if (!pullRequestTitle) {
      logger.error(`Bad pull request title: '${mergedPullRequest.title}'`);
      return;
    }
    const branchName = BranchName.parse(mergedPullRequest.headBranchName);
    if (!branchName) {
      logger.error(`Bad branch name: ${mergedPullRequest.headBranchName}`);
      return;
    }
    const pullRequestBody = PullRequestBody.parse(mergedPullRequest.body);
    if (!pullRequestBody) {
      logger.error('Could not parse pull request body as a release PR');
      return;
    }
    const component = await this.getComponent();
    logger.info('component:', component);
    const releaseData =
      pullRequestBody.releaseData.length === 1 &&
      !pullRequestBody.releaseData[0].component
        ? pullRequestBody.releaseData[0]
        : pullRequestBody.releaseData.find(releaseData => {
            return (
              this.normalizeComponent(releaseData.component) ===
              this.normalizeComponent(component)
            );
          });
    const notes = releaseData?.notes;
    if (notes === undefined) {
      logger.warn('Failed to find release notes');
    }
    const version = pullRequestTitle.getVersion() || releaseData?.version;
    if (!version) {
      logger.error('Pull request should have included version');
      return;
    }

    const tag = new TagName(
      version,
      this.includeComponentInTag ? component : undefined,
      this.tagSeparator
    );
    const releaseName =
      component && this.includeComponentInTag
        ? `${component}: v${version.toString()}`
        : `v${version.toString()}`;
    return {
      name: releaseName,
      tag,
      notes: notes || '',
      sha: mergedPullRequest.sha,
    };
  }

  /**
   * Override this to handle the initial version of a new library.
   */
  protected initialReleaseVersion(): Version {
    return Version.parse('1.0.0');
  }

  /**
   * Adds a given file path to the strategy path.
   * @param {string} file Desired file path.
   * @returns {string} The file relative to the strategy.
   */
  protected addPath(file: string) {
    return this.path && this.path !== ROOT_PROJECT_PATH
      ? path.join(this.path, file)
      : file;
  }
}
