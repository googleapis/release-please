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

import {Strategy, BuildReleaseOptions} from '../strategy';
import {GitHub} from '../github';
import {VersioningStrategy} from '../versioning-strategy';
import {Repository} from '../repository';
import {ChangelogNotes, ChangelogSection} from '../changelog-notes';
import {
  ROOT_PROJECT_PATH,
  MANIFEST_PULL_REQUEST_TITLE_PATTERN,
  ExtraFile,
} from '../manifest';
import {DefaultVersioningStrategy} from '../versioning-strategies/default';
import {DefaultChangelogNotes} from '../changelog-notes/default';
import {Update} from '../update';
import {ConventionalCommit, Commit} from '../commit';
import {Version, VersionsMap} from '../version';
import {TagName} from '../util/tag-name';
import {Release} from '../release';
import {ReleasePullRequest} from '../release-pull-request';
import {logger as defaultLogger, Logger} from '../util/logger';
import {PullRequestTitle} from '../util/pull-request-title';
import {BranchName} from '../util/branch-name';
import {PullRequestBody, ReleaseData} from '../util/pull-request-body';
import {PullRequest} from '../pull-request';
import {mergeUpdates} from '../updaters/composite';
import {Generic} from '../updaters/generic';
import {GenericJson} from '../updaters/generic-json';
import {GenericXml} from '../updaters/generic-xml';
import {PomXml} from '../updaters/java/pom-xml';
import {GenericYaml} from '../updaters/generic-yaml';
import {GenericToml} from '../updaters/generic-toml';

const DEFAULT_CHANGELOG_PATH = 'CHANGELOG.md';

export interface BuildUpdatesOptions {
  changelogEntry: string;
  commits?: ConventionalCommit[];
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
  changelogHost?: string;
  changelogSections?: ChangelogSection[];
  commitPartial?: string;
  headerPartial?: string;
  mainTemplate?: string;
  tagSeparator?: string;
  skipGitHubRelease?: boolean;
  releaseAs?: string;
  changelogNotes?: ChangelogNotes;
  includeComponentInTag?: boolean;
  includeVInTag?: boolean;
  pullRequestTitlePattern?: string;
  pullRequestHeader?: string;
  extraFiles?: ExtraFile[];
  versionFile?: string;
  snapshotLabels?: string[]; // Java-only
  skipSnapshot?: boolean; // Java-only
  logger?: Logger;
  initialVersion?: string;
  extraLabels?: string[];
}

/**
 * A strategy is responsible for determining which files are
 * necessary to update in a release pull request.
 */
export abstract class BaseStrategy implements Strategy {
  readonly path: string;
  protected github: GitHub;
  protected logger: Logger;
  protected component?: string;
  private packageName?: string;
  readonly versioningStrategy: VersioningStrategy;
  protected targetBranch: string;
  protected repository: Repository;
  protected changelogPath: string;
  protected changelogHost?: string;
  protected tagSeparator?: string;
  private skipGitHubRelease: boolean;
  private releaseAs?: string;
  protected includeComponentInTag: boolean;
  protected includeVInTag: boolean;
  protected initialVersion?: string;
  readonly pullRequestTitlePattern?: string;
  readonly pullRequestHeader?: string;
  readonly extraFiles: ExtraFile[];
  readonly extraLabels: string[];

  readonly changelogNotes: ChangelogNotes;

  // CHANGELOG configuration
  protected changelogSections?: ChangelogSection[];

  constructor(options: BaseStrategyOptions) {
    this.logger = options.logger ?? defaultLogger;
    this.path = options.path || ROOT_PROJECT_PATH;
    this.github = options.github;
    this.packageName = options.packageName;
    this.component =
      options.component || this.normalizeComponent(this.packageName);
    this.versioningStrategy =
      options.versioningStrategy ||
      new DefaultVersioningStrategy({logger: this.logger});
    this.targetBranch = options.targetBranch;
    this.repository = options.github.repository;
    this.changelogPath = options.changelogPath || DEFAULT_CHANGELOG_PATH;
    this.changelogHost = options.changelogHost;
    this.changelogSections = options.changelogSections;
    this.tagSeparator = options.tagSeparator;
    this.skipGitHubRelease = options.skipGitHubRelease || false;
    this.releaseAs = options.releaseAs;
    this.changelogNotes =
      options.changelogNotes || new DefaultChangelogNotes(options);
    this.includeComponentInTag = options.includeComponentInTag ?? true;
    this.includeVInTag = options.includeVInTag ?? true;
    this.pullRequestTitlePattern = options.pullRequestTitlePattern;
    this.pullRequestHeader = options.pullRequestHeader;
    this.extraFiles = options.extraFiles || [];
    this.initialVersion = options.initialVersion;
    this.extraLabels = options.extraLabels || [];
  }

