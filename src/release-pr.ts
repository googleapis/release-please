/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PullsListResponseItem } from '@octokit/rest';
import * as semver from 'semver';

import { checkpoint, CheckpointType } from './util/checkpoint';
import { ConventionalCommits } from './conventional-commits';
import { GitHub, GitHubReleasePR, GitHubTag } from './github';
import { Commit } from './graphql-to-commits';
import { Update } from './updaters/update';

const parseGithubRepoUrl = require('parse-github-repo-url');

export enum ReleaseType {
  Node = 'node',
  PHPYoshi = 'php-yoshi',
  JavaAuthYoshi = 'java-auth-yoshi',
  RubyYoshi = 'ruby-yoshi',
}

export interface ReleasePROptions {
  bumpMinorPreMajor?: boolean;
  label: string;
  token?: string;
  repoUrl: string;
  packageName: string;
  releaseAs?: string;
  releaseType: ReleaseType;
  apiUrl: string;
  proxyKey?: string;
  snapshot?: boolean;
  lastPackageVersion?: string;
}

export interface ReleaseCandidate {
  version: string;
  previousTag?: string;
}

export class ReleasePR {
  apiUrl: string;
  labels: string[];
  gh: GitHub;
  bumpMinorPreMajor?: boolean;
  repoUrl: string;
  token: string | undefined;
  packageName: string;
  releaseAs?: string;
  releaseType: ReleaseType;
  proxyKey?: string;
  snapshot?: boolean;
  lastPackageVersion?: string;

  constructor(options: ReleasePROptions) {
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.labels = options.label.split(',');
    this.repoUrl = options.repoUrl;
    this.token = options.token;
    this.packageName = options.packageName;
    this.releaseAs = options.releaseAs;
    this.releaseType = options.releaseType;
    this.apiUrl = options.apiUrl;
    this.proxyKey = options.proxyKey;
    this.snapshot = options.snapshot;
    // drop a `v` prefix if provided:
    this.lastPackageVersion = options.lastPackageVersion
      ? options.lastPackageVersion.replace(/^v/, '')
      : undefined;

    this.gh = this.gitHubInstance();
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

  private async closeStaleReleasePRs(currentPRNumber: number) {
    const prs: PullsListResponseItem[] = await this.gh.findOpenReleasePRs(
      this.labels
    );
    for (let i = 0, pr: PullsListResponseItem; i < prs.length; i++) {
      pr = prs[i];
      // don't close the most up-to-date release PR.
      if (pr.number !== currentPRNumber) {
        checkpoint(`closing pull #${pr.number}`, CheckpointType.Failure);
        await this.gh.closePR(pr.number);
      }
    }
  }

  protected async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined
  ): Promise<ReleaseCandidate> {
    const previousTag = latestTag ? latestTag.name : undefined;
    let version = latestTag ? latestTag.version : '1.0.0';

    if (latestTag && !this.releaseAs) {
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
    labels = false
  ): Promise<Commit[]> {
    const commits = await this.gh.commitsSinceSha(sha, perPage, labels);
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

  protected gitHubInstance(): GitHub {
    const [owner, repo] = parseGithubRepoUrl(this.repoUrl);
    return new GitHub({
      token: this.token,
      owner,
      repo,
      apiUrl: this.apiUrl,
      proxyKey: this.proxyKey,
    });
  }

  protected async openPR(
    sha: string,
    changelogEntry: string,
    updates: Update[],
    version: string
  ) {
    const title = `chore: release ${version}`;
    const body = `:robot: I have created a release \\*beep\\* \\*boop\\* \n---\n${changelogEntry}\n\nThis PR was generated with [Release Please](https://github.com/googleapis/release-please).`;
    const pr: number = await this.gh.openPR({
      branch: `release-v${version}`,
      version,
      sha,
      updates,
      title,
      body,
      labels: this.labels,
    });
    // a return of -1 indicates that PR was not updated.
    if (pr > 0) {
      await this.gh.addLabels(pr, this.labels);
      await this.closeStaleReleasePRs(pr);
    }
  }

  protected changelogEmpty(changelogEntry: string) {
    return changelogEntry.split('\n').length === 1;
  }
}
