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
import {GitHub, GitHubRelease} from './github';
import {Version, VersionsMap} from './version';
import {Commit} from './commit';
import {PullRequest} from './pull-request';
import {logger} from './util/logger';
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
import {PullRequestBody} from './util/pull-request-body';
import {Merge} from './plugins/merge';
import {ReleasePleaseManifest} from './updaters/release-please-manifest';

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
  skipGithubRelease?: boolean;
  draft?: boolean;
  draftPullRequest?: boolean;
  component?: string;
  packageName?: string;
  includeComponentInTag?: boolean;
  pullRequestTitlePattern?: string;

  // Changelog options
  changelogSections?: ChangelogSection[];
  changelogPath?: string;
  changelogType?: ChangelogNotesType;

  // Ruby-only
  versionFile?: string;
  // Java-only
  extraFiles?: string[];
}

export interface CandidateReleasePullRequest {
  path: string;
  pullRequest: ReleasePullRequest;
  config: ReleaserConfig;
}

export interface CandidateRelease extends Release {
  pullRequest: PullRequest;
  draft?: boolean;
  path: string;
}

interface ReleaserConfigJson {
  'release-type'?: ReleaseType;
  'bump-minor-pre-major'?: boolean;
  'bump-patch-for-minor-pre-major'?: boolean;
  'changelog-sections'?: ChangelogSection[];
  'release-as'?: string;
  'skip-github-release'?: boolean;
  draft?: boolean;
  'draft-pull-request'?: boolean;
  label?: string;
  'release-label'?: string;
  'include-component-in-tag'?: boolean;
  'changelog-type'?: ChangelogNotesType;
  'pull-request-title-pattern'?: string;

  // Ruby-only
  'version-file'?: string;
  // Java-only
  'extra-files'?: string[];
}

export interface ManifestOptions {
  bootstrapSha?: string;
  lastReleaseSha?: string;
  alwaysLinkLocal?: boolean;
  separatePullRequests?: boolean;
  plugins?: PluginType[];
  fork?: boolean;
  signoff?: string;
  manifestPath?: string;
  labels?: string[];
  releaseLabels?: string[];
  draft?: boolean;
  draftPullRequest?: boolean;
}

interface ReleaserPackageConfig extends ReleaserConfigJson {
  'package-name'?: string;
  component?: string;
  'changelog-path'?: string;
}

export type PluginType = 'node-workspace' | 'cargo-workspace';

/**
 * This is the schema of the manifest config json
 */
export interface ManifestConfig extends ReleaserConfigJson {
  packages: Record<string, ReleaserPackageConfig>;
  'bootstrap-sha'?: string;
  'last-release-sha'?: string;
  'always-link-local'?: boolean;
  plugins?: PluginType[];
  'separate-pull-requests'?: boolean;
}
// path => version
export type ReleasedVersions = Record<string, Version>;
// path => config
export type RepositoryConfig = Record<string, ReleaserConfig>;

export const DEFAULT_RELEASE_PLEASE_CONFIG = 'release-please-config.json';
export const DEFAULT_RELEASE_PLEASE_MANIFEST = '.release-please-manifest.json';
export const ROOT_PROJECT_PATH = '.';
const DEFAULT_COMPONENT_NAME = '';
const DEFAULT_LABELS = ['autorelease: pending'];
const DEFAULT_RELEASE_LABELS = ['autorelease: tagged'];

export const MANIFEST_PULL_REQUEST_TITLE_PATTERN = 'chore: release ${branch}';

interface CreatedRelease extends GitHubRelease {
  path: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
}