  /**
   * Specify the files necessary to update in a release pull request.
   * @param {BuildUpdatesOptions} options
   */
  protected abstract buildUpdates(
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
    return this.normalizeComponent(
      this.packageName ?? (await this.getDefaultPackageName())
    );
  }

  async getBranchComponent(): Promise<string | undefined> {
    return this.component || (await this.getDefaultComponent());
  }

  async getPackageName(): Promise<string | undefined> {
    return this.packageName ?? (await this.getDefaultPackageName());
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    return this.packageName ?? '';
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
  protected async postProcessCommits(
    commits: ConventionalCommit[]
  ): Promise<ConventionalCommit[]> {
    return commits;
  }

  protected async buildReleaseNotes(
    conventionalCommits: ConventionalCommit[],
    newVersion: Version,
    newVersionTag: TagName,
    latestRelease?: Release,
    commits?: Commit[]
  ): Promise<string> {
    return await this.changelogNotes.buildNotes(conventionalCommits, {
      host: this.changelogHost,
      owner: this.repository.owner,
      repository: this.repository.repo,
      version: newVersion.toString(),
      previousTag: latestRelease?.tag?.toString(),
      currentTag: newVersionTag.toString(),
      targetBranch: this.targetBranch,
      changelogSections: this.changelogSections,
      commits: commits,
    });
  }

  protected async buildPullRequestBody(
    component: string | undefined,
    newVersion: Version,
    releaseNotesBody: string,
    _conventionalCommits: ConventionalCommit[],
    _latestRelease?: Release,
    pullRequestHeader?: string
  ): Promise<PullRequestBody> {
    return new PullRequestBody(
      [
        {
          component,
          version: newVersion,
          notes: releaseNotesBody,
        },
      ],
      {header: pullRequestHeader}
    );
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
    commits: ConventionalCommit[],
    latestRelease?: Release,
    draft?: boolean,
    labels: string[] = []
  ): Promise<ReleasePullRequest | undefined> {
    const conventionalCommits = await this.postProcessCommits(commits);
    this.logger.info(`Considering: ${conventionalCommits.length} commits`);
    if (conventionalCommits.length === 0) {
      this.logger.info(`No commits for path: ${this.path}, skipping`);
      return undefined;
    }

    const newVersion = await this.buildNewVersion(
      conventionalCommits,
      latestRelease
    );
    const versionsMap = await this.updateVersionsMap(
      await this.buildVersionsMap(conventionalCommits),
      conventionalCommits,
      newVersion
    );
    const component = await this.getComponent();
    this.logger.debug('component:', component);

    const newVersionTag = new TagName(
      newVersion,
      this.includeComponentInTag ? component : undefined,
      this.tagSeparator,
      this.includeVInTag
    );
    this.logger.debug(
      'pull request title pattern:',
      this.pullRequestTitlePattern
    );
    const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
      component || '',
      this.targetBranch,
      newVersion,
      this.pullRequestTitlePattern
    );
    const branchComponent = await this.getBranchComponent();
    const branchName = branchComponent
      ? BranchName.ofComponentTargetBranch(branchComponent, this.targetBranch)
      : BranchName.ofTargetBranch(this.targetBranch);
    const releaseNotesBody = await this.buildReleaseNotes(
      conventionalCommits,
      newVersion,
      newVersionTag,
      latestRelease,
      commits
    );
    if (this.changelogEmpty(releaseNotesBody)) {
      this.logger.info(
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
      commits: conventionalCommits,
    });
    const updatesWithExtras = mergeUpdates(
      updates.concat(...(await this.extraFileUpdates(newVersion, versionsMap)))
    );
    const pullRequestBody = await this.buildPullRequestBody(
      component,
      newVersion,
      releaseNotesBody,
      conventionalCommits,
      latestRelease,
      this.pullRequestHeader
    );

    return {
      title: pullRequestTitle,
      body: pullRequestBody,
      updates: updatesWithExtras,
      labels: [...labels, ...this.extraLabels],
      headRefName: branchName.toString(),
      version: newVersion,
      draft: draft ?? false,
    };
  }

