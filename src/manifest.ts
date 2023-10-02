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

import {ChangelogSection} from './changelog-notes';
import {GitHub, GitHubRelease, GitHubTag, MergeMethod} from './github';
import {Version, VersionsMap} from './version';
import {Commit, parseConventionalCommits} from './commit';
import {PullRequest} from './pull-request';
import {logger as defaultLogger, Logger} from './util/logger';
import {CommitSplit} from './util/commit-split';
import {TagName} from './util/tag-name';
import {Repository} from './repository';
import {BranchName} from './util/branch-name';
import {PullRequestTitle} from './util/pull-request-title';
import {ReleasePullRequest} from './release-pull-request';
import {
  buildStrategy,
  ReleaseType,
  VersioningStrategyType,
  buildPlugin,
  ChangelogNotesType,
} from './factory';
import {Release} from './release';
import {Strategy} from './strategy';
import {Merge} from './plugins/merge';
import {ReleasePleaseManifest} from './updaters/release-please-manifest';
import {
  DuplicateReleaseError,
  FileNotFoundError,
  ConfigurationError,
  isOctokitRequestError,
  isOctokitGraphqlResponseError,
  AggregateError,
} from './errors';
import {ManifestPlugin} from './plugin';
import {
  PullRequestOverflowHandler,
  FilePullRequestOverflowHandler,
} from './util/pull-request-overflow-handler';
import {signoffCommitMessage} from './util/signoff-commit-message';
import {CommitExclude} from './util/commit-exclude';
import {setupLogger} from 'code-suggester/build/src/logger';

type ExtraJsonFile = {
  type: 'json';
  path: string;
  jsonpath: string;
  glob?: boolean;
};
type ExtraYamlFile = {
  type: 'yaml';
  path: string;
  jsonpath: string;
  glob?: boolean;
};
type ExtraXmlFile = {
  type: 'xml';
  path: string;
  xpath: string;
  glob?: boolean;
};
type ExtraPomFile = {
  type: 'pom';
  path: string;
  glob?: boolean;
};
type ExtraTomlFile = {
  type: 'toml';
  path: string;
  jsonpath: string;
  glob?: boolean;
};
export type ExtraFile =
  | string
  | ExtraJsonFile
  | ExtraYamlFile
  | ExtraXmlFile
  | ExtraPomFile
  | ExtraTomlFile;
/**
 * These are configurations provided to each strategy per-path.
 */
export interface ReleaserConfig {
  releaseType: ReleaseType;

  // Versioning config
  versioning?: VersioningStrategyType;
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;

  // Strategy options
  releaseAs?: string;
  skipGithubRelease?: boolean; // Note this should be renamed to skipGitHubRelease in next major release
  draft?: boolean;
  prerelease?: boolean;
  draftPullRequest?: boolean;
  component?: string;
  packageName?: string;
  includeComponentInTag?: boolean;
  includeVInTag?: boolean;
  pullRequestTitlePattern?: string;
  pullRequestHeader?: string;
  tagSeparator?: string;
  separatePullRequests?: boolean;
  labels?: string[];
  releaseLabels?: string[];
  prereleaseLabels?: string[];
  extraLabels?: string[];
  initialVersion?: string;

  // Changelog options
  changelogSections?: ChangelogSection[];
  changelogPath?: string;
  changelogType?: ChangelogNotesType;
  changelogHost?: string;

  // Ruby-only
  versionFile?: string;
  // Java-only
  extraFiles?: ExtraFile[];
  snapshotLabels?: string[];
  skipSnapshot?: boolean;
  // Manifest only
  excludePaths?: string[];
  reviewers?: string[];
}

export interface CandidateReleasePullRequest {
  path: string;
  pullRequest: ReleasePullRequest;
  config: ReleaserConfig;
}

export interface CandidateRelease extends Release {
  pullRequest: PullRequest;
  path: string;
  draft?: boolean;
  prerelease?: boolean;
}

interface ReleaserConfigJson {
  'release-type'?: ReleaseType;
  versioning?: VersioningStrategyType;
  'bump-minor-pre-major'?: boolean;
  'bump-patch-for-minor-pre-major'?: boolean;
  'changelog-sections'?: ChangelogSection[];
  'release-as'?: string;
  'skip-github-release'?: boolean;
  draft?: boolean;
  prerelease?: boolean;
  'draft-pull-request'?: boolean;
  label?: string;
  'release-label'?: string;
  'prerelease-label'?: string;
  'extra-label'?: string;
  'include-component-in-tag'?: boolean;
  'include-v-in-tag'?: boolean;
  'changelog-type'?: ChangelogNotesType;
  'changelog-host'?: string;
  'pull-request-title-pattern'?: string;
  'pull-request-header'?: string;
  'separate-pull-requests'?: boolean;
  'tag-separator'?: string;
  'extra-files'?: ExtraFile[];
  'version-file'?: string;
  'snapshot-label'?: string; // Java-only
  'skip-snapshot'?: boolean; // Java-only
  'initial-version'?: string;
  'exclude-paths'?: string[]; // manifest-only
  reviewers?: string[];
}

export interface ManifestOptions {
  bootstrapSha?: string;
  lastReleaseSha?: string;
  alwaysLinkLocal?: boolean;
  separatePullRequests?: boolean;
  plugins?: PluginType[];
  fork?: boolean;
  reviewers?: string[];
  autoMerge?: AutoMergeOption;
  signoff?: string;
  manifestPath?: string;
  labels?: string[];
  releaseLabels?: string[];
  prereleaseLabels?: string[];
  snapshotLabels?: string[];
  skipLabeling?: boolean;
  sequentialCalls?: boolean;
  draft?: boolean;
  prerelease?: boolean;
  draftPullRequest?: boolean;
  groupPullRequestTitlePattern?: string;
  releaseSearchDepth?: number;
  commitSearchDepth?: number;
  logger?: Logger;
  changesBranch?: string;
}

export interface ReleaserPackageConfig extends ReleaserConfigJson {
  'package-name'?: string;
  component?: string;
  'changelog-path'?: string;
}

export type DirectPluginType = string;
export interface ConfigurablePluginType {
  type: string;
}
export interface LinkedVersionPluginConfig extends ConfigurablePluginType {
  type: 'linked-versions';
  groupName: string;
  components: string[];
  merge?: boolean;
}
export interface SentenceCasePluginConfig extends ConfigurablePluginType {
  specialWords?: string[];
}
export interface WorkspacePluginConfig extends ConfigurablePluginType {
  merge?: boolean;
  considerAllArtifacts?: boolean;
}
export interface GroupPriorityPluginConfig extends ConfigurablePluginType {
  groups: string[];
}
export type PluginType =
  | DirectPluginType
  | ConfigurablePluginType
  | GroupPriorityPluginConfig
  | LinkedVersionPluginConfig
  | SentenceCasePluginConfig
  | WorkspacePluginConfig;

/**
 * This is the schema of the manifest config json
 */
export interface ManifestConfig extends ReleaserConfigJson {
  packages: Record<string, ReleaserPackageConfig>;
  'bootstrap-sha'?: string;
  'last-release-sha'?: string;
  'always-link-local'?: boolean;
  plugins?: PluginType[];
  'group-pull-request-title-pattern'?: string;
  'release-search-depth'?: number;
  'commit-search-depth'?: number;
  'sequential-calls'?: boolean;
}
// path => version
export type ReleasedVersions = Record<string, Version>;
// path => config
export type RepositoryConfig = Record<string, ReleaserConfig>;

export const DEFAULT_RELEASE_PLEASE_CONFIG = 'release-please-config.json';
export const DEFAULT_RELEASE_PLEASE_MANIFEST = '.release-please-manifest.json';
export const ROOT_PROJECT_PATH = '.';
export const DEFAULT_COMPONENT_NAME = '';
export const DEFAULT_LABELS = ['autorelease: pending'];
export const DEFAULT_RELEASE_LABELS = ['autorelease: tagged'];
export const DEFAULT_SNAPSHOT_LABELS = ['autorelease: snapshot'];
export const SNOOZE_LABEL = 'autorelease: snooze';
export const DEFAULT_PRERELEASE_LABELS = ['autorelease: pre-release'];
export const DEFAULT_CUSTOM_VERSION_LABEL = 'autorelease: custom version';
const DEFAULT_RELEASE_SEARCH_DEPTH = 400;
const DEFAULT_COMMIT_SEARCH_DEPTH = 500;

export const MANIFEST_PULL_REQUEST_TITLE_PATTERN = 'chore: release ${branch}';

export interface CreatedRelease extends GitHubRelease {
  id: number;
  path: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
}

