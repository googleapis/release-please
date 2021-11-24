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

import {ReleasePullRequest} from './release-pull-request';
import {Release} from './release';
import {GitHub} from './github';
import {Version, VersionsMap} from './version';
import {parseConventionalCommits, Commit, ConventionalCommit} from './commit';
import {VersioningStrategy} from './versioning-strategy';
import {DefaultVersioningStrategy} from './versioning-strategies/default';
import {PullRequestTitle} from './util/pull-request-title';
import {ChangelogNotes, ChangelogSection} from './changelog-notes';
import {Update} from './update';
import {Repository} from './repository';
import {PullRequest} from './pull-request';
import {BranchName} from './util/branch-name';
import {TagName} from './util/tag-name';
import {logger} from './util/logger';
import {
  MANIFEST_PULL_REQUEST_TITLE_PATTERN,
  ROOT_PROJECT_PATH,
} from './manifest';
import {PullRequestBody} from './util/pull-request-body';
import {DefaultChangelogNotes} from './changelog-notes/default';

const DEFAULT_CHANGELOG_PATH = 'CHANGELOG.md';

export interface BuildUpdatesOptions {
  changelogEntry: string;
  newVersion: Version;
  versionsMap: VersionsMap;
  latestVersion?: Version;
}
export interface StrategyOptions {
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
}

/**
 * A strategy is responsible for determining which files are
 * necessary to update in a release pull request.
 */
export abstract class Strategy {
  readonly path: string;
  protected github: GitHub;
  readonly component?: string;
  protected packageName?: string;
  readonly versioningStrategy: VersioningStrategy;
  protected targetBranch: string;
  protected repository: Repository;
  readonly changelogPath: string;
  protected tagSeparator?: string;
  private skipGitHubRelease: boolean;
  private releaseAs?: string;

  protected changelogNotes: ChangelogNotes;

  // CHANGELOG configuration
  protected changelogSections?: ChangelogSection[];

  constructor(options: StrategyOptions) {
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
  }

  /**
   * Specify the files necessary to update in a release pull request.
   * @param {BuildUpdatesOptions} options
   */
  protected abstract async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]>;

  async getComponent(): Promise<string | undefined> {
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
    const versionsMap = await this.buildVersionsMap(conventionalCommits);
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
    const component = await this.getComponent();
    logger.debug('component:', component);

    const newVersionTag = new TagName(newVersion, component);
    const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
      component || '',
      this.targetBranch,
      newVersion
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
      updates,
      labels,
      headRefName: branchName.toString(),
      version: newVersion,
      draft: draft ?? false,
    };
  }

  protected changelogEmpty(changelogEntry: string): boolean {
    return changelogEntry.split('\n').length <= 1;
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
      return undefined;
    }

    const pullRequestTitle =
      PullRequestTitle.parse(mergedPullRequest.title) ||
      PullRequestTitle.parse(
        mergedPullRequest.title,
        MANIFEST_PULL_REQUEST_TITLE_PATTERN
      );
    if (!pullRequestTitle) {
      throw new Error(`Bad pull request title: '${mergedPullRequest.title}'`);
    }
    const branchName = BranchName.parse(mergedPullRequest.headBranchName);
    if (!branchName) {
      throw new Error(`Bad branch name: ${mergedPullRequest.headBranchName}`);
    }
    if (!mergedPullRequest.sha) {
      throw new Error('Pull request should have been merged');
    }
    const pullRequestBody = PullRequestBody.parse(mergedPullRequest.body);
    if (!pullRequestBody) {
      throw new Error('could not parse pull request body as a release PR');
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
      throw new Error('Pull request should have included version');
    }

    return {
      tag: new TagName(version, component, this.tagSeparator),
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

  protected addPath(file: string) {
    if (this.path === ROOT_PROJECT_PATH) {
      return file;
    }
    file = file.replace(/^[/\\]/, '');
    if (this.path === undefined) {
      return file;
    } else {
      const path = this.path.replace(/[/\\]$/, '');
      return `${path}/${file}`;
    }
  }
}
