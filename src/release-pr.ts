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

import { PullsListResponseItem } from '@octokit/rest';
import * as semver from 'semver';

import { checkpoint, CheckpointType } from './util/checkpoint';
import { ConventionalCommits } from './conventional-commits';
import { GitHub, GitHubReleasePR, GitHubTag, OctokitAPIs } from './github';
import { Commit } from './graphql-to-commits';
import { Update } from './updaters/update';

const parseGithubRepoUrl = require('parse-github-repo-url');

export enum ReleaseType {
  Node = 'node',
  PHPYoshi = 'php-yoshi',
  JavaAuthYoshi = 'java-auth-yoshi',
  JavaYoshi = 'java-yoshi',
  Python = 'python',
  Ruby = 'ruby',
  RubyYoshi = 'ruby-yoshi',
}

export interface BuildOptions {
  bumpMinorPreMajor?: boolean;
  label?: string;
  token?: string;
  repoUrl: string;
  packageName: string;
  releaseAs?: string;
  apiUrl: string;
  proxyKey?: string;
  snapshot?: boolean;
  lastPackageVersion?: string;
  octokitAPIs?: OctokitAPIs;
}

export interface ReleasePROptions extends BuildOptions {
  releaseType: ReleaseType;
}

export interface ReleaseCandidate {
  version: string;
  previousTag?: string;
}

const DEFAULT_LABELS = 'autorelease: pending,type: process';

export class ReleasePR {
  apiUrl: string;
  labels: string[];
  gh: GitHub;
  bumpMinorPreMajor?: boolean;
  repoUrl: string;
  token: string | undefined;
  packageName: string;
  releaseAs?: string;
  proxyKey?: string;
  snapshot?: boolean;
  lastPackageVersion?: string;

  constructor(options: ReleasePROptions) {
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.labels = options.label
      ? options.label.split(',')
      : DEFAULT_LABELS.split(',');
    this.repoUrl = options.repoUrl;
    this.token = options.token;
    this.packageName = options.packageName;
    this.releaseAs = options.releaseAs;
    this.apiUrl = options.apiUrl;
    this.proxyKey = options.proxyKey;
    this.snapshot = options.snapshot;
    // drop a `v` prefix if provided:
    this.lastPackageVersion = options.lastPackageVersion
      ? options.lastPackageVersion.replace(/^v/, '')
      : undefined;

    this.gh = this.gitHubInstance(options.octokitAPIs);
  }

  async run() {
    const pr: GitHubReleasePR | undefined = await this.gh.findMergedReleasePR(
      this.labels
    );
    if (pr) {
      // a PR already exists in the autorelease: pending state.
      checkpoint(
        `pull #${pr.number} ${pr.sha} has not yet been released`,
        CheckpointType.Failure
      );
    } else {
      return this._run();
    }
  }

  protected async _run() {
    throw Error('must be implemented by subclass');
  }

  private async closeStaleReleasePRs(
    currentPRNumber: number,
    includePackageName = false
  ) {
    const prs: PullsListResponseItem[] = await this.gh.findOpenReleasePRs(
      this.labels
    );
    for (let i = 0, pr: PullsListResponseItem; i < prs.length; i++) {
      pr = prs[i];
      // don't close the most up-to-date release PR.
      if (pr.number !== currentPRNumber) {
        // on mono repos that maintain multiple open release PRs, we use the
        // pull request title to differentiate between PRs:
        if (includePackageName && !pr.title.includes(` ${this.packageName} `)) {
          continue;
        }
        checkpoint(`closing pull #${pr.number}`, CheckpointType.Failure);
        await this.gh.closePR(pr.number);
      }
    }
  }

  protected defaultInitialVersion(): string {
    return '1.0.0';
  }

  protected async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined
  ): Promise<ReleaseCandidate> {
    const releaseAsRe = /release-as: v?([0-9]+\.[0-9]+\.[0-9a-z-])+$/i;
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
    } else if (latestTag && !this.releaseAs) {
      const bump = await cc.suggestBump(version);
      const candidate: string | null = semver.inc(version, bump.releaseType);
      if (!candidate) throw Error(`failed to increment ${version}`);
      version = candidate;
    } else if (this.releaseAs) {
      version = this.releaseAs;
    }

    return { version, previousTag };
  }

  protected async commits(
    sha?: string,
    perPage = 100,
    labels = false,
    path: string | null = null
  ): Promise<Commit[]> {
    const commits = await this.gh.commitsSinceSha(sha, perPage, labels, path);
    if (commits.length) {
      checkpoint(
        `found ${commits.length} commits since ${sha}`,
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
      owner,
      repo,
      apiUrl: this.apiUrl,
      proxyKey: this.proxyKey,
      octokitAPIs,
    });
  }

  protected async openPR(
    sha: string,
    changelogEntry: string,
    updates: Update[],
    version: string,
    includePackageName = false
  ) {
    const title = includePackageName
      ? `Release ${this.packageName} ${version}`
      : `chore: release ${version}`;
    const body = `:robot: I have created a release \\*beep\\* \\*boop\\* \n---\n${changelogEntry}\n\nThis PR was generated with [Release Please](https://github.com/googleapis/release-please).`;
    const pr: number = await this.gh.openPR({
      branch: includePackageName
        ? `release-${this.packageName}-v${version}`
        : `release-v${version}`,
      version,
      sha,
      updates,
      title,
      body,
      labels: this.labels,
    });
    // a return of -1 indicates that PR was not updated.
    if (pr > 0) {
      await this.gh.addLabels(this.labels, pr);
      await this.closeStaleReleasePRs(pr, includePackageName);
    }
  }

  protected changelogEmpty(changelogEntry: string) {
    return changelogEntry.split('\n').length === 1;
  }
}
