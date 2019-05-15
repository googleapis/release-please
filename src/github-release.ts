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

import chalk from 'chalk';
import {checkpoint, CheckpointType} from './checkpoint';
// import {ConventionalCommits} from './conventional-commits';
import {GitHub, GitHubReleasePR} from './github';

const parseGithubRepoUrl = require('parse-github-repo-url');

export interface GitHubReleaseOptions {
  label: string;
  repoUrl: string;
  token: string;
}

export class GitHubRelease {
  changelogPath: string;
  gh: GitHub;
  label: string;
  repoUrl: string;
  token: string|undefined;

  constructor(options: GitHubReleaseOptions) {
    this.label = options.label;
    this.repoUrl = options.repoUrl;
    this.token = options.token;

    this.changelogPath = 'CHANGELOG.md';

    this.gh = this.gitHubInstance();
  }

  async createRelease() {
    const gitHubReleasePR: GitHubReleasePR|undefined =
        await this.gh.latestReleasePR(this.label);
    if (gitHubReleasePR) {
      checkpoint(
          `found release branch ${chalk.green(gitHubReleasePR.version)} at ${
              chalk.green(gitHubReleasePR.sha)}`,
          CheckpointType.Success);

      const changelogContents =
          await this.gh.getFileContents(this.changelogPath);
      const latestReleaseNotes = GitHubRelease.extractLatestReleaseNotes(
          changelogContents, gitHubReleasePR.version);
      checkpoint(
          `found release notes: \n---\n${
              chalk.grey(latestReleaseNotes)}\n---\n`,
          CheckpointType.Success);

      await this.gh.createRelease(
          gitHubReleasePR.version, gitHubReleasePR.sha, latestReleaseNotes);
      await this.gh.removeLabel(this.label, gitHubReleasePR.number);
    } else {
      checkpoint('no recent release PRs found', CheckpointType.Failure);
    }
  }

  private gitHubInstance(): GitHub {
    const [owner, repo] = parseGithubRepoUrl(this.repoUrl);
    return new GitHub({token: this.token, owner, repo});
  }

  static extractLatestReleaseNotes(changelogContents: string, version: string):
      string {
    version = version.replace(/^v/, '');
    const latestRe = new RegExp(
        `## v?\\[?${version}[^\\n]*\\n(.*?)(\\n##\\s|($(?![\r\n])))`, 'ms');
    const match = changelogContents.match(latestRe);
    if (!match) {
      throw Error('could not find changelog entry corresponding to release PR');
    }
    return match[1];
  }
}