export class Manifest {
  private repository: Repository;
  private github: GitHub;
  readonly repositoryConfig: RepositoryConfig;
  readonly releasedVersions: ReleasedVersions;
  private targetBranch: string;
  private separatePullRequests: boolean;
  readonly fork: boolean;
  private signoffUser?: string;
  private labels: string[];
  private releaseLabels: string[];
  private plugins: PluginType[];
  private _strategiesByPath?: Record<string, Strategy>;
  private _pathsByComponent?: Record<string, string>;
  private manifestPath: string;
  private bootstrapSha?: string;
  private lastReleaseSha?: string;
  private draft?: boolean;
  private draftPullRequest?: boolean;

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
    this.repositoryConfig = repositoryConfig;
    this.releasedVersions = releasedVersions;
    this.manifestPath =
      manifestOptions?.manifestPath || DEFAULT_RELEASE_PLEASE_MANIFEST;
    this.separatePullRequests = manifestOptions?.separatePullRequests || false;
    this.plugins = manifestOptions?.plugins || [];
    this.fork = manifestOptions?.fork || false;
    this.signoffUser = manifestOptions?.signoff;
    this.releaseLabels =
      manifestOptions?.releaseLabels || DEFAULT_RELEASE_LABELS;
    this.labels = manifestOptions?.labels || DEFAULT_LABELS;
    this.bootstrapSha = manifestOptions?.bootstrapSha;
    this.lastReleaseSha = manifestOptions?.lastReleaseSha;
    this.draft = manifestOptions?.draft;
    this.draftPullRequest = manifestOptions?.draftPullRequest;
  }

  /**
   * Create a Manifest from config files in the repository.
   *
   * @param {GitHub} github GitHub client
   * @param {string} targetBranch The releaseable base branch
   * @param {string} configFile Optional. The path to the manifest config file
   * @param {string} manifestFile Optional. The path to the manifest versions file
   * @returns {Manifest}
   */
  static async fromManifest(
    github: GitHub,
    targetBranch: string,
    configFile: string = DEFAULT_RELEASE_PLEASE_CONFIG,
    manifestFile: string = DEFAULT_RELEASE_PLEASE_MANIFEST,
    manifestOptionOverrides: ManifestOptions = {}
  ): Promise<Manifest> {
    const [
      {config: repositoryConfig, options: manifestOptions},
      releasedVersions,
    ] = await Promise.all([
      parseConfig(github, configFile, targetBranch),
      parseReleasedVersions(github, manifestFile, targetBranch),
    ]);
    return new Manifest(
      github,
      targetBranch,
      repositoryConfig,
      releasedVersions,
      {...manifestOptions, ...manifestOptionOverrides}
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
    const component = await strategy.getComponent();
    const releasedVersions: ReleasedVersions = {};
    const latestVersion = await latestReleaseVersion(
      github,
      targetBranch,
      config.includeComponentInTag ? component : '',
      config.pullRequestTitlePattern
    );
    if (latestVersion) {
      releasedVersions[path] = latestVersion;
    }
    return new Manifest(
      github,
      targetBranch,
      repositoryConfig,
      releasedVersions,
      manifestOptions
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
  async buildPullRequests(): Promise<ReleasePullRequest[]> {
    logger.info('Building pull requests');
    const pathsByComponent = await this.getPathsByComponent();
    const strategiesByPath = await this.getStrategiesByPath();

    // Collect all the SHAs of the latest release packages
    logger.info('Collecting release commit SHAs');
    let releasesFound = 0;
    const expectedReleases = Object.keys(strategiesByPath).length;

    // SHAs by path
    const releaseShasByPath: Record<string, string> = {};

    // Releases by path
    const releasesByPath: Record<string, Release> = {};
    for await (const release of this.github.releaseIterator(400)) {
      // logger.debug(release);
      const tagName = TagName.parse(release.tagName);
      if (!tagName) {
        logger.warn(`Unable to parse release name: ${release.name}`);
        continue;
      }
      const component = tagName.component || DEFAULT_COMPONENT_NAME;
      const path = pathsByComponent[component];
      if (!path) {
        logger.warn(
          `Found release tag with component '${component}', but not configured in manifest`
        );
        continue;
      }
      const expectedVersion = this.releasedVersions[path];
      if (!expectedVersion) {
        logger.warn(
          `Unable to find expected version for path '${path}' in manifest`
        );
        continue;
      }
      if (expectedVersion.toString() === tagName.version.toString()) {
        logger.debug(`Found release for path ${path}, ${release.tagName}`);
        releaseShasByPath[path] = release.sha;
        releasesByPath[path] = {
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

    const needsBootstrap = releasesFound < expectedReleases;
    if (releasesFound < expectedReleases) {
      logger.warn(
        `Expected ${expectedReleases} releases, only found ${releasesFound}`
      );
    }
    for (const path in releasesByPath) {
      const release = releasesByPath[path];
      logger.debug(
        `release for path: ${path}, version: ${release.tag.version.toString()}, sha: ${
          release.sha
        }`
      );
    }

    // iterate through commits and collect commits until we have
    // seen all release commits
    logger.info('Collecting commits since all latest releases');
    const commits: Commit[] = [];
    const commitGenerator = this.github.mergeCommitIterator(
      this.targetBranch,
      500
    );
    const releaseShas = new Set(Object.values(releaseShasByPath));
    logger.debug(releaseShas);
    const expectedShas = releaseShas.size;

    // sha => release pull request
    const releasePullRequestsBySha: Record<string, PullRequest> = {};
    let releaseCommitsFound = 0;
    for await (const commit of commitGenerator) {
      if (releaseShas.has(commit.sha)) {
        if (commit.pullRequest) {
          releasePullRequestsBySha[commit.sha] = commit.pullRequest;
        } else {
          logger.warn(
            `Release SHA ${commit.sha} did not have an associated pull request`
          );
        }
        releaseCommitsFound += 1;
      }
      if (this.lastReleaseSha && this.lastReleaseSha === commit.sha) {
        logger.info(
          `Using configured lastReleaseSha ${this.lastReleaseSha} as last commit.`
        );
        break;
      } else if (needsBootstrap && commit.sha === this.bootstrapSha) {
        logger.info(
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
      });
    }

    if (releaseCommitsFound < expectedShas) {
      logger.warn(
        `Expected ${expectedShas} commits, only found ${releaseCommitsFound}`
      );
    }

    // split commits by path
    logger.info(`Splitting ${commits.length} commits by path`);
    const cs = new CommitSplit({
      includeEmpty: true,
      packagePaths: Object.keys(this.repositoryConfig),
    });
    const commitsPerPath = cs.split(commits);

    let newReleasePullRequests: CandidateReleasePullRequest[] = [];
    for (const path in this.repositoryConfig) {
      const config = this.repositoryConfig[path];
      logger.info(`Building candidate release pull request for path: ${path}`);
      logger.debug(`type: ${config.releaseType}`);
      logger.debug(`targetBranch: ${this.targetBranch}`);
      const pathCommits = commitsAfterSha(
        path === ROOT_PROJECT_PATH ? commits : commitsPerPath[path],
        releaseShasByPath[path]
      );
      if (!pathCommits || pathCommits.length === 0) {
        logger.info(`No commits for path: ${path}, skipping`);
        continue;
      }
      logger.debug(`commits: ${pathCommits.length}`);
      const latestReleasePullRequest =
        releasePullRequestsBySha[releaseShasByPath[path]];
      if (!latestReleasePullRequest) {
        logger.warn('No latest release pull request found.');
      }

      const strategy = strategiesByPath[path];
      let latestRelease = releasesByPath[path];
      if (
        !latestRelease &&
        this.releasedVersions[path].toString() !== '0.0.0'
      ) {
        const version = this.releasedVersions[path];
        const component = await strategy.getComponent();
        logger.info(
          `No latest release found for path: ${path}, component: ${component}, but a previous version (${version.toString()}) was specified in the manifest.`
        );
        latestRelease = {
          tag: new TagName(version, component),
          sha: '',
          notes: '',
        };
      }
      const releasePullRequest = await strategy.buildReleasePullRequest(
        pathCommits,
        latestRelease,
        config.draftPullRequest ?? this.draftPullRequest,
        this.labels
      );
      if (releasePullRequest) {
        if (releasePullRequest.version) {
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

    // Build plugins
    const plugins = this.plugins.map(pluginType =>
      buildPlugin({
        type: pluginType,
        github: this.github,
        targetBranch: this.targetBranch,
        repositoryConfig: this.repositoryConfig,
      })
    );

    // Combine pull requests into 1 unless configured for separate
    // pull requests
    if (!this.separatePullRequests) {
      plugins.push(
        new Merge(this.github, this.targetBranch, this.repositoryConfig)
      );
    }

    for (const plugin of plugins) {
      newReleasePullRequests = await plugin.run(newReleasePullRequests);
    }

    return newReleasePullRequests.map(
      pullRequestWithConfig => pullRequestWithConfig.pullRequest
    );
  }

  /**
   * Opens/updates all candidate release pull requests for this repository.
   *
   * @returns {number[]} Pull request numbers of release pull requests
   */
  async createPullRequests(): Promise<(PullRequest | undefined)[]> {
    const candidatePullRequests = await this.buildPullRequests();
    if (candidatePullRequests.length === 0) {
      return [];
    }

    // if there are any merged, pending release pull requests, don't open
    // any new release PRs
    const mergedPullRequestsGenerator = this.findMergedReleasePullRequests();
    for await (const _ of mergedPullRequestsGenerator) {
      logger.warn(
        'There are untagged, merged release PRs outstanding - aborting'
      );
      return [];
    }

    // collect open release pull requests
    logger.info('Looking for open release pull requests');
    const openPullRequests: PullRequest[] = [];
    const generator = this.github.pullRequestIterator(
      this.targetBranch,
      'OPEN'
    );
    for await (const openPullRequest of generator) {
      if (
        hasAllLabels(this.labels, openPullRequest.labels) &&
        BranchName.parse(openPullRequest.headBranchName) &&
        PullRequestBody.parse(openPullRequest.body)
      ) {
        openPullRequests.push(openPullRequest);
      }
    }
    logger.info(`found ${openPullRequests.length} open release pull requests.`);

    const promises: Promise<PullRequest | undefined>[] = [];
    for (const pullRequest of candidatePullRequests) {
      promises.push(
        this.createOrUpdatePullRequest(pullRequest, openPullRequests)
      );
    }
    return await Promise.all(promises);
  }

  private async createOrUpdatePullRequest(
    pullRequest: ReleasePullRequest,
    openPullRequests: PullRequest[]
  ): Promise<PullRequest | undefined> {
    // look for existing, open pull rquest
    const existing = openPullRequests.find(
      openPullRequest =>
        openPullRequest.headBranchName === pullRequest.headRefName
    );
    if (existing) {
      // If unchanged, no need to push updates
      if (existing.body === pullRequest.body.toString()) {
        logger.info(
          `PR https://github.com/${this.repository.owner}/${this.repository.repo}/pull/${existing.number} remained the same`
        );
        return undefined;
      }
      const updatedPullRequest = await this.github.updatePullRequest(
        existing.number,
        pullRequest,
        this.targetBranch,
        {
          fork: this.fork,
          signoffUser: this.signoffUser,
        }
      );
      return updatedPullRequest;
    } else {
      const newPullRequest = await this.github.createReleasePullRequest(
        pullRequest,
        this.targetBranch,
        {
          fork: this.fork,
          signoffUser: this.signoffUser,
        }
      );
      return newPullRequest;
    }
  }

  private async *findMergedReleasePullRequests() {
    // Find merged release pull requests
    const pullRequestGenerator = this.github.pullRequestIterator(
      this.targetBranch,
      'MERGED',
      200
    );
    for await (const pullRequest of pullRequestGenerator) {
      if (!hasAllLabels(this.labels, pullRequest.labels)) {
        continue;
      }
      logger.debug(
        `Found pull request #${pullRequest.number}: '${pullRequest.title}'`
      );

      const pullRequestBody = PullRequestBody.parse(pullRequest.body);
      if (!pullRequestBody) {
        logger.debug('could not parse pull request body as a release PR');
        continue;
      }
      yield pullRequest;
    }
  }

  /**
   * Find merged, untagged releases and build candidate releases to tag.
   *
   * @returns {CandidateRelease[]} List of release candidates
   */
  async buildReleases(): Promise<CandidateRelease[]> {
    logger.info('Building releases');
    const strategiesByPath = await this.getStrategiesByPath();

    // Find merged release pull requests
    const generator = await this.findMergedReleasePullRequests();
    const releases: CandidateRelease[] = [];
    for await (const pullRequest of generator) {
      logger.info('Looking at files touched by path');
      const cs = new CommitSplit({
        includeEmpty: true,
        packagePaths: Object.keys(this.repositoryConfig),
      });
      const commits = [
        {
          sha: pullRequest.sha!,
          message: pullRequest.title,
          files: pullRequest.files,
        },
      ];
      const commitsPerPath = cs.split(commits);
      for (const path in this.repositoryConfig) {
        const config = this.repositoryConfig[path];
        logger.info(`Building release for path: ${path}`);
        logger.debug(`type: ${config.releaseType}`);
        logger.debug(`targetBranch: ${this.targetBranch}`);
        const pathCommits =
          path === ROOT_PROJECT_PATH ? commits : commitsPerPath[path];
        if (!pathCommits || pathCommits.length === 0) {
          logger.info(`No commits for path: ${path}, skipping`);
          continue;
        }
        const strategy = strategiesByPath[path];
        const release = await strategy.buildRelease(pullRequest);
        if (release) {
          releases.push({
            ...release,
            path,
            pullRequest,
            draft: config.draft ?? this.draft,
          });
        }
      }
    }

    return releases;
  }

  /**
   * Find merged, untagged releases. For each release, create a GitHub release,
   * comment on the pull request used to generated it and update the pull request
   * labels.
   *
   * @returns {GitHubRelease[]} List of created GitHub releases
   */
  async createReleases(): Promise<(CreatedRelease | undefined)[]> {
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

  private async createReleasesForPullRequest(
    releases: CandidateRelease[],
    pullRequest: PullRequest
  ): Promise<CreatedRelease[]> {
    // create the release
    const promises: Promise<CreatedRelease>[] = [];
    for (const release of releases) {
      promises.push(this.createRelease(release));
    }
    const githubReleases = await Promise.all(promises);

    // adjust tags on pullRequest
    await Promise.all([
      this.github.removeIssueLabels(this.labels, pullRequest.number),
      this.github.addIssueLabels(this.releaseLabels, pullRequest.number),
    ]);

    return githubReleases;
  }

  private async createRelease(
    release: CandidateRelease
  ): Promise<CreatedRelease> {
    const githubRelease = await this.github.createRelease(release, {
      draft: release.draft,
    });

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
      logger.info('Building strategies by path');
      this._strategiesByPath = {};
      for (const path in this.repositoryConfig) {
        const config = this.repositoryConfig[path];
        logger.debug(`${path}: ${config.releaseType}`);
        const strategy = await buildStrategy({
          ...config,
          github: this.github,
          path,
          targetBranch: this.targetBranch,
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
          logger.warn(
            `Multiple paths for ${component}: ${this._pathsByComponent[component]}, ${path}`
          );
        }
        this._pathsByComponent[component] = path;
      }
    }
    return this._pathsByComponent;
  }
}

/**
 * Helper to convert parsed JSON releaser config into ReleaserConfig for
 * the Manifest.
 *
 * @param {ReleaserPackageConfig} config Parsed configuration from JSON file.
 * @returns {ReleaserConfig}
 */
function extractReleaserConfig(config: ReleaserPackageConfig): ReleaserConfig {
  return {
    releaseType: config['release-type'] || 'node', // for backwards-compatibility
    bumpMinorPreMajor: config['bump-minor-pre-major'],
    bumpPatchForMinorPreMajor: config['bump-patch-for-minor-pre-major'],
    changelogSections: config['changelog-sections'],
    changelogPath: config['changelog-path'],
    releaseAs: config['release-as'],
    skipGithubRelease: config['skip-github-release'],
    draft: config.draft,
    draftPullRequest: config['draft-pull-request'],
    component: config['component'],
    packageName: config['package-name'],
    versionFile: config['version-file'],
    extraFiles: config['extra-files'],
    includeComponentInTag: config['include-component-in-tag'],
    changelogType: config['changelog-type'],
    pullRequestTitlePattern: config['pull-request-title-pattern'],
  };
}

/**
 * Helper to convert fetch the manifest config from the repository and
 * parse into configuration for the Manifest.
 *
 * @param {GitHub} github GitHub client
 * @param {string} configFile Path in the repository to the manifest config
 * @param {string} branch Branch to fetch the config file from
 */
async function parseConfig(
  github: GitHub,
  configFile: string,
  branch: string
): Promise<{config: RepositoryConfig; options: ManifestOptions}> {
  const config = await github.getFileJson<ManifestConfig>(configFile, branch);
  const defaultConfig = extractReleaserConfig(config);
  const repositoryConfig: RepositoryConfig = {};
  for (const path in config.packages) {
    repositoryConfig[path] = mergeReleaserConfig(
      defaultConfig,
      extractReleaserConfig(config.packages[path])
    );
  }
  const manifestOptions = {
    bootstrapSha: config['bootstrap-sha'],
    lastReleaseSha: config['last-release-sha'],
    alwaysLinkLocal: config['always-link-local'],
    separatePullRequests: config['separate-pull-requests'],
    plugins: config['plugins'],
  };
  return {config: repositoryConfig, options: manifestOptions};
}

/**
 * Helper to parse the manifest versions file.
 *
 * @param {GitHub} github GitHub client
 * @param {string} manifestFile Path in the repository to the versions file
 * @param {string} branch Branch to fetch the versions file from
 */
async function parseReleasedVersions(
  github: GitHub,
  manifestFile: string,
  branch: string
): Promise<ReleasedVersions> {
  const manifestJson = await github.getFileJson<Record<string, string>>(
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
 * Find the most recent matching release tag on the branch we're
 * configured for.
 *
 * @param {string} prefix - Limit the release to a specific component.
 * @param {boolean} preRelease - Whether or not to return pre-release
 *   versions. Defaults to false.
 */
async function latestReleaseVersion(
  github: GitHub,
  targetBranch: string,
  prefix?: string,
  pullRequestTitlePattern?: string
): Promise<Version | undefined> {
  const branchPrefix = prefix
    ? prefix.endsWith('-')
      ? prefix.replace(/-$/, '')
      : prefix
    : undefined;

  logger.info(
    `Looking for latest release on branch: ${targetBranch} with prefix: ${prefix}`
  );

  // only look at the last 250 or so commits to find the latest tag - we
  // don't want to scan the entire repository history if this repo has never
  // been released
  const generator = github.mergeCommitIterator(targetBranch, 250);
  for await (const commitWithPullRequest of generator) {
    const mergedPullRequest = commitWithPullRequest.pullRequest;
    if (!mergedPullRequest) {
      continue;
    }

    const branchName = BranchName.parse(mergedPullRequest.headBranchName);
    if (!branchName) {
      continue;
    }

    // If branchPrefix is specified, ensure it is found in the branch name.
    // If branchPrefix is not specified, component should also be undefined.
    if (branchName.getComponent() !== branchPrefix) {
      continue;
    }

    const pullRequestTitle = PullRequestTitle.parse(
      mergedPullRequest.title,
      pullRequestTitlePattern
    );
    if (!pullRequestTitle) {
      continue;
    }

    const version = pullRequestTitle.getVersion();
    if (version?.preRelease?.includes('SNAPSHOT')) {
      // FIXME, don't hardcode this
      continue;
    }

    return version;
  }
  return;
}

function mergeReleaserConfig(
  defaultConfig: ReleaserConfig,
  pathConfig: ReleaserConfig
) {
  return {
    releaseType: pathConfig.releaseType ?? defaultConfig.releaseType,
    bumpMinorPreMajor:
      pathConfig.bumpMinorPreMajor ?? defaultConfig.bumpMinorPreMajor,
    bumpPatchForMinorPreMajor:
      pathConfig.bumpPatchForMinorPreMajor ??
      defaultConfig.bumpPatchForMinorPreMajor,
    changelogSections:
      pathConfig.changelogSections ?? defaultConfig.changelogSections,
    changelogPath: pathConfig.changelogPath ?? defaultConfig.changelogPath,
    releaseAs: pathConfig.releaseAs ?? defaultConfig.releaseAs,
    skipGithubRelease:
      pathConfig.skipGithubRelease ?? defaultConfig.skipGithubRelease,
    draft: pathConfig.draft ?? defaultConfig.draft,
    component: pathConfig.component ?? defaultConfig.component,
    packageName: pathConfig.packageName ?? defaultConfig.packageName,
    versionFile: pathConfig.versionFile ?? defaultConfig.versionFile,
    extraFiles: pathConfig.extraFiles ?? defaultConfig.extraFiles,
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
