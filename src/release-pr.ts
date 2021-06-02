// Copyright 2019 Google LLC
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

// See: https://github.com/octokit/rest.js/issues/1624
//  https://github.com/octokit/types.ts/issues/25.
import {ReleasePRConstructorOptions} from './';
import {RELEASE_PLEASE, DEFAULT_LABELS} from './constants';
import {Octokit} from '@octokit/rest';
import {PromiseValue} from 'type-fest';
type PullsListResponseItems = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['pulls']['list']>
>['data'];

import * as semver from 'semver';

import {ConventionalCommits, ChangelogSection} from './conventional-commits';
import {GitHub, GitHubTag, MergedGitHubPR} from './github';
import {Commit} from './graphql-to-commits';
import {Update} from './updaters/update';
import {BranchName} from './util/branch-name';
import {extractReleaseNotes} from './util/release-notes';
import {PullRequestTitle} from './util/pull-request-title';
import {Changelog} from './updaters/changelog';
import {logger} from './util/logger';
import {CCVersion} from './cc_versions';

export interface ReleaseCandidate {
  version: string;
  previousTag?: string;
}

export interface CandidateRelease {
  sha: string;
  tag: string;
  notes: string;
  name: string;
  version: string;
  pullNumber: number;
}

export interface GetCommitsOptions {
  sha?: string;
  perPage?: number;
  labels?: boolean;
  path?: string;
}

export interface PackageName {
  name: string;
  // Representation when package name needs to appear
  // in git refs (like branch names or tag names)
  // https://git-scm.com/docs/git-check-ref-format
  getComponent: () => string;
}

export interface OpenPROptions {
  sha: string;
  changelogEntry: string;
  updates: Update[];
  version: string;
  includePackageName: boolean;
}

export class ReleasePR {
  labels: string[];
  gh: GitHub;
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;
  versionBumpStrategy?: CCVersion;
  path?: string;
  packageName: string;
  monorepoTags: boolean;
  releaseAs?: string;
  snapshot?: boolean;
  lastPackageVersion?: string;
  changelogSections?: ChangelogSection[];
  changelogPath = 'CHANGELOG.md';
  pullRequestTitlePattern?: string;
  extraFiles: string[];

  constructor(options: ReleasePRConstructorOptions) {
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.bumpPatchForMinorPreMajor = options.bumpPatchForMinorPreMajor || false;
    this.versionBumpStrategy = options.versionBumpStrategy;
    this.labels = options.labels ?? DEFAULT_LABELS;
    // undefined represents the root path of the library, if the special
    // '.' path is provided, simply ignore it:
    this.path = options.path !== '.' ? options.path : undefined;
    this.packageName = options.packageName || '';
    this.monorepoTags = options.monorepoTags || false;
    this.releaseAs = options.releaseAs;
    this.snapshot = options.snapshot;
    // drop a `v` prefix if provided:
    this.lastPackageVersion = options.lastPackageVersion
      ? options.lastPackageVersion.replace(/^v/, '')
      : undefined;

    this.gh = options.github;

    this.changelogSections = options.changelogSections;
    this.changelogPath = options.changelogPath ?? this.changelogPath;
    this.pullRequestTitlePattern = options.pullRequestTitlePattern;
    this.extraFiles = options.extraFiles ?? [];
  }

  // A releaser can override this method to automatically detect the
  // packageName from source code (e.g. package.json "name")
  async getPackageName(): Promise<PackageName> {
    return {
      name: this.packageName,
      getComponent: () => this.packageName,
    };
  }

  async getOpenPROptions(
    commits: Commit[],
    latestTag?: GitHubTag
  ): Promise<OpenPROptions | undefined> {
    await this.validateConfiguration();
    return this._getOpenPROptions(commits, latestTag);
  }