/**
 * Option to control when to auto-merge release PRs. If no filter have been provided, never auto-merge. If both
 * conventionalCommitFilter and versionBumpFilter are provided we take the intersection (AND operation).
 */
export type AutoMergeOption = {
  mergeMethod: MergeMethod;
  /**
   * Only auto merge if all conventional commits of the PR match the filter
   */
  conventionalCommitFilter?: {type: string; scope?: string}[];
  /**
   * Only auto merge if the version bump match the filter
   */
  versionBumpFilter?: ('major' | 'minor' | 'patch' | 'build')[];
};

export class Manifest {
  private repository: Repository;
  private github: GitHub;
  readonly repositoryConfig: RepositoryConfig;
  readonly releasedVersions: ReleasedVersions;
  private targetBranch: string;
  readonly changesBranch: string;
  private separatePullRequests: boolean;
  readonly fork: boolean;
  private reviewers: string[];
  private autoMerge?: AutoMergeOption;
  private signoffUser?: string;
  private labels: string[];
  private skipLabeling?: boolean;
  private sequentialCalls?: boolean;
  private releaseLabels: string[];
  private prereleaseLabels: string[];
  private snapshotLabels: string[];
  readonly plugins: ManifestPlugin[];
  private _strategiesByPath?: Record<string, Strategy>;
  private _pathsByComponent?: Record<string, string>;
  private manifestPath: string;
  private bootstrapSha?: string;
  private lastReleaseSha?: string;
  private draft?: boolean;
  private prerelease?: boolean;
  private draftPullRequest?: boolean;
  private groupPullRequestTitlePattern?: string;
  readonly releaseSearchDepth: number;
  readonly commitSearchDepth: number;
  readonly logger: Logger;
  private pullRequestOverflowHandler: PullRequestOverflowHandler;

  /**
   * Create a Manifest from explicit config in code. This assumes that the
   * repository has a single component at the root path.
   *
   * @param {GitHub} github GitHub client
   * @param {string} targetBranch The releaseable base branch
   * @param {RepositoryConfig} repositoryConfig Parsed configuration of path => release configuration
   * @param {ReleasedVersions} releasedVersions Parsed versions of path => latest release version
   * @param {ManifestOptions} manifestOptions Optional. Manifest options
   * @param {string} manifestOptions.bootstrapSha If provided, use this SHA
   *   as the point to consider commits after
   * @param {boolean} manifestOptions.alwaysLinkLocal Option for the node-workspace
   *   plugin
   * @param {boolean} manifestOptions.separatePullRequests If true, create separate pull
   *   requests instead of a single manifest release pull request
   * @param {PluginType[]} manifestOptions.plugins Any plugins to use for this repository
   * @param {boolean} manifestOptions.fork If true, create pull requests from a fork. Defaults
   *   to `false`
   * @param {string} manifestOptions.signoff Add a Signed-off-by annotation to the commit
   * @param {string} manifestOptions.manifestPath Path to the versions manifest
   * @param {string[]} manifestOptions.labels Labels that denote a pending, untagged release
   *   pull request. Defaults to `[autorelease: pending]`
   * @param {string[]} manifestOptions.releaseLabels Labels to apply to a tagged release
   *   pull request. Defaults to `[autorelease: tagged]`
   * @param {string[]} manifestOptions.prereleaseLabels Labels that denote a pre-release pull request.
   *   Defaults to `[autorelease: pre-release]`
   */
  constructor(
    github: GitHub,
    targetBranch: string,
    repositoryConfig: RepositoryConfig,
    releasedVersions: ReleasedVersions,
    manifestOptions?: ManifestOptions
  ) {
    this.repository = github.repository;
    this.github = github;
    this.targetBranch = targetBranch;
    this.changesBranch = manifestOptions?.changesBranch || this.targetBranch;
    this.repositoryConfig = repositoryConfig;
    this.releasedVersions = releasedVersions;
    this.manifestPath =
      manifestOptions?.manifestPath || DEFAULT_RELEASE_PLEASE_MANIFEST;
    this.separatePullRequests =
      manifestOptions?.separatePullRequests ??
      Object.keys(repositoryConfig).length === 1;
    this.fork = manifestOptions?.fork || false;
    this.reviewers = manifestOptions?.reviewers ?? [];
    this.autoMerge = manifestOptions?.autoMerge;
    this.signoffUser = manifestOptions?.signoff;
    this.releaseLabels =
      manifestOptions?.releaseLabels || DEFAULT_RELEASE_LABELS;
    this.prereleaseLabels =
      manifestOptions?.prereleaseLabels || DEFAULT_PRERELEASE_LABELS;
    this.labels = manifestOptions?.labels || DEFAULT_LABELS;
    this.skipLabeling = manifestOptions?.skipLabeling || false;
    this.sequentialCalls = manifestOptions?.sequentialCalls || false;
    this.snapshotLabels =
      manifestOptions?.snapshotLabels || DEFAULT_SNAPSHOT_LABELS;
    this.bootstrapSha = manifestOptions?.bootstrapSha;
    this.lastReleaseSha = manifestOptions?.lastReleaseSha;
    this.draft = manifestOptions?.draft;
    this.draftPullRequest = manifestOptions?.draftPullRequest;
    this.groupPullRequestTitlePattern =
      manifestOptions?.groupPullRequestTitlePattern;
    this.releaseSearchDepth =
      manifestOptions?.releaseSearchDepth || DEFAULT_RELEASE_SEARCH_DEPTH;
    this.commitSearchDepth =
      manifestOptions?.commitSearchDepth || DEFAULT_COMMIT_SEARCH_DEPTH;
    this.logger = manifestOptions?.logger ?? defaultLogger;
    this.plugins = (manifestOptions?.plugins || []).map(pluginType =>
      buildPlugin({
        type: pluginType,
        github: this.github,
        targetBranch: this.targetBranch,
        repositoryConfig: this.repositoryConfig,
        manifestPath: this.manifestPath,
      })
    );
    this.pullRequestOverflowHandler = new FilePullRequestOverflowHandler(
      this.github,
      this.logger
    );
  }

  /**
   * Create a Manifest from config files in the repository.
   *
   * @param {GitHub} github GitHub client
   * @param {string} targetBranch The releaseable base branch
   * @param {string} configFile Optional. The path to the manifest config file
   * @param {string} manifestFile Optional. The path to the manifest versions file
   * @param {string} path The single path to check. Optional
   * @returns {Manifest}
   */
  static async fromManifest(
    github: GitHub,
    targetBranch: string,
    configFile: string = DEFAULT_RELEASE_PLEASE_CONFIG,
    manifestFile: string = DEFAULT_RELEASE_PLEASE_MANIFEST,
    manifestOptionOverrides: ManifestOptions = {},
    path?: string,
    releaseAs?: string
  ): Promise<Manifest> {
    const changesBranch = manifestOptionOverrides.changesBranch ?? targetBranch;
    const [
      {config: repositoryConfig, options: manifestOptions},
      releasedVersions,
    ] = await Promise.all([
      parseConfig(github, configFile, changesBranch, path, releaseAs),
      parseReleasedVersions(github, manifestFile, changesBranch),
    ]);
    if (manifestOptions.logger) {
      setupLogger(manifestOptions.logger);
    }
    return new Manifest(
      github,
      targetBranch,
      repositoryConfig,
      releasedVersions,
      {
        manifestPath: manifestFile,
        ...manifestOptions,
        ...manifestOptionOverrides,
      }
    );
  }

