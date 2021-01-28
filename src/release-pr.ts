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
import {SharedOptions} from './';
import {DEFAULT_LABELS, RELEASE_PLEASE} from './constants';
import {Octokit} from '@octokit/rest';
import {PromiseValue} from 'type-fest';
type PullsListResponseItems = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['pulls']['list']>
>['data'];

import * as semver from 'semver';

import {checkpoint, CheckpointType} from './util/checkpoint';
import {ConventionalCommits} from './conventional-commits';
import {GitHub, GitHubTag, OctokitAPIs, MergedGitHubPR} from './github';
import {Commit} from './graphql-to-commits';
import {Update} from './updaters/update';
import {BranchName} from './util/branch-name';
import {extractReleaseNotes} from './util/release-notes';
import {ReleaseType} from './releasers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');

export interface ReleasePROptions extends SharedOptions {
  bumpMinorPreMajor?: boolean;
  // The target release branch
  defaultBranch?: string;
  // Whether to open the pull request from a forked repository
  fork?: boolean;
  // When releasing multiple libraries from one repository, include a prefix
  // on tags and branch names:
  releaseAs?: string;
  snapshot?: boolean;
  // Override the last released version
  lastPackageVersion?: string;
  // Override Octokit APIs to inject an authenticated GitHub client
  octokitAPIs?: OctokitAPIs;
  // Path to version.rb file
  versionFile?: string;
  releaseType: ReleaseType;
  changelogSections?: [];
  // Optionally provide GitHub instance
  github?: GitHub;
}

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

interface GetCommitsOptions {
  sha?: string;
  perPage?: number;
  labels?: boolean;
  path?: string;
}

export interface OpenPROptions {
  sha: string;
  changelogEntry: string;
  updates: Update[];
  version: string;
  includePackageName: boolean;
}

export class ReleasePR {
  apiUrl: string;
  defaultBranch?: string;
  labels: string[];
  fork: boolean;
  gh: GitHub;
  bumpMinorPreMajor?: boolean;
  repoUrl: string;
  token: string | undefined;
  path?: string;
  packageName: string;
  monorepoTags: boolean;
  releaseAs?: string;
  snapshot?: boolean;
  lastPackageVersion?: string;
  changelogSections?: [];
  releaseType: string;
  // Prefix for tags/branches
  packagePrefix: string;

  constructor(options: ReleasePROptions) {
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.defaultBranch = options.defaultBranch;
    this.fork = !!options.fork;
    this.labels = options.label
      ? options.label.split(',')
      : DEFAULT_LABELS.split(',');
    this.repoUrl = options.repoUrl;
    this.token = options.token;
    this.path = options.path;
    this.packageName = options.packageName || '';
    this.monorepoTags = options.monorepoTags || false;
    this.releaseAs = options.releaseAs;
    this.apiUrl = options.apiUrl;
    this.snapshot = options.snapshot;
    // drop a `v` prefix if provided:
    this.lastPackageVersion = options.lastPackageVersion
      ? options.lastPackageVersion.replace(/^v/, '')
      : undefined;

    this.gh = options.github ?? this.gitHubInstance(options.octokitAPIs);

    this.changelogSections = options.changelogSections;
    this.releaseType = options.releaseType;
    this.packagePrefix = this.coercePackagePrefix(this.packageName);
  }

  async run(): Promise<number | undefined> {
    if (this.snapshot && !this.supportsSnapshots()) {
      checkpoint(
        'snapshot releases not supported for this releaser',
        CheckpointType.Failure
      );
      return;
    }
    const mergedPR = await this.gh.findMergedReleasePR(this.labels);
    if (mergedPR) {
      // a PR already exists in the autorelease: pending state.
      checkpoint(
        `pull #${mergedPR.number} ${mergedPR.sha} has not yet been released`,
        CheckpointType.Failure
      );
      return undefined;
    } else {
      return this._run();
    }
  }

  protected async _run(): Promise<number | undefined> {
    throw Error('must be implemented by subclass');
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
    for (let i = 0, pr; i < prs.length; i++) {
      pr = prs[i];
      // don't close the most up-to-date release PR.
      if (pr.number !== currentPRNumber) {
        // on mono repos that maintain multiple open release PRs, we use the
        // pull request title to differentiate between PRs:
        if (includePackageName && !pr.title.includes(` ${this.packageName} `)) {
          continue;
        }
        checkpoint(
          `closing pull #${pr.number} on ${this.repoUrl}`,
          CheckpointType.Failure
        );
        await this.gh.closePR(pr.number);
      }
    }
  }

  protected defaultInitialVersion(): string {
    return '1.0.0';
  }

  // A releaser can implement this method to automatically detect
  // the release name when creating a GitHub release, for instance by returning
  // name in package.json, or setup.py.
  static async lookupPackageName(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gh: GitHub,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    path?: string
  ): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

  tagSeparator(): string {
    return '-';
  }