  protected async _getOpenPROptions(
    commits: Commit[],
    latestTag?: GitHubTag
  ): Promise<OpenPROptions | undefined> {
    const cc = new ConventionalCommits({
      commits,
      owner: this.gh.owner,
      repository: this.gh.repo,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      bumpPatchForMinorPreMajor: this.bumpPatchForMinorPreMajor,
      versionBumpStrategy: this.versionBumpStrategy,
      changelogSections: this.changelogSections,
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      cc,
      latestTag
    );

    const changelogEntry: string = await cc.generateChangelogEntry({
      version: candidate.version,
      currentTag: await this.normalizeTagName(candidate.version),
      previousTag: candidate.previousTag
        ? await this.normalizeTagName(candidate.previousTag)
        : undefined,
    });

    // don't create a release candidate until user facing changes
    // (fix, feat, BREAKING CHANGE) have been made; a CHANGELOG that's
    // one line is a good indicator that there were no interesting commits.
    if (this.changelogEmpty(changelogEntry)) {
      logger.error(
        `no user facing commits found since ${
          latestTag ? latestTag.sha : 'beginning of time'
        }`
      );
      return undefined;
    }

    const packageName = await this.getPackageName();
    const updates = await this.buildUpdates(
      changelogEntry,
      candidate,
      packageName
    );

    return {
      sha: commits[0].sha!,
      changelogEntry: `${changelogEntry}\n---\n`,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
    };
  }

  async run(): Promise<number | undefined> {
    await this.validateConfiguration();
    if (this.snapshot && !this.supportsSnapshots()) {
      logger.error('snapshot releases not supported for this releaser');
      return;
    }
    const mergedPR = await this.gh.findMergedReleasePR(
      this.labels,
      undefined,
      true,
      100
    );
    if (mergedPR) {
      // a PR already exists in the autorelease: pending state.
      logger.error(
        `pull #${mergedPR.number} ${mergedPR.sha} has not yet been released`
      );
      return undefined;
    } else {
      return this._run();
    }
  }

  protected async _run(): Promise<number | undefined> {
    const packageName = await this.getPackageName();
    const latestTag: GitHubTag | undefined = await this.latestTag(
      this.monorepoTags ? `${packageName.getComponent()}-` : undefined
    );
    const commits: Commit[] = await this.commits({
      sha: latestTag ? latestTag.sha : undefined,
      path: this.path,
    });

    const openPROptions = await this.getOpenPROptions(commits, latestTag);
    return openPROptions ? await this.openPR(openPROptions) : undefined;
  }

  protected async buildUpdates(
    changelogEntry: string,
    candidate: ReleaseCandidate,
    packageName: PackageName
  ): Promise<Update[]> {
    const updates: Update[] = [];

    updates.push(
      new Changelog({
        path: this.changelogPath,
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );
    return updates;
  }

  protected supportsSnapshots(): boolean {
    return false;
  }

  protected async closeStaleReleasePRs(
    currentPRNumber: number,
    includePackageName = false
  ) {
    const prs: PullsListResponseItems = await this.gh.findOpenReleasePRs(
      this.labels
    );
    const packageName = await this.getPackageName();
    for (let i = 0, pr; i < prs.length; i++) {
      pr = prs[i];
      // don't close the most up-to-date release PR.
      if (pr.number !== currentPRNumber) {
        // on mono repos that maintain multiple open release PRs, we use the
        // pull request title to differentiate between PRs:
        if (includePackageName && !pr.title.includes(` ${packageName.name} `)) {
          continue;
        }
        logger.error(`closing pull #${pr.number}`);
        await this.gh.closePR(pr.number);
      }
    }
  }

  defaultInitialVersion(): string {
    return this.bumpMinorPreMajor ? '0.1.0' : '1.0.0';
  }

  tagSeparator(): string {
    return '-';
  }

  protected async normalizeTagName(versionOrTagName: string): Promise<string> {
    if (!this.monorepoTags) {
      return versionOrTagName.replace(/^v?/, 'v');
    }
    const pkgName = await this.getPackageName();
    const tagPrefix = pkgName.getComponent() + this.tagSeparator() + 'v';
    const re = new RegExp(`^(${tagPrefix}|)`);
    return versionOrTagName.replace(re, tagPrefix);
  }

  protected async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined,
    preRelease = false
  ): Promise<ReleaseCandidate> {
    const releaseAsRe =
      /release-as:\s*v?([0-9]+\.[0-9]+\.[0-9a-z]+(-[0-9a-z.]+)?)\s*/i;
    const previousTag = latestTag ? latestTag.name : undefined;
    let version = latestTag ? latestTag.version : this.defaultInitialVersion();

    // If a commit contains the footer release-as: 1.x.x, we use this version
    // from the commit footer rather than the version returned by suggestBump().
    const releaseAsCommit = cc.commits.find((element: Commit) => {
      if (element.message.match(releaseAsRe)) {
        return true;
      } else {
        return false;
      }
    });

    if (releaseAsCommit) {
      const match = releaseAsCommit.message.match(releaseAsRe);
      version = match![1];
    } else if (preRelease) {
      // Handle pre-release format v1.0.0-alpha1, alpha2, etc.
      const [prefix, suffix] = version.split('-');
      const match = suffix?.match(/(?<type>[^0-9]+)(?<number>[0-9]+)/);
      const number = Number(match?.groups?.number || 0) + 1;
      version = `${prefix}-${match?.groups?.type || 'alpha'}${number}`;
    } else if (latestTag && !this.releaseAs) {
      const bump = await cc.suggestBump(version);
      const candidate: string | null = semver.inc(version, bump.releaseType);
      if (!candidate) throw Error(`failed to increment ${version}`);
      version = candidate;
    } else if (this.releaseAs) {
      version = this.releaseAs;
    }

    return {version, previousTag};
  }

  protected async commits(opts: GetCommitsOptions): Promise<Commit[]> {
    const sha = opts.sha;
    const perPage = opts.perPage || 100;
    const labels = opts.labels || false;
    const path = opts.path || undefined;
    const commits = await this.gh.commitsSinceSha(sha, perPage, labels, path);
    if (commits.length) {
      logger.info(
        `found ${commits.length} commits since ${
          sha ? sha : 'beginning of time'
        }`
      );
    } else {
      logger.warn(`no commits found since ${sha}`);
    }
    return commits;
  }

  // Override this method to modify the pull request title
  protected async buildPullRequestTitle(
    version: string,
    includePackageName: boolean
  ): Promise<string> {
    const packageName = await this.getPackageName();
    const pullRequestTitle = includePackageName
      ? PullRequestTitle.ofComponentVersion(
          packageName.name,
          version,
          this.pullRequestTitlePattern
        )
      : PullRequestTitle.ofVersion(version, this.pullRequestTitlePattern);
    return pullRequestTitle.toString();
  }

  // Override this method to detect the release version from code (if it cannot be
  // inferred from the release PR head branch)
  protected detectReleaseVersionFromTitle(title: string): string | undefined {
    const pullRequestTitle = PullRequestTitle.parse(
      title,
      this.pullRequestTitlePattern
    );
    if (pullRequestTitle) {
      return pullRequestTitle.getVersion();
    }
    return undefined;
  }

  // Override this method to modify the pull request head branch name
  // If you modify this, you must ensure that the releaser can parse the tag version
  // from the pull request.
  protected async buildBranchName(
    version: string,
    includePackageName: boolean
  ): Promise<BranchName> {
    const packageName = await this.getPackageName();
    if (includePackageName && packageName) {
      return BranchName.ofComponentVersion(
        (await this.getPackageName()).getComponent(),
        version
      );
    }
    return BranchName.ofVersion(version);
  }

  // Override this method to modify the pull request body
  protected async buildPullRequestBody(
    _version: string,
    changelogEntry: string
  ): Promise<string> {
    return `:robot: I have created a release \\*beep\\* \\*boop\\*\n---\n${changelogEntry}\n\nThis PR was generated with [Release Please](https://github.com/googleapis/${RELEASE_PLEASE}). See [documentation](https://github.com/googleapis/${RELEASE_PLEASE}#${RELEASE_PLEASE}).`;
  }

  protected async openPR(options: OpenPROptions): Promise<number | undefined> {
    const changelogEntry = options.changelogEntry;
    const updates = options.updates;
    const version = options.version;
    const includePackageName = options.includePackageName;
    const title = await this.buildPullRequestTitle(version, includePackageName);
    const body = await this.buildPullRequestBody(version, changelogEntry);
    const branchName = await this.buildBranchName(version, includePackageName);
    const pr: number | undefined = await this.gh.openPR({
      branch: branchName.toString(),
      updates,
      title,
      body,
      labels: this.labels,
    });
    // a return of undefined indicates that PR was not updated.
    if (pr) {
      await this.gh.addLabels(this.labels, pr);
      logger.info(`find stale PRs with label "${this.labels.join(',')}"`);
      await this.closeStaleReleasePRs(pr, includePackageName);
    }
    return pr;
  }

  protected changelogEmpty(changelogEntry: string) {
    return changelogEntry.split('\n').length === 1;
  }

  addPath(file: string) {
    file = file.replace(/^[/\\]/, '');
    if (this.path === undefined) {
      return file;
    } else {
      const path = this.path.replace(/[/\\]$/, '');
      return `${path}/${file}`;
    }
  }

  // BEGIN release functionality

  // Override this method to detect the release version from code (if it cannot be
  // inferred from the release PR head branch)
  protected async detectReleaseVersionFromCode(): Promise<string | undefined> {
    return undefined;
  }

  private async detectReleaseVersion(
    mergedPR: MergedGitHubPR,
    branchName: BranchName | undefined
  ): Promise<string | undefined> {
    // try from branch name
    let version = branchName?.getVersion();
    if (version) {
      return version;
    }

    // try from PR title
    version = this.detectReleaseVersionFromTitle(mergedPR.title);
    if (version) {
      return version;
    }

    // detect from code
    return this.detectReleaseVersionFromCode();
  }

  private formatReleaseTagName(
    version: string,
    packageName: PackageName
  ): string {
    if (this.monorepoTags) {
      return `${packageName.getComponent()}${this.tagSeparator()}v${version}`;
    }
    return `v${version}`;
  }

  private async validateConfiguration() {
    if (this.monorepoTags) {
      const packageName = await this.getPackageName();
      if (packageName.getComponent() === '') {
        throw new Error('package-name required for monorepo releases');
      }
    }
  }

  // Logic for determining what to include in a GitHub release.
  async buildRelease(): Promise<CandidateRelease | undefined> {
    await this.validateConfiguration();
    const mergedPR = await this.findMergedRelease();
    if (!mergedPR) {
      logger.error('No merged release PR found');
      return undefined;
    }
    const branchName = BranchName.parse(mergedPR.headRefName);
    const version = await this.detectReleaseVersion(mergedPR, branchName);
    if (!version) {
      logger.error('Unable to detect release version');
      return undefined;
    }
    return this.buildReleaseForVersion(version, mergedPR);
  }

  async buildReleaseForVersion(
    version: string,
    mergedPR: MergedGitHubPR
  ): Promise<CandidateRelease> {
    const packageName = await this.getPackageName();
    const tag = this.formatReleaseTagName(version, packageName);
    const changelogContents = (
      await this.gh.getFileContents(this.addPath(this.changelogPath))
    ).parsedContent;
    const notes = extractReleaseNotes(changelogContents, version);

    return {
      sha: mergedPR.sha,
      tag,
      notes,
      name: packageName.name,
      version,
      pullNumber: mergedPR.number,
    };
  }

  private async findMergedRelease(): Promise<MergedGitHubPR | undefined> {
    const targetBranch = await this.gh.getDefaultBranch();
    const component = (await this.getPackageName()).getComponent();
    const filter = this.monorepoTags
      ? (pullRequest: MergedGitHubPR) => {
          if (
            this.labels.length > 0 &&
            !this.labels.every(label => pullRequest.labels.includes(label))
          ) {
            return false;
          }
          // in a monorepo, filter PR head branch by component
          return (
            BranchName.parse(pullRequest.headRefName)?.getComponent() ===
            component
          );
        }
      : (pullRequest: MergedGitHubPR) => {
          if (
            this.labels.length > 0 &&
            !this.labels.every(label => pullRequest.labels.includes(label))
          ) {
            return false;
          }
          // accept any release PR head branch pattern
          return !!BranchName.parse(pullRequest.headRefName);
        };
    return await this.gh.findMergedPullRequest(targetBranch, filter);
  }

  /**
   * Normalize version parsing when searching for a latest release.
   *
   * @param version The raw version string
   * @param preRelease Whether to allow pre-release versions or not
   * @returns {string|null} The normalized version string or null if
   *   we want to disallow this version.
   */
  protected normalizeVersion(
    version: string,
    preRelease = false
  ): string | null {
    // Consider any version with a '-' as a pre-release version
    if (!preRelease && version.indexOf('-') >= 0) {
      return null;
    }
    return semver.valid(version);
  }

  /**
   * Find the most recent matching release tag on the branch we're
   * configured for.
   *
   * @param {string} prefix - Limit the release to a specific component.
   * @param {boolean} preRelease - Whether or not to return pre-release
   *   versions. Defaults to false.
   */
  async latestTag(
    prefix?: string,
    preRelease = false
  ): Promise<GitHubTag | undefined> {
    const branchPrefix = prefix?.endsWith('-')
      ? prefix.replace(/-$/, '')
      : prefix;
    // only look at the last 250 or so commits to find the latest tag - we
    // don't want to scan the entire repository history if this repo has never
    // been released
    const generator = this.gh.mergeCommitIterator(250);
    for await (const commitWithPullRequest of generator) {
      const mergedPullRequest = commitWithPullRequest.pullRequest;
      if (!mergedPullRequest) {
        continue;
      }

      const branchName = BranchName.parse(mergedPullRequest.headRefName);
      if (!branchName) {
        continue;
      }

      // If branchPrefix is specified, ensure it is found in the branch name.
      // If branchPrefix is not specified, component should also be undefined.
      if (branchName.getComponent() !== branchPrefix) {
        continue;
      }

      const version = await this.detectReleaseVersion(
        mergedPullRequest,
        branchName
      );
      if (!version) {
        continue;
      }

      // Make sure we did get a valid semver.
      const normalizedVersion = this.normalizeVersion(version, preRelease);
      if (!normalizedVersion) {
        continue;
      }
      return {
        name: await this.normalizeTagName(normalizedVersion),
        sha: mergedPullRequest.sha,
        version: normalizedVersion,
      };
    }

    // did not find a recent merged release PR, fallback to tags on the repo
    return await this.gh.latestTagFallback(prefix, preRelease);
  }
}