  /**
   * Create a Manifest from explicit config in code. This assumes that the
   * repository has a single component at the root path.
   *
   * @param {GitHub} github GitHub client
   * @param {string} targetBranch The releaseable base branch
   * @param {ReleaserConfig} config Release strategy options
   * @param {ManifestOptions} manifestOptions Optional. Manifest options
   * @param {string} manifestOptions.changesBranch If provided, this branch will be used
   *   to find conventional commits instead of the target branch
   * @param {string} manifestOptions.bootstrapSha If provided, use this SHA
   *   as the point to consider commits after
   * @param {boolean} manifestOptions.alwaysLinkLocal Option for the node-workspace
   *   plugin
   * @param {boolean} manifestOptions.separatePullRequests If true, create separate pull
   *   requests instead of a single manifest release pull request
   * @param {PluginType[]} manifestOptions.plugins Any plugins to use for this repository
   * @param {boolean} manifestOptions.fork If true, create pull requests from a fork. Defaults
   *   to `false`
   * @param {string} manifestOptions.signoff Add a Signed-off-by annotation to the commit
   * @param {string} manifestOptions.manifestPath Path to the versions manifest
   * @param {string[]} manifestOptions.labels Labels that denote a pending, untagged release
   *   pull request. Defaults to `[autorelease: pending]`
   * @param {string[]} manifestOptions.releaseLabels Labels to apply to a tagged release
   *   pull request. Defaults to `[autorelease: tagged]`
   * @param {string[]} manifestOptions.prereleaseLabels Labels that denote a pre-release pull request.
   *   Defaults to `[autorelease: pre-release]`
   * @returns {Manifest}
   */
  static async fromConfig(
    github: GitHub,
    targetBranch: string,
    config: ReleaserConfig,
    manifestOptions?: ManifestOptions,
    path: string = ROOT_PROJECT_PATH
  ): Promise<Manifest> {
    const repositoryConfig: RepositoryConfig = {};
    repositoryConfig[path] = config;
    const strategy = await buildStrategy({
      github,
      ...config,
    });
    const component = await strategy.getBranchComponent();
    const releasedVersions: ReleasedVersions = {};
    const latestVersion = await latestReleaseVersion(
      github,
      manifestOptions?.changesBranch || targetBranch,
      version => isPublishedVersion(strategy, version),
      config,
      component,
      manifestOptions?.logger
    );
    if (latestVersion) {
      releasedVersions[path] = latestVersion;
    }
    return new Manifest(
      github,
      targetBranch,
      repositoryConfig,
      releasedVersions,
      {
        separatePullRequests: true,
        ...manifestOptions,
      }
    );
  }

  /**
   * Build all candidate pull requests for this repository.
   *
   * Iterates through each path and builds a candidate pull request for component.
   * Applies any configured plugins.
   *
   * @returns {ReleasePullRequest[]} The candidate pull requests to open or update.
   */
  async buildPullRequests(
    openPullRequests: PullRequest[],
    snoozedPullRequests: PullRequest[]
  ): Promise<ReleasePullRequest[]> {
    this.logger.info('Building pull requests');
    const pathsByComponent = await this.getPathsByComponent();
    const strategiesByPath = await this.getStrategiesByPath();

    // Collect all the SHAs of the latest release packages
    this.logger.info('Collecting release commit SHAs');
    let releasesFound = 0;
    const expectedReleases = Object.keys(strategiesByPath).length;

    // SHAs by path
    const releaseShasByPath: Record<string, string> = {};

    // Releases by path
    const releasesByPath: Record<string, Release> = {};
    this.logger.debug(`release search depth: ${this.releaseSearchDepth}`);
    for await (const release of this.github.releaseIterator({
      maxResults: this.releaseSearchDepth,
    })) {
      const tagName = TagName.parse(release.tagName);
      if (!tagName) {
        this.logger.warn(`Unable to parse release name: ${release.name}`);
        continue;
      }
      const component = tagName.component || DEFAULT_COMPONENT_NAME;
      const path = pathsByComponent[component];
      if (!path) {
        this.logger.warn(
          `Found release tag with component '${component}', but not configured in manifest`
        );
        continue;
      }
      const expectedVersion = this.releasedVersions[path];
      if (!expectedVersion) {
        this.logger.warn(
          `Unable to find expected version for path '${path}' in manifest`
        );
        continue;
      }
      if (expectedVersion.toString() === tagName.version.toString()) {
        this.logger.debug(`Found release for path ${path}, ${release.tagName}`);
        releaseShasByPath[path] = release.sha;
        releasesByPath[path] = {
          name: release.name,
          tag: tagName,
          sha: release.sha,
          notes: release.notes || '',
        };
        releasesFound += 1;
      }

      if (releasesFound >= expectedReleases) {
        break;
      }
    }

    if (releasesFound < expectedReleases) {
      this.logger.warn(
        `Expected ${expectedReleases} releases, only found ${releasesFound}`
      );
      // Fall back to looking for missing releases using expected tags
      const missingPaths = Object.keys(strategiesByPath).filter(
        path => !releasesByPath[path]
      );
      this.logger.warn(`Missing ${missingPaths.length} paths: ${missingPaths}`);
      const missingReleases = await this.backfillReleasesFromTags(
        missingPaths,
        strategiesByPath
      );
      for (const path in missingReleases) {
        releaseShasByPath[path] = missingReleases[path].sha;
        releasesByPath[path] = missingReleases[path];
        releasesFound++;
      }
    }

    const needsBootstrap = releasesFound < expectedReleases;

    if (releasesFound < expectedReleases) {
      this.logger.warn(
        `Expected ${expectedReleases} releases, only found ${releasesFound}`
      );
    }
    for (const path in releasesByPath) {
      const release = releasesByPath[path];
      this.logger.debug(
        `release for path: ${path}, version: ${release.tag.version.toString()}, sha: ${
          release.sha
        }`
      );
    }

    // iterate through commits and collect commits until we have
    // seen all release commits
    this.logger.info('Collecting commits since all latest releases');
    const commits: Commit[] = [];
    this.logger.debug(`commit search depth: ${this.commitSearchDepth}`);
    const commitGenerator = this.github.mergeCommitIterator(
      this.changesBranch,
      {
        maxResults: this.commitSearchDepth,
        backfillFiles: true,
      }
    );
    const releaseShas = new Set(Object.values(releaseShasByPath));
    this.logger.debug(releaseShas);
    const expectedShas = releaseShas.size;

    // sha => release pull request
    const releasePullRequestsBySha: Record<string, PullRequest> = {};
    let releaseCommitsFound = 0;
    for await (const commit of commitGenerator) {
      if (releaseShas.has(commit.sha)) {
        if (commit.pullRequest) {
          releasePullRequestsBySha[commit.sha] = commit.pullRequest;
        } else {
          this.logger.warn(
            `Release SHA ${commit.sha} did not have an associated pull request`
          );
        }
        releaseCommitsFound += 1;
      }
      if (this.lastReleaseSha && this.lastReleaseSha === commit.sha) {
        this.logger.info(
          `Using configured lastReleaseSha ${this.lastReleaseSha} as last commit.`
        );
        break;
      } else if (needsBootstrap && commit.sha === this.bootstrapSha) {
        this.logger.info(
          `Needed bootstrapping, found configured bootstrapSha ${this.bootstrapSha}`
        );
        break;
      } else if (!needsBootstrap && releaseCommitsFound >= expectedShas) {
        // found enough commits
        break;
      }
      commits.push({
        sha: commit.sha,
        message: commit.message,
        files: commit.files,
        pullRequest: commit.pullRequest,
      });
    }

    if (releaseCommitsFound < expectedShas) {
      this.logger.warn(
        `Expected ${expectedShas} commits, only found ${releaseCommitsFound}`
      );
    }

    // split commits by path
    this.logger.info(`Splitting ${commits.length} commits by path`);
    const cs = new CommitSplit({
      includeEmpty: true,
      packagePaths: Object.keys(this.repositoryConfig),
    });
    const splitCommits = cs.split(commits);

    // limit paths to ones since the last release
    let commitsPerPath: Record<string, Commit[]> = {};
    for (const path in this.repositoryConfig) {
      commitsPerPath[path] = commitsAfterSha(
        path === ROOT_PROJECT_PATH ? commits : splitCommits[path],
        releaseShasByPath[path]
      );
    }
    const commitExclude = new CommitExclude(this.repositoryConfig);
    commitsPerPath = commitExclude.excludeCommits(commitsPerPath);

    // backfill latest release tags from manifest
    for (const path in this.repositoryConfig) {
      const latestRelease = releasesByPath[path];
      if (
        !latestRelease &&
        this.releasedVersions[path] &&
        this.releasedVersions[path].toString() !== '0.0.0'
      ) {
        const version = this.releasedVersions[path];
        const strategy = strategiesByPath[path];
        const component = await strategy.getComponent();
        this.logger.info(
          `No latest release found for path: ${path}, component: ${component}, but a previous version (${version.toString()}) was specified in the manifest.`
        );
        releasesByPath[path] = {
          tag: new TagName(version, component),
          sha: '',
          notes: '',
        };
      }
    }

    let strategies = strategiesByPath;
    for (const plugin of this.plugins) {
      strategies = await plugin.preconfigure(
        strategies,
        commitsPerPath,
        releasesByPath
      );
    }

    let newReleasePullRequests: CandidateReleasePullRequest[] = [];
    for (const path in this.repositoryConfig) {
      const config = this.repositoryConfig[path];
      this.logger.info(
        `Building candidate release pull request for path: ${path}`
      );
      this.logger.debug(`type: ${config.releaseType}`);
      this.logger.debug(`targetBranch: ${this.targetBranch}`);
      this.logger.debug(`changesBranch: ${this.changesBranch}`);
      let pathCommits = parseConventionalCommits(
        commitsPerPath[path],
        this.logger
      );
      // The processCommits hook can be implemented by plugins to
      // post-process commits. This can be used to perform cleanup, e.g,, sentence
      // casing all commit messages:
      for (const plugin of this.plugins) {
        pathCommits = plugin.processCommits(pathCommits);
      }
      this.logger.debug(`commits: ${pathCommits.length}`);
      const latestReleasePullRequest =
        releasePullRequestsBySha[releaseShasByPath[path]];
      if (!latestReleasePullRequest) {
        this.logger.warn('No latest release pull request found.');
      }

      const strategy = strategies[path];
      const latestRelease = releasesByPath[path];

      const branchName = (await strategy.getBranchName()).toString();
      const existingPR =
        openPullRequests.find(pr => pr.headBranchName === branchName) ||
        snoozedPullRequests.find(pr => pr.headBranchName === branchName);

      const releasePullRequest = await strategy.buildReleasePullRequest({
        commits: pathCommits,
        latestRelease,
        draft: config.draftPullRequest ?? this.draftPullRequest,
        labels: this.labels,
        existingPullRequest: existingPR,
        manifestPath: this.manifestPath,
      });
      this.logger.debug(`path: ${path}`);
      this.logger.debug(
        `releasePullRequest.headRefName: ${releasePullRequest?.headRefName}`
      );
      if (releasePullRequest) {
        // Update manifest, but only for valid release version - this will skip SNAPSHOT from java strategy
        if (
          releasePullRequest.version &&
          isPublishedVersion(strategy, releasePullRequest.version)
        ) {
          const versionsMap: VersionsMap = new Map();
          versionsMap.set(path, releasePullRequest.version);
          releasePullRequest.updates.push({
            path: this.manifestPath,
            createIfMissing: false,
            updater: new ReleasePleaseManifest({
              version: releasePullRequest.version,
              versionsMap,
            }),
          });
        }
        newReleasePullRequests.push({
          path,
          config,
          pullRequest: releasePullRequest,
        });
      }
    }

    // Combine pull requests into 1 unless configured for separate
    // pull requests
    if (!this.separatePullRequests) {
      this.plugins.push(
        new Merge(
          this.github,
          this.targetBranch,
          this.manifestPath,
          this.repositoryConfig,
          {
            pullRequestTitlePattern: this.groupPullRequestTitlePattern,
            changesBranch: this.changesBranch,
          }
        )
      );
    }

    for (const plugin of this.plugins) {
      this.logger.debug(`running plugin: ${plugin.constructor.name}`);
      newReleasePullRequests = await plugin.run(newReleasePullRequests);
    }

    return newReleasePullRequests.map(
      pullRequestWithConfig => pullRequestWithConfig.pullRequest
    );
  }