  protected async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined,
    preRelease = false
  ): Promise<ReleaseCandidate> {
    const releaseAsRe = /release-as:\s*v?([0-9]+\.[0-9]+\.[0-9a-z]+(-[0-9a-z.]+)?)\s*/i;
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
      checkpoint(
        `found ${commits.length} commits since ${
          sha ? sha : 'beginning of time'
        }`,
        CheckpointType.Success
      );
    } else {
      checkpoint(`no commits found since ${sha}`, CheckpointType.Failure);
    }
    return commits;
  }

  protected gitHubInstance(octokitAPIs?: OctokitAPIs): GitHub {
    const [owner, repo] = parseGithubRepoUrl(this.repoUrl);
    return new GitHub({
      token: this.token,
      defaultBranch: this.defaultBranch,
      owner,
      repo,
      apiUrl: this.apiUrl,
      octokitAPIs,
    });
  }

  // Override this method to modify the pull request title
  protected async buildPullRequestTitle(
    version: string,
    includePackageName: boolean
  ): Promise<string> {
    return includePackageName
      ? `chore: release ${this.packageName} ${version}`
      : `chore: release ${version}`;
  }

  // Override this method to detect the release version from code (if it cannot be
  // inferred from the release PR head branch)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected detectReleaseVersionFromTitle(title: string): string | undefined {
    const pattern = /^chore: release ?(?<component>.*) (?<version>\d+\.\d+\.\d+)$/;
    const match = title.match(pattern);
    if (match?.groups) {
      return match.groups['version'];
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
    if (includePackageName && this.packageName) {
      return BranchName.ofComponentVersion(this.packagePrefix, version);
    }
    return BranchName.ofVersion(version);
  }

  // Override this method to modify the pull request body
  protected async buildPullRequestBody(
    version: string,
    changelogEntry: string
  ): Promise<string> {
    return `:robot: I have created a release \\*beep\\* \\*boop\\* \n---\n${changelogEntry}\n\nThis PR was generated with [Release Please](https://github.com/googleapis/${RELEASE_PLEASE}). See [documentation](https://github.com/googleapis/${RELEASE_PLEASE}#${RELEASE_PLEASE}).`;
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
      fork: this.fork,
      labels: this.labels,
    });
    // a return of undefined indicates that PR was not updated.
    if (pr) {
      // If the PR is being created from a fork, it will not have permission
      // to add and remove labels from the PR:
      if (!this.fork) {
        await this.gh.addLabels(this.labels, pr);
      } else {
        checkpoint(
          'release labels were not added, due to PR being created from fork',
          CheckpointType.Failure
        );
      }
      checkpoint(
        `${this.repoUrl} find stale PRs with label "${this.labels.join(',')}"`,
        CheckpointType.Success
      );
      if (!this.fork) {
        await this.closeStaleReleasePRs(pr, includePackageName);
      }
    }
    return pr;
  }

  protected changelogEmpty(changelogEntry: string) {
    return changelogEntry.split('\n').length === 1;
  }

  static addPathStatic(file: string, path?: string) {
    file = file.replace(/^[/\\]/, '');
    if (path === undefined) {
      return file;
    } else {
      path = path.replace(/[/\\]$/, '');
      return `${path}/${file}`;
    }
  }

  addPath(file: string) {
    return ReleasePR.addPathStatic(file, this.path);
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

  private buildReleaseTag(version: string, packagePrefix?: string): string {
    if (this.monorepoTags && packagePrefix) {
      const tagSeparator = this.tagSeparator();
      return `${packagePrefix}${tagSeparator}v${version}`;
    }
    return `v${version}`;
  }

  // Logic for determining what to include in a GitHub release.
  async buildRelease(
    changelogPath: string
  ): Promise<CandidateRelease | undefined> {
    const mergedPR = await this.findMergedRelease();
    if (!mergedPR) {
      checkpoint('No merged release PR found', CheckpointType.Failure);
      return undefined;
    }
    const branchName = BranchName.parse(mergedPR.headRefName);
    const version = await this.detectReleaseVersion(mergedPR, branchName);
    if (!version) {
      checkpoint('Unable to detect release version', CheckpointType.Failure);
      return undefined;
    }

    const tag = this.buildReleaseTag(version, this.packagePrefix);
    const changelogContents = (await this.gh.getFileContents(changelogPath))
      .parsedContent;
    const notes = extractReleaseNotes(changelogContents, version);

    return {
      sha: mergedPR.sha,
      tag,
      notes,
      name: this.packagePrefix,
      version,
      pullNumber: mergedPR.number,
    };
  }

  private async findMergedRelease(): Promise<MergedGitHubPR | undefined> {
    const targetBranch = await this.getDefaultBranch();
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
            this.packagePrefix
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

  // Parse the package prefix for releases from the full package name
  protected coercePackagePrefix(packageName: string): string {
    return packageName;
  }

  protected async getDefaultBranch(): Promise<string> {
    if (!this.defaultBranch) {
      this.defaultBranch = await this.gh.getDefaultBranch();
    }

    return this.defaultBranch;
  }
}
