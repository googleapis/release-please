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

import * as semver from 'semver';

import {checkpoint, CheckpointType} from './checkpoint';
import {ConventionalCommits} from './conventional-commits';
import {GitHub, GitHubTag} from './github';
import {Changelog} from './updaters/changelog';
import {PackageJson} from './updaters/package-json';
import {Update} from './updaters/update';

const parseGithubRepoUrl = require('parse-github-repo-url');

enum ReleaseType {
  Node = 'node'
}

export interface MintReleaseOptions {
  token?: string;
  repoUrl: string;
  packageName?: string;
  releaseType: ReleaseType;
}

export class MintRelease {
  gh: GitHub;
  repoUrl: string;
  token: string|undefined;
  packageName: string|undefined;
  releaseType: ReleaseType;

  constructor(options: MintReleaseOptions) {
    this.repoUrl = options.repoUrl;
    this.token = options.token;
    this.packageName = options.packageName;
    this.releaseType = options.releaseType;

    this.gh = this.gitHubInstance();
  }
  async run() {
    switch (this.releaseType) {
      case ReleaseType.Node:
        await this.nodeRelease();
        break;
      default:
        throw Error('unknown release type');
    }
  }
  private async nodeRelease() {
    const latestTag: GitHubTag = await this.gh.latestTag();
    const commits: string[] = await this.commits(latestTag);

    const cc = new ConventionalCommits({commits, githubRepoUrl: this.repoUrl});
    const bump = await cc.suggestBump(latestTag.version);
    const version = semver.inc(latestTag.version, bump.releaseType);

    if (!version) throw Error(`failed to increment ${latestTag.version}`);

    const changelogEntry = await cc.generateChangelogEntry(
        {version, currentTag: `v${version}`, previousTag: latestTag.name});

    const updates: Update[] = [];

    updates.push(new Changelog({
      path: 'CHANGELOG.md',
      changelogEntry,
      version,
      packageName: this.packageName
    }));

    updates.push(new PackageJson({
      path: 'package.json',
      changelogEntry,
      version,
      packageName: this.packageName
    }));

    const sha = this.shaFromCommits(commits);
    await this.gh.openPR(
        {branch: `release-v${version}`, version, sha, updates});
  }
  private async commits(latestTag: GitHubTag): Promise<string[]> {
    const commits = await this.gh.commitsSinceSha(latestTag.sha);
    if (commits.length) {
      checkpoint(
          `found ${commits.length} commits since ${latestTag.sha}`,
          CheckpointType.Success);
    } else {
      checkpoint(
          `no commits found since ${latestTag.sha}`, CheckpointType.Failure);
    }
    return commits;
  }
  private gitHubInstance(): GitHub {
    const [owner, repo] = parseGithubRepoUrl(this.repoUrl);
    return new GitHub({token: this.token, owner, repo});
  }
  private shaFromCommits(commits: string[]): string {
    // The conventional commits parser expects an array of string commit
    // messages terminated by `-hash-` followed by the commit sha. We
    // piggyback off of this, and use this sha when choosing a
    // point to branch from for PRs.
    const split = commits[0].split('-hash-');
    return split[split.length - 1].trim();
  }
}