  // Helper to convert extra files with globs to the file paths to add
  private async extraFilePaths(extraFile: ExtraFile): Promise<string[]> {
    if (typeof extraFile !== 'object') {
      return [extraFile];
    }

    if (!extraFile.glob) {
      return [extraFile.path];
    }

    if (extraFile.path.startsWith('/')) {
      // glob is relative to root, strip the leading `/` for glob matching
      // and re-add the leading `/` to make the file relative to the root
      return (
        await this.github.findFilesByGlobAndRef(
          extraFile.path.slice(1),
          this.targetBranch
        )
      ).map(file => `/${file}`);
    } else if (this.path === ROOT_PROJECT_PATH) {
      // root component, ignore path prefix
      return this.github.findFilesByGlobAndRef(
        extraFile.path,
        this.targetBranch
      );
    } else {
      // glob is relative to current path
      return this.github.findFilesByGlobAndRef(
        extraFile.path,
        this.targetBranch,
        this.path
      );
    }
  }

  protected async extraFileUpdates(
    version: Version,
    versionsMap: VersionsMap
  ): Promise<Update[]> {
    const extraFileUpdates: Update[] = [];
    for (const extraFile of this.extraFiles) {
      if (typeof extraFile === 'object') {
        const paths = await this.extraFilePaths(extraFile);
        for (const path of paths) {
          switch (extraFile.type) {
            case 'json':
              extraFileUpdates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new GenericJson(extraFile.jsonpath, version),
              });
              break;
            case 'yaml':
              extraFileUpdates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new GenericYaml(extraFile.jsonpath, version),
              });
              break;
            case 'toml':
              extraFileUpdates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new GenericToml(extraFile.jsonpath, version),
              });
              break;
            case 'xml':
              extraFileUpdates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new GenericXml(extraFile.xpath, version),
              });
              break;
            case 'pom':
              extraFileUpdates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new PomXml(version),
              });
              break;
            default:
              throw new Error(
                `unsupported extraFile type: ${
                  (extraFile as {type: string}).type
                }`
              );
          }
        }
      } else {
        extraFileUpdates.push({
          path: this.addPath(extraFile),
          createIfMissing: false,
          updater: new Generic({version, versionsMap}),
        });
      }
    }
    return extraFileUpdates;
  }

  protected changelogEmpty(changelogEntry: string): boolean {
    return changelogEntry.split('\n').length <= 1;
  }

  protected async updateVersionsMap(
    versionsMap: VersionsMap,
    conventionalCommits: ConventionalCommit[],
    _newVersion: Version
  ): Promise<VersionsMap> {
    for (const [component, version] of versionsMap.entries()) {
      versionsMap.set(
        component,
        await this.versioningStrategy.bump(version, conventionalCommits)
      );
    }
    return versionsMap;
  }

  protected async buildNewVersion(
    conventionalCommits: ConventionalCommit[],
    latestRelease?: Release
  ): Promise<Version> {
    if (this.releaseAs) {
      this.logger.warn(
        `Setting version for ${this.path} from release-as configuration`
      );
      return Version.parse(this.releaseAs);
    }

    const releaseAsCommit = conventionalCommits.find(conventionalCommit =>
      conventionalCommit.notes.find(note => note.title === 'RELEASE AS')
    );
    if (releaseAsCommit) {
      const note = releaseAsCommit.notes.find(
        note => note.title === 'RELEASE AS'
      );
      if (note) {
        return Version.parse(note.text);
      }
    }

    if (latestRelease) {
      return await this.versioningStrategy.bump(
        latestRelease.tag.version,
        conventionalCommits
      );
    }

    return this.initialReleaseVersion();
  }

  protected async buildVersionsMap(
    _conventionalCommits: ConventionalCommit[]
  ): Promise<VersionsMap> {
    return new Map();
  }

  protected async parsePullRequestBody(
    pullRequestBody: string
  ): Promise<PullRequestBody | undefined> {
    return PullRequestBody.parse(pullRequestBody, this.logger);
  }

  /**
   * Given a merged pull request, build the candidate release.
   * @param {PullRequest} mergedPullRequest The merged release pull request.
   * @returns {Release} The candidate release.
   * @deprecated Use buildReleases() instead.
   */
  async buildRelease(
    mergedPullRequest: PullRequest,
    options?: BuildReleaseOptions
  ): Promise<Release | undefined> {
    if (this.skipGitHubRelease) {
      this.logger.info('Release skipped from strategy config');
      return;
    }
    if (!mergedPullRequest.sha) {
      this.logger.error('Pull request should have been merged');
      return;
    }
    const mergedTitlePattern =
      options?.groupPullRequestTitlePattern ??
      MANIFEST_PULL_REQUEST_TITLE_PATTERN;

    const pullRequestTitle =
      PullRequestTitle.parse(
        mergedPullRequest.title,
        this.pullRequestTitlePattern,
        this.logger
      ) ||
      PullRequestTitle.parse(
        mergedPullRequest.title,
        mergedTitlePattern,
        this.logger
      );
    if (!pullRequestTitle) {
      this.logger.error(`Bad pull request title: '${mergedPullRequest.title}'`);
      return;
    }
    const branchName = BranchName.parse(
      mergedPullRequest.headBranchName,
      this.logger
    );
    if (!branchName) {
      this.logger.error(`Bad branch name: ${mergedPullRequest.headBranchName}`);
      return;
    }
    const pullRequestBody = await this.parsePullRequestBody(
      mergedPullRequest.body
    );
    if (!pullRequestBody) {
      this.logger.error('Could not parse pull request body as a release PR');
      return;
    }
    const component = await this.getComponent();
    let releaseData: ReleaseData | undefined;
    if (
      pullRequestBody.releaseData.length === 1 &&
      !pullRequestBody.releaseData[0].component
    ) {
      const branchComponent = await this.getBranchComponent();
      // standalone release PR, ensure the components match
      if (
        this.normalizeComponent(branchName.component) !==
        this.normalizeComponent(branchComponent)
      ) {
        this.logger.warn(
          `PR component: ${branchName.component} does not match configured component: ${branchComponent}`
        );
        return;
      }
      releaseData = pullRequestBody.releaseData[0];
    } else {
      // manifest release with multiple components - find the release notes
      // for the component to see if it was included in this release (parsed
      // from the release pull request body)
      releaseData = pullRequestBody.releaseData.find(datum => {
        return (
          this.normalizeComponent(datum.component) ===
          this.normalizeComponent(component)
        );
      });

      if (!releaseData && pullRequestBody.releaseData.length > 0) {
        this.logger.info(
          `Pull request contains releases, but not for component: ${component}`
        );
        return;
      }
    }

    const notes = releaseData?.notes;
    if (notes === undefined) {
      this.logger.warn('Failed to find release notes');
    }
    const version = pullRequestTitle.getVersion() || releaseData?.version;
    if (!version) {
      this.logger.error('Pull request should have included version');
      return;
    }

    if (!this.isPublishedVersion(version)) {
      this.logger.warn(`Skipping non-published version: ${version.toString()}`);
      return;
    }

    const tag = new TagName(
      version,
      this.includeComponentInTag ? component : undefined,
      this.tagSeparator,
      this.includeVInTag
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
   * Given a merged pull request, build the candidate releases.
   * @param {PullRequest} mergedPullRequest The merged release pull request.
   * @returns {Release} The candidate release.
   */
  async buildReleases(
    mergedPullRequest: PullRequest,
    options?: BuildReleaseOptions
  ): Promise<Release[]> {
    const release = await this.buildRelease(mergedPullRequest, options);
    if (release) {
      return [release];
    }
    return [];
  }

  isPublishedVersion(_version: Version): boolean {
    return true;
  }

  /**
   * Override this to handle the initial version of a new library.
   */
  protected initialReleaseVersion(): Version {
    if (this.initialVersion) {
      return Version.parse(this.initialVersion);
    }

    return Version.parse('1.0.0');
  }

  /**
   * Adds a given file path to the strategy path.
   * @param {string} file Desired file path.
   * @returns {string} The file relative to the strategy.
   * @throws {Error} If the file path contains relative pathing characters, i.e. ../, ~/
   */
  protected addPath(file: string) {
    // There is no strategy path to join, the strategy is at the root, or the
    // file is at the root (denoted by a leading slash or tilde)
    if (!this.path || this.path === ROOT_PROJECT_PATH || file.startsWith('/')) {
      file = file.replace(/^\/+/, '');
    }
    // Otherwise, the file is relative to the strategy path
    else {
      file = `${this.path.replace(/\/+$/, '')}/${file}`;
    }
    // Ensure the file path does not escape the workspace
    if (/((^|\/)\.{1,2}|^~|^\/*)+\//.test(file)) {
      throw new Error(`illegal pathing characters in path: ${file}`);
    }
    // Strip any trailing slashes and return
    return file.replace(/\/+$/, '');
  }
}