  private async backfillReleasesFromTags(
    missingPaths: string[],
    strategiesByPath: Record<string, Strategy>
  ): Promise<Record<string, Release>> {
    const releasesByPath: Record<string, Release> = {};
    const allTags = await this.getAllTags();
    for (const path of missingPaths) {
      const expectedVersion = this.releasedVersions[path];
      if (!expectedVersion) {
        this.logger.warn(`No version for path ${path}`);
        continue;
      }
      const component = await strategiesByPath[path].getComponent();
      const expectedTag = new TagName(
        expectedVersion,
        component,
        this.repositoryConfig[path].tagSeparator,
        this.repositoryConfig[path].includeVInTag
      );
      this.logger.debug(`looking for tagName: ${expectedTag.toString()}`);
      const foundTag = allTags[expectedTag.toString()];
      if (foundTag) {
        this.logger.debug(`found: ${foundTag.name} ${foundTag.sha}`);
        releasesByPath[path] = {
          name: foundTag.name,
          tag: expectedTag,
          sha: foundTag.sha,
          notes: '',
        };
      }
    }
    return releasesByPath;
  }

  private async getAllTags(): Promise<Record<string, GitHubTag>> {
    const allTags: Record<string, GitHubTag> = {};
    for await (const tag of this.github.tagIterator()) {
      allTags[tag.name] = tag;
    }
    return allTags;
  }

  /**
   * Opens/updates all candidate release pull requests for this repository.
   *
   * @returns {PullRequest[]} Pull request numbers of release pull requests
   */
  async createPullRequests(): Promise<(PullRequest | undefined)[]> {
    this.github.invalidateFileCache();

    // register all possible labels to make them available to users through GitHub label dropdown
    await this.registerLabels();

    // if there are any merged, pending release pull requests, don't open
    // any new release PRs
    const mergedPullRequestsGenerator = this.findMergedReleasePullRequests();
    for await (const _ of mergedPullRequestsGenerator) {
      this.logger.warn(
        'There are untagged, merged release PRs outstanding - aborting'
      );
      return [];
    }

    // collect open and snoozed release pull requests
    const openPullRequests = await this.findOpenReleasePullRequests();
    const snoozedPullRequests = await this.findSnoozedReleasePullRequests();

    // prepare releases pull requests
    const candidatePullRequests = await this.buildPullRequests(
      openPullRequests,
      snoozedPullRequests
    );
    if (candidatePullRequests.length === 0) {
      return [];
    }

    if (this.sequentialCalls) {
      const pullRequests: PullRequest[] = [];
      for (const pullRequest of candidatePullRequests) {
        const resultPullRequest = await this.createOrUpdatePullRequest(
          pullRequest,
          openPullRequests,
          snoozedPullRequests
        );
        if (resultPullRequest) pullRequests.push(resultPullRequest);
      }
      return pullRequests;
    } else {
      const promises: Promise<PullRequest | undefined>[] = [];
      for (const pullRequest of candidatePullRequests) {
        promises.push(
          this.createOrUpdatePullRequest(
            pullRequest,
            openPullRequests,
            snoozedPullRequests
          )
        );
      }
      const pullNumbers = await Promise.all(promises);
      // reject any pull numbers that were not created or updated
      return pullNumbers.filter(number => !!number);
    }
  }

  private async registerLabels() {
    const repoLabels = new Set<string>(await this.github.getLabels());
    const missingLabels = [
      ...this.labels,
      ...this.releaseLabels,
      ...this.prereleaseLabels,
    ].filter(label => !repoLabels.has(label));
    await this.github.createLabels(missingLabels);
  }

  private async findOpenReleasePullRequests(): Promise<PullRequest[]> {
    this.logger.info('Looking for open release pull requests');
    const openPullRequests: PullRequest[] = [];
    const generator = this.github.pullRequestIterator(
      this.targetBranch,
      'OPEN',
      Number.MAX_SAFE_INTEGER,
      false
    );
    for await (const openPullRequest of generator) {
      if (
        hasAllLabels(this.labels, openPullRequest.labels) ||
        hasAllLabels(this.snapshotLabels, openPullRequest.labels)
      ) {
        const body = await this.pullRequestOverflowHandler.parseOverflow(
          openPullRequest
        );
        if (body) {
          // maybe replace with overflow body
          openPullRequests.push({
            ...openPullRequest,
            body: body.toString(),
          });
        }
      }
    }
    this.logger.info(
      `found ${openPullRequests.length} open release pull requests.`
    );
    return openPullRequests;
  }

  private async findSnoozedReleasePullRequests(): Promise<PullRequest[]> {
    this.logger.info('Looking for snoozed release pull requests');
    const snoozedPullRequests: PullRequest[] = [];
    const closedGenerator = this.github.pullRequestIterator(
      this.targetBranch,
      'CLOSED',
      200,
      false
    );
    for await (const closedPullRequest of closedGenerator) {
      if (
        hasAllLabels([SNOOZE_LABEL], closedPullRequest.labels) &&
        BranchName.parse(closedPullRequest.headBranchName, this.logger)
      ) {
        const body = await this.pullRequestOverflowHandler.parseOverflow(
          closedPullRequest
        );
        if (body) {
          // maybe replace with overflow body
          snoozedPullRequests.push({
            ...closedPullRequest,
            body: body.toString(),
          });
        }
      }
    }
    this.logger.info(
      `found ${snoozedPullRequests.length} snoozed release pull requests.`
    );
    return snoozedPullRequests;
  }

  private async createOrUpdatePullRequest(
    pullRequest: ReleasePullRequest,
    openPullRequests: PullRequest[],
    snoozedPullRequests: PullRequest[]
  ): Promise<PullRequest | undefined> {
    // look for existing, open pull request
    const existing = openPullRequests.find(
      openPullRequest =>
        openPullRequest.headBranchName === pullRequest.headRefName
    );
    if (existing) {
      return await this.maybeUpdateExistingPullRequest(existing, pullRequest);
    }

    // look for closed, snoozed pull request
    const snoozed = snoozedPullRequests.find(
      openPullRequest =>
        openPullRequest.headBranchName === pullRequest.headRefName
    );
    if (snoozed) {
      return await this.maybeUpdateSnoozedPullRequest(snoozed, pullRequest);
    }

    const body = await this.pullRequestOverflowHandler.handleOverflow(
      pullRequest,
      this.changesBranch
    );
    const message = this.signoffUser
      ? signoffCommitMessage(pullRequest.title.toString(), this.signoffUser)
      : pullRequest.title.toString();
    const newPullRequest = await this.github.createPullRequest(
      {
        headBranchName: pullRequest.headRefName,
        baseBranchName: this.targetBranch,
        number: -1,
        title: pullRequest.title.toString(),
        body,
        labels: this.skipLabeling ? [] : pullRequest.labels,
        files: [],
      },
      this.targetBranch,
      this.changesBranch,
      message,
      pullRequest.updates,
      {
        fork: this.fork,
        draft: pullRequest.draft,
        reviewers: this.reviewers,
        autoMerge: this.pullRequestAutoMergeOption(pullRequest),
      }
    );

    return newPullRequest;
  }

  /// only update an existing pull request if it has release note changes
  private async maybeUpdateExistingPullRequest(
    existing: PullRequest,
    pullRequest: ReleasePullRequest
  ): Promise<PullRequest | undefined> {
    // If unchanged, no need to push updates
    if (
      existing.title === pullRequest.title.toString() &&
      existing.body === pullRequest.body.toString()
    ) {
      this.logger.info(
        `PR https://github.com/${this.repository.owner}/${this.repository.repo}/pull/${existing.number} remained the same`
      );
      return undefined;
    }

    const updatedPullRequest = await this.github.updatePullRequest(
      existing.number,
      pullRequest,
      this.targetBranch,
      this.changesBranch,
      {
        fork: this.fork,
        reviewers: this.reviewers,
        signoffUser: this.signoffUser,
        pullRequestOverflowHandler: this.pullRequestOverflowHandler,
        autoMerge: this.pullRequestAutoMergeOption(pullRequest),
      }
    );

    return updatedPullRequest;
  }

  /// only update an snoozed pull request if it has release note changes
  private async maybeUpdateSnoozedPullRequest(
    snoozed: PullRequest,
    pullRequest: ReleasePullRequest
  ): Promise<PullRequest | undefined> {
    // If unchanged, no need to push updates
    if (snoozed.body === pullRequest.body.toString()) {
      this.logger.info(
        `PR https://github.com/${this.repository.owner}/${this.repository.repo}/pull/${snoozed.number} remained the same`
      );
      return undefined;
    }
    const updatedPullRequest = await this.github.updatePullRequest(
      snoozed.number,
      pullRequest,
      this.targetBranch,
      this.changesBranch,
      {
        fork: this.fork,
        signoffUser: this.signoffUser,
        pullRequestOverflowHandler: this.pullRequestOverflowHandler,
        autoMerge: this.pullRequestAutoMergeOption(pullRequest),
      }
    );
    // TODO: consider leaving the snooze label
    await this.github.removeIssueLabels([SNOOZE_LABEL], snoozed.number);
    return updatedPullRequest;
  }

  private async *findMergedReleasePullRequests() {
    // Find merged release pull requests
    const pullRequestGenerator = this.github.pullRequestIterator(
      this.targetBranch,
      'MERGED',
      200,
      false
    );
    for await (const pullRequest of pullRequestGenerator) {
      if (!hasAllLabels(this.labels, pullRequest.labels)) {
        continue;
      }
      this.logger.debug(
        `Found pull request #${pullRequest.number}: '${pullRequest.title}'`
      );

      // if the pull request body overflows, handle it
      const pullRequestBody =
        await this.pullRequestOverflowHandler.parseOverflow(pullRequest);
      if (!pullRequestBody) {
        this.logger.debug('could not parse pull request body as a release PR');
        continue;
      }
      // replace with the complete fetched body
      yield {
        ...pullRequest,
        body: pullRequestBody.toString(),
      };
    }
  }

  /**
   * Find merged, untagged releases and build candidate releases to tag.
   *
   * @returns {CandidateRelease[]} List of release candidates
   */
  async buildReleases(): Promise<CandidateRelease[]> {
    this.logger.info('Building releases');
    const strategiesByPath = await this.getStrategiesByPath();

    // Find merged release pull requests
    const generator = await this.findMergedReleasePullRequests();
    const candidateReleases: CandidateRelease[] = [];
    for await (const pullRequest of generator) {
      for (const path in this.repositoryConfig) {
        const config = this.repositoryConfig[path];
        this.logger.info(`Building release for path: ${path}`);
        this.logger.debug(`type: ${config.releaseType}`);
        this.logger.debug(`targetBranch: ${this.targetBranch}`);
        const strategy = strategiesByPath[path];
        const releases = await strategy.buildReleases(pullRequest, {
          groupPullRequestTitlePattern: this.groupPullRequestTitlePattern,
        });
        const hasPrereleaseLabel = !!pullRequest.labels.find(label =>
          this.prereleaseLabels.find(
            prereleaseLabel => prereleaseLabel === label
          )
        );
        for (const release of releases) {
          candidateReleases.push({
            ...release,
            path,
            pullRequest,
            draft: config.draft ?? this.draft,
            prerelease:
              hasPrereleaseLabel ||
              (config.prerelease &&
                (!!release.tag.version.preRelease ||
                  release.tag.version.major === 0)),
          });
        }
      }
    }

    return candidateReleases;
  }

  /**
   * Find merged, untagged releases. For each release, create a GitHub release,
   * comment on the pull request used to generated it and update the pull request
   * labels.
   *
   * @returns {GitHubRelease[]} List of created GitHub releases
   */
  async createReleases(): Promise<(CreatedRelease | undefined)[]> {
    this.github.invalidateFileCache();

    const releasesByPullRequest: Record<number, CandidateRelease[]> = {};
    const pullRequestsByNumber: Record<number, PullRequest> = {};

    for (const release of await this.buildReleases()) {
      pullRequestsByNumber[release.pullRequest.number] = release.pullRequest;
      if (releasesByPullRequest[release.pullRequest.number]) {
        releasesByPullRequest[release.pullRequest.number].push(release);
      } else {
        releasesByPullRequest[release.pullRequest.number] = [release];
      }
    }

    const runReleaseProcess = async (): Promise<CreatedRelease[]> => {
      if (this.sequentialCalls) {
        const resultReleases: CreatedRelease[] = [];
        for (const pullNumber in releasesByPullRequest) {
          const releases = await this.createReleasesForPullRequest(
            releasesByPullRequest[pullNumber],
            pullRequestsByNumber[pullNumber]
          );
          resultReleases.push(...releases);
        }
        return resultReleases;
      } else {
        const promises: Promise<CreatedRelease[]>[] = [];
        for (const pullNumber in releasesByPullRequest) {
          promises.push(
            this.createReleasesForPullRequest(
              releasesByPullRequest[pullNumber],
              pullRequestsByNumber[pullNumber]
            )
          );
        }
        const releases = await Promise.all(promises);
        return releases.reduce((collection, r) => collection.concat(r), []);
      }
    };

    // to minimize risks of race condition we attempt as early as possible to lock branches used as the source of
    // commits for the duration of the release process.
    let createdReleases: CreatedRelease[];
    const pullRequests = Object.values(pullRequestsByNumber);
    let locked = false; // used to be sure we only take the fallback branch on locking errors, not when unlocking fails
    try {
      const lockedBranches = await this.lockPullRequestsChangesBranch(
        pullRequests
      );
      locked = true;
      try {
        createdReleases = await runReleaseProcess();
      } finally {
        // always try to unlock branches, we don't want to keep them blocked as read-only when the release process fails
        // before completion
        await this.unlockPullRequestsChangesBranch(lockedBranches);
      }
    } catch (err: unknown) {
      // Error: 403 "Resource not accessible by integration" is returned by GitHub when the API token doesn't have
      // permissions to manipulate branch protection rules, if that seems to be the case we instead fallback to checking
      // twice for race conditions, once at the beginning of the release process and once again before aligning
      // branches.
      // While not ideal that still significantly reduces risks of overwriting new commits.
      //
      // Error mentioned here: https://docs.github.com/en/code-security/code-scanning/troubleshooting-code-scanning/resource-not-accessible-by-integration
      if (
        (!locked && isOctokitRequestError(err) && err.status === 403) ||
        (isOctokitGraphqlResponseError(err) &&
          err.errors?.find(e => e.type === 'FORBIDDEN'))
      ) {
        createdReleases = await runReleaseProcess();
      } else {
        throw err;
      }
    }

    // try to re-align branches to ensure the next release pull request won't face git conflicts. In case of
    // inconsistencies releases are still created but the command fails and won't force a re-alignment between a PR
    // ref branch and base branch.
    try {
      await this.alignPullRequestsChangesBranch(pullRequests);
    } catch (err) {
      this.logger.error(err as {});
    }

    return createdReleases;
  }

  /**
   * Attempt to lock the branch used as the ref for the release branch of pull requests
   *
   * @returns {Set<string>} Branch names that have been locked
   */
  private async lockPullRequestsChangesBranch(
    pullRequests: PullRequest[]
  ): Promise<Set<string>> {
    const lockedBranches = new Set<string>();
    for (const pr of pullRequests) {
      const branchName = BranchName.parse(pr.headBranchName);
      const refBranch = branchName?.changesBranch || branchName?.targetBranch;
      if (refBranch && !lockedBranches.has(refBranch)) {
        await this.github.lockBranch(refBranch);
        lockedBranches.add(refBranch);
      }
    }
    return lockedBranches;
  }

  private async unlockPullRequestsChangesBranch(branchNames: Set<string>) {
    for (const branch of branchNames) {
      await this.github.unlockBranch(branch);
    }
  }

  private async alignPullRequestsChangesBranch(pullRequests: PullRequest[]) {
    const errors: Error[] = [];
    for (const pr of pullRequests) {
      try {
        await this.alignPullRequestChangesBranch(pr);
      } catch (err: unknown) {
        errors.push(err as Error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        'Errors when aligning pull requests branches'
      );
    }
  }

  private async alignPullRequestChangesBranch(pr: PullRequest) {
    const branchName = BranchName.parse(pr.headBranchName);

    // we only care about pull requests with an associated changes-branch
    if (!branchName?.changesBranch) {
      return;
    }
    this.logger.info(
      `Aligning branches for PR #${pr.number}, changes branch ${branchName.changesBranch} to be aligned with ${this.targetBranch}`
    );

    let safeToRealign = false;

    try {
      this.logger.debug(
        `Checking if PR commits are in sync with '${branchName.changesBranch}'...`
      );
      if (
        await this.github.isBranchSyncedWithPullRequestCommits(
          branchName.changesBranch,
          pr
        )
      ) {
        this.logger.debug(
          'PR commits and changes branch in sync, safe to re-align'
        );
        safeToRealign = true;
      }
    } catch (err: unknown) {
      // if a branch of commit cannot be found it is likely the PR commits information aren't in a reliable state, in
      // this case just ignore and continue with the next check
      if (isOctokitRequestError(err) && err.status === 404) {
        this.logger.debug(
          `Could not compare commits from PR and '${branchName.changesBranch}' due to a branch or commit not found. Continue with the next check`
        );
      } else {
        throw err;
      }
    }

    // then check if changes-branch has already been synced with the base branch, in which case we don't need to do
    // anything
    if (
      !safeToRealign &&
      (await this.github.isBranchASyncedWithB(
        branchName.changesBranch,
        this.targetBranch
      ))
    ) {
      this.logger.debug(
        `Checking if ${branchName.changesBranch} is synced with ${this.targetBranch}...`
      );
      this.logger.debug('Branches already in sync, no need to re-align');
      return;
    }

    if (!safeToRealign) {
      throw new Error(
        `Branch '${branchName.changesBranch}' cannot be safely re-aligned with '${this.targetBranch}', and will likely result in git conflicts when the next release PR is created. Hint: compare branches '${pr.headBranchName}', '${branchName.changesBranch}', and '${this.targetBranch}' for inconsistencies`
      );
    }

    await this.github.alignBranchWithAnother(
      branchName.changesBranch,
      this.targetBranch
    );

    // updating git branches isn't always instant and can take a bit of time to propagate throughout github systems,
    // it is safer to wait a little bit before doing anything else
    const version = PullRequestTitle.parse(
      pr.title,
      this.repositoryConfig[branchName.getComponent() || '.']
        ?.pullRequestTitlePattern,
      this.logger
    )?.getVersion();
    if (!version) {
      this.logger.warn(
        `PR #${pr.number} title missing a version number: '${pr.title}'`
      );
      return;
    }
    await this.github.waitForFileToBeUpToDateOnBranch({
      branch: branchName.changesBranch,
      filePath: this.manifestPath,
      checkFileStatus: fileContent => {
        const json = JSON.parse(fileContent) as Record<string, unknown>;
        if (!json) {
          return false;
        }
        const path = branchName.getComponent() || '.';
        const val = json[path];
        if (typeof val !== 'string') {
          this.logger.error(
            `Value of manifest file ${this.manifestPath} at key '${path}' was not a string. value=${val}`
          );
          return false;
        }
        return val === version.toString();
      },
    });
  }

  private async createReleasesForPullRequest(
    releases: CandidateRelease[],
    pullRequest: PullRequest
  ): Promise<CreatedRelease[]> {
    this.logger.info(
      `Creating ${releases.length} releases for pull #${pullRequest.number}`
    );
    const duplicateReleases: DuplicateReleaseError[] = [];
    const githubReleases: CreatedRelease[] = [];
    for (const release of releases) {
      try {
        githubReleases.push(await this.createRelease(release));
      } catch (err) {
        if (err instanceof DuplicateReleaseError) {
          this.logger.warn(`Duplicate release tag: ${release.tag.toString()}`);
          duplicateReleases.push(err);
        } else {
          throw err;
        }
      }
    }

    const adjustPullRequestTags = async () => {
      // Note: if the pull request represents more than one release it becomes difficult to determine if it should be
      // labelled as pre-release.
      const isPrerelease = releases.length === 1 && releases[0].prerelease;
      await Promise.all([
        this.github.removeIssueLabels(this.labels, pullRequest.number),
        this.github.addIssueLabels(
          [
            ...this.releaseLabels,
            ...(isPrerelease ? this.prereleaseLabels : []),
          ],
          pullRequest.number
        ),
      ]);
    };

    if (duplicateReleases.length > 0) {
      if (
        duplicateReleases.length + githubReleases.length ===
        releases.length
      ) {
        // we've either tagged all releases or they were duplicates
        await adjustPullRequestTags();
      }
      if (githubReleases.length === 0) {
        // If all releases were duplicate, throw a duplicate error
        throw duplicateReleases[0];
      }
    } else {
      await adjustPullRequestTags();
    }

    return githubReleases;
  }

  private async createRelease(
    release: CandidateRelease
  ): Promise<CreatedRelease> {
    const githubRelease = await this.github.createRelease(release, {
      draft: release.draft,
      prerelease: release.prerelease,
    });

    await this.github.waitForReleaseToBeListed(githubRelease);

    // comment on pull request
    const comment = `:robot: Release is at ${githubRelease.url} :sunflower:`;
    await this.github.commentOnIssue(comment, release.pullRequest.number);

    return {
      ...githubRelease,
      path: release.path,
      version: release.tag.version.toString(),
      major: release.tag.version.major,
      minor: release.tag.version.minor,
      patch: release.tag.version.patch,
    };
  }

  private async getStrategiesByPath(): Promise<Record<string, Strategy>> {
    if (!this._strategiesByPath) {
      this.logger.info('Building strategies by path');
      this._strategiesByPath = {};
      for (const path in this.repositoryConfig) {
        const config = this.repositoryConfig[path];
        this.logger.debug(`${path}: ${config.releaseType}`);
        const strategy = await buildStrategy({
          ...config,
          github: this.github,
          path,
          targetBranch: this.targetBranch,
          changesBranch: this.changesBranch,
        });
        this._strategiesByPath[path] = strategy;
      }
    }
    return this._strategiesByPath;
  }

  private async getPathsByComponent(): Promise<Record<string, string>> {
    if (!this._pathsByComponent) {
      this._pathsByComponent = {};
      const strategiesByPath = await this.getStrategiesByPath();
      for (const path in this.repositoryConfig) {
        const strategy = strategiesByPath[path];
        const component = (await strategy.getComponent()) || '';
        if (this._pathsByComponent[component]) {
          this.logger.warn(
            `Multiple paths for ${component}: ${this._pathsByComponent[component]}, ${path}`
          );
        }
        this._pathsByComponent[component] = path;
      }
    }
    return this._pathsByComponent;
  }

  /**
   * Only return the auto-merge option if the release PR match filters. If no filter provided, do not auto merge. If
   * multiple filters are provided we take the intersection (AND operation).
   */
  pullRequestAutoMergeOption(
    pullRequest: ReleasePullRequest
  ): AutoMergeOption | undefined {
    const {versionBumpFilter, conventionalCommitFilter} = this.autoMerge || {};

    // if the version bump do not match any provided filter value, do not auto-merge
    const applyVersionBumpFilter = () => {
      const versionBump =
        pullRequest.version &&
        pullRequest.previousVersion &&
        pullRequest.version.compareBump(pullRequest.previousVersion);
      return (
        versionBump && versionBumpFilter?.find(filter => versionBump === filter)
      );
    };

    // given two sets of type:scope items, if any item from commitSet isn't in filterSet do not auto-merge
    const applyConventionalCommitFilter = () => {
      if (pullRequest.conventionalCommits.length === 0) {
        return false;
      }
      const filterSet = new Set(
        conventionalCommitFilter!.map(
          filter => `${filter.type}:${filter.scope ? filter.scope : '*'}`
        )
      );
      for (const commit of pullRequest.conventionalCommits) {
        if (
          !filterSet.has(`${commit.type}:${commit.scope}`) &&
          !filterSet.has(`${commit.type}:*`)
        ) {
          return false;
        }
      }
      return true;
    };

    const selected =
      conventionalCommitFilter?.length && versionBumpFilter?.length
        ? applyConventionalCommitFilter() && applyVersionBumpFilter()
        : conventionalCommitFilter?.length
        ? applyConventionalCommitFilter()
        : versionBumpFilter?.length
        ? applyVersionBumpFilter()
        : // no filter provided
          false;

    return selected ? this.autoMerge : undefined;
  }
}

/**
 * Helper to convert parsed JSON releaser config into ReleaserConfig for
 * the Manifest.
 *
 * @param {ReleaserPackageConfig} config Parsed configuration from JSON file.
 * @returns {ReleaserConfig}
 */
function extractReleaserConfig(
  config: ReleaserPackageConfig
): Partial<ReleaserConfig> {
  return {
    releaseType: config['release-type'],
    bumpMinorPreMajor: config['bump-minor-pre-major'],
    bumpPatchForMinorPreMajor: config['bump-patch-for-minor-pre-major'],
    versioning: config['versioning'],
    changelogSections: config['changelog-sections'],
    changelogPath: config['changelog-path'],
    changelogHost: config['changelog-host'],
    releaseAs: config['release-as'],
    skipGithubRelease: config['skip-github-release'],
    draft: config.draft,
    prerelease: config.prerelease,
    draftPullRequest: config['draft-pull-request'],
    component: config['component'],
    packageName: config['package-name'],
    versionFile: config['version-file'],
    extraFiles: config['extra-files'],
    includeComponentInTag: config['include-component-in-tag'],
    includeVInTag: config['include-v-in-tag'],
    changelogType: config['changelog-type'],
    pullRequestTitlePattern: config['pull-request-title-pattern'],
    pullRequestHeader: config['pull-request-header'],
    tagSeparator: config['tag-separator'],
    separatePullRequests: config['separate-pull-requests'],
    labels: config['label']?.split(','),
    releaseLabels: config['release-label']?.split(','),
    prereleaseLabels: config['prerelease-label']?.split(','),
    extraLabels: config['extra-label']?.split(','),
    skipSnapshot: config['skip-snapshot'],
    initialVersion: config['initial-version'],
    excludePaths: config['exclude-paths'],
    reviewers: config.reviewers,
  };
}

/**
 * Helper to convert fetch the manifest config from the repository and
 * parse into configuration for the Manifest.
 *
 * @param {GitHub} github GitHub client
 * @param {string} configFile Path in the repository to the manifest config
 * @param {string} branch Branch to fetch the config file from
 * @param {string} onlyPath Optional. Use only the given package
 * @param {string} releaseAs Optional. Override release-as and use the given version
 */
async function parseConfig(
  github: GitHub,
  configFile: string,
  branch: string,
  onlyPath?: string,
  releaseAs?: string
): Promise<{config: RepositoryConfig; options: ManifestOptions}> {
  const config = await fetchManifestConfig(github, configFile, branch);
  const defaultConfig = extractReleaserConfig(config);
  const repositoryConfig: RepositoryConfig = {};
  for (const path in config.packages) {
    if (onlyPath && onlyPath !== path) continue;
    repositoryConfig[path] = mergeReleaserConfig(
      defaultConfig,
      extractReleaserConfig(config.packages[path])
    );
    if (releaseAs) {
      repositoryConfig[path].releaseAs = releaseAs;
    }
  }
  const configLabel = config['label'];
  const configReleaseLabel = config['release-label'];
  const configPreReleaseLabel = config['prerelease-label'];
  const configSnapshotLabel = config['snapshot-label'];
  const manifestOptions: ManifestOptions = {
    bootstrapSha: config['bootstrap-sha'],
    lastReleaseSha: config['last-release-sha'],
    alwaysLinkLocal: config['always-link-local'],
    separatePullRequests: config['separate-pull-requests'],
    groupPullRequestTitlePattern: config['group-pull-request-title-pattern'],
    plugins: config['plugins'],
    labels: configLabel?.split(','),
    releaseLabels: configReleaseLabel?.split(','),
    prereleaseLabels: configPreReleaseLabel?.split(','),
    snapshotLabels: configSnapshotLabel?.split(','),
    releaseSearchDepth: config['release-search-depth'],
    commitSearchDepth: config['commit-search-depth'],
    sequentialCalls: config['sequential-calls'],
    reviewers: config.reviewers,
  };
  return {config: repositoryConfig, options: manifestOptions};
}

/**
 * Helper to fetch manifest config
 *
 * @param {GitHub} github
 * @param {string} configFile
 * @param {string} branch
 * @returns {ManifestConfig}
 * @throws {ConfigurationError} if missing the manifest config file
 */
async function fetchManifestConfig(
  github: GitHub,
  configFile: string,
  branch: string
): Promise<ManifestConfig> {
  try {
    return await github.getFileJson<ManifestConfig>(configFile, branch);
  } catch (e) {
    if (e instanceof FileNotFoundError) {
      throw new ConfigurationError(
        `Missing required manifest config: ${configFile}`,
        'base',
        `${github.repository.owner}/${github.repository.repo}`
      );
    } else if (e instanceof SyntaxError) {
      throw new ConfigurationError(
        `Failed to parse manifest config JSON: ${configFile}\n${e.message}`,
        'base',
        `${github.repository.owner}/${github.repository.repo}`
      );
    }
    throw e;
  }
}

/**
 * Helper to parse the manifest versions file.
 *
 * @param {GitHub} github GitHub client
 * @param {string} manifestFile Path in the repository to the versions file
 * @param {string} branch Branch to fetch the versions file from
 * @returns {Record<string, string>}
 */
async function parseReleasedVersions(
  github: GitHub,
  manifestFile: string,
  branch: string
): Promise<ReleasedVersions> {
  const manifestJson = await fetchReleasedVersions(
    github,
    manifestFile,
    branch
  );
  const releasedVersions: ReleasedVersions = {};
  for (const path in manifestJson) {
    releasedVersions[path] = Version.parse(manifestJson[path]);
  }
  return releasedVersions;
}

/**
 * Helper to fetch manifest config
 *
 * @param {GitHub} github
 * @param {string} manifestFile
 * @param {string} branch
 * @throws {ConfigurationError} if missing the manifest config file
 */
async function fetchReleasedVersions(
  github: GitHub,
  manifestFile: string,
  branch: string
): Promise<Record<string, string>> {
  try {
    return await github.getFileJson<Record<string, string>>(
      manifestFile,
      branch
    );
  } catch (e) {
    if (e instanceof FileNotFoundError) {
      throw new ConfigurationError(
        `Missing required manifest versions: ${manifestFile}`,
        'base',
        `${github.repository.owner}/${github.repository.repo}`
      );
    } else if (e instanceof SyntaxError) {
      throw new ConfigurationError(
        `Failed to parse manifest versions JSON: ${manifestFile}\n${e.message}`,
        'base',
        `${github.repository.owner}/${github.repository.repo}`
      );
    }
    throw e;
  }
}

function isPublishedVersion(strategy: Strategy, version: Version): boolean {
  return strategy.isPublishedVersion
    ? strategy.isPublishedVersion(version)
    : true;
}

/**
 * Find the most recent matching release tag on the branch we're
 * configured for.
 *
 * @param github GitHub client instance.
 * @param {string} branchToScan Name of the scanned branch.
 * @param releaseFilter Validator function for release version. Used to filter-out SNAPSHOT releases for Java strategy.
 * @param {string} prefix Limit the release to a specific component.
 * @param pullRequestTitlePattern Configured PR title pattern.
 */
async function latestReleaseVersion(
  github: GitHub,
  branchToScan: string,
  releaseFilter: (version: Version) => boolean,
  config: ReleaserConfig,
  prefix?: string,
  logger: Logger = defaultLogger
): Promise<Version | undefined> {
  const branchPrefix = prefix
    ? prefix.endsWith('-')
      ? prefix.replace(/-$/, '')
      : prefix
    : undefined;

  logger.info(
    `Looking for latest release on branch: ${branchToScan} with prefix: ${prefix}`
  );

  // collect set of recent commit SHAs seen to verify that the release
  // is in the current branch
  const commitShas = new Set<string>();

  const candidateReleaseVersions: Version[] = [];
  // only look at the last 250 or so commits to find the latest tag - we
  // don't want to scan the entire repository history if this repo has never
  // been released
  const generator = github.mergeCommitIterator(branchToScan, {
    maxResults: 250,
  });
  for await (const commitWithPullRequest of generator) {
    commitShas.add(commitWithPullRequest.sha);
    const mergedPullRequest = commitWithPullRequest.pullRequest;
    if (!mergedPullRequest) {
      logger.trace(
        `skipping commit: ${commitWithPullRequest.sha} missing merged pull request`
      );
      continue;
    }

    const branchName = BranchName.parse(
      mergedPullRequest.headBranchName,
      logger
    );
    if (!branchName) {
      logger.trace(
        `skipping commit: ${commitWithPullRequest.sha} unrecognized branch name: ${mergedPullRequest.headBranchName}`
      );
      continue;
    }

    // If branchPrefix is specified, ensure it is found in the branch name.
    // If branchPrefix is not specified, component should also be undefined.
    if (branchName.getComponent() !== branchPrefix) {
      logger.trace(
        `skipping commit: ${
          commitWithPullRequest.sha
        } branch component ${branchName.getComponent()} doesn't match expected prefix: ${branchPrefix}`
      );
      continue;
    }

    const pullRequestTitle = PullRequestTitle.parse(
      mergedPullRequest.title,
      config.pullRequestTitlePattern,
      logger
    );
    if (!pullRequestTitle) {
      logger.trace(
        `skipping commit: ${commitWithPullRequest.sha} couldn't parse pull request title: ${mergedPullRequest.title}`
      );
      continue;
    }

    const version = pullRequestTitle.getVersion();
    if (version && releaseFilter(version)) {
      logger.debug(
        `Found latest release pull request: ${mergedPullRequest.number} version: ${version}`
      );
      candidateReleaseVersions.push(version);
      break;
    }
  }

  // If not found from recent pull requests, look at releases. Iterate
  // through releases finding valid tags, then cross reference
  const releaseGenerator = github.releaseIterator();
  for await (const release of releaseGenerator) {
    const tagName = TagName.parse(release.tagName);
    if (!tagName) {
      continue;
    }

    if (tagMatchesConfig(tagName, branchPrefix, config.includeComponentInTag)) {
      logger.debug(`found release for ${prefix}`, tagName.version);
      if (!commitShas.has(release.sha)) {
        logger.debug(
          `SHA not found in recent commits to branch '${branchToScan}', skipping`
        );
        continue;
      }
      candidateReleaseVersions.push(tagName.version);
    }
  }
  logger.debug(
    `found ${candidateReleaseVersions.length} possible releases.`,
    candidateReleaseVersions
  );

  if (candidateReleaseVersions.length > 0) {
    // Find largest release number (sort descending then return first)
    return candidateReleaseVersions.sort((a, b) => b.compare(a))[0];
  }

  // If not found from recent pull requests or releases, look at tags. Iterate
  // through tags and cross reference against SHAs in this branch
  const tagGenerator = github.tagIterator();
  const candidateTagVersion: Version[] = [];
  for await (const tag of tagGenerator) {
    const tagName = TagName.parse(tag.name);
    if (!tagName) {
      continue;
    }

    if (tagMatchesConfig(tagName, branchPrefix, config.includeComponentInTag)) {
      if (!commitShas.has(tag.sha)) {
        logger.debug(
          `SHA not found in recent commits to branch '${branchToScan}', skipping`
        );
        continue;
      }
      candidateTagVersion.push(tagName.version);
    }
  }
  logger.debug(
    `found ${candidateTagVersion.length} possible tags.`,
    candidateTagVersion
  );

  // Find largest release number (sort descending then return first)
  return candidateTagVersion.sort((a, b) => b.compare(a))[0];
}

function mergeReleaserConfig(
  defaultConfig: Partial<ReleaserConfig>,
  pathConfig: Partial<ReleaserConfig>
): ReleaserConfig {
  return {
    releaseType: pathConfig.releaseType ?? defaultConfig.releaseType ?? 'node',
    bumpMinorPreMajor:
      pathConfig.bumpMinorPreMajor ?? defaultConfig.bumpMinorPreMajor,
    bumpPatchForMinorPreMajor:
      pathConfig.bumpPatchForMinorPreMajor ??
      defaultConfig.bumpPatchForMinorPreMajor,
    versioning: pathConfig.versioning ?? defaultConfig.versioning,
    changelogSections:
      pathConfig.changelogSections ?? defaultConfig.changelogSections,
    changelogPath: pathConfig.changelogPath ?? defaultConfig.changelogPath,
    changelogHost: pathConfig.changelogHost ?? defaultConfig.changelogHost,
    changelogType: pathConfig.changelogType ?? defaultConfig.changelogType,
    releaseAs: pathConfig.releaseAs ?? defaultConfig.releaseAs,
    skipGithubRelease:
      pathConfig.skipGithubRelease ?? defaultConfig.skipGithubRelease,
    draft: pathConfig.draft ?? defaultConfig.draft,
    prerelease: pathConfig.prerelease ?? defaultConfig.prerelease,
    component: pathConfig.component ?? defaultConfig.component,
    packageName: pathConfig.packageName ?? defaultConfig.packageName,
    versionFile: pathConfig.versionFile ?? defaultConfig.versionFile,
    extraFiles: pathConfig.extraFiles ?? defaultConfig.extraFiles,
    includeComponentInTag:
      pathConfig.includeComponentInTag ?? defaultConfig.includeComponentInTag,
    includeVInTag: pathConfig.includeVInTag ?? defaultConfig.includeVInTag,
    tagSeparator: pathConfig.tagSeparator ?? defaultConfig.tagSeparator,
    pullRequestTitlePattern:
      pathConfig.pullRequestTitlePattern ??
      defaultConfig.pullRequestTitlePattern,
    pullRequestHeader:
      pathConfig.pullRequestHeader ?? defaultConfig.pullRequestHeader,
    separatePullRequests:
      pathConfig.separatePullRequests ?? defaultConfig.separatePullRequests,
    skipSnapshot: pathConfig.skipSnapshot ?? defaultConfig.skipSnapshot,
    initialVersion: pathConfig.initialVersion ?? defaultConfig.initialVersion,
    extraLabels: pathConfig.extraLabels ?? defaultConfig.extraLabels,
    excludePaths: pathConfig.excludePaths ?? defaultConfig.excludePaths,
    reviewers: pathConfig.reviewers ?? defaultConfig.reviewers,
  };
}

/**
 * Helper to compare if a list of labels fully contains another list of labels
 * @param {string[]} expected List of labels expected to be contained
 * @param {string[]} existing List of existing labels to consider
 */
function hasAllLabels(expected: string[], existing: string[]): boolean {
  const existingSet = new Set(existing);
  for (const label of expected) {
    if (!existingSet.has(label)) {
      return false;
    }
  }
  return true;
}

function commitsAfterSha(commits: Commit[], lastReleaseSha: string) {
  if (!commits) {
    return [];
  }
  const index = commits.findIndex(commit => commit.sha === lastReleaseSha);
  if (index === -1) {
    return commits;
  }
  return commits.slice(0, index);
}

/**
 * Returns true if the release tag matches the configured component. Returns
 * true if `includeComponentInTag` is false and there is no component in the
 * tag, OR if the tag's component matches the release component.
 */
function tagMatchesConfig(
  tag: TagName,
  branchComponent?: string,
  includeComponentInTag?: boolean
): boolean {
  return (
    (includeComponentInTag && tag.component === branchComponent) ||
    (!includeComponentInTag && !tag.component)
  );
}
