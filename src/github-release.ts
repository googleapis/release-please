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

import chalk = require('chalk');

import { checkpoint, CheckpointType } from './util/checkpoint';
import { GitHub, GitHubReleasePR, OctokitAPIs } from './github';

const parseGithubRepoUrl = require('parse-github-repo-url');
const GITHUB_RELEASE_LABEL = 'autorelease: tagged';

export interface GitHubReleaseOptions {
  label: string;
  repoUrl: string;
  packageName: string;
  token?: string;
  apiUrl: string;
  proxyKey?: string;
  octokitAPIs?: OctokitAPIs;
}

export class GitHubRelease {
  apiUrl: string;
  changelogPath: string;
  gh: GitHub;
  labels: string[];
  repoUrl: string;
  packageName: string;
  token?: string;
  proxyKey?: string;

  constructor(options: GitHubReleaseOptions) {
    this.apiUrl = options.apiUrl;
    this.proxyKey = options.proxyKey;
    this.labels = options.label.split(',');
    this.repoUrl = options.repoUrl;
    this.token = options.token;
    this.packageName = options.packageName;

    this.changelogPath = 'CHANGELOG.md';

    this.gh = this.gitHubInstance(options.octokitAPIs);
  }

  async createRelease() {
    const gitHubReleasePR:
      | GitHubReleasePR
      | undefined = await this.gh.findMergedReleasePR(this.labels);
    if (gitHubReleasePR) {
      checkpoint(
        `found release branch ${chalk.green(
          gitHubReleasePR.version
        )} at ${chalk.green(gitHubReleasePR.sha)}`,
        CheckpointType.Success
      );

      const changelogContents = (
        await this.gh.getFileContents(this.changelogPath)
      ).parsedContent;
      const latestReleaseNotes = GitHubRelease.extractLatestReleaseNotes(
        changelogContents,
        gitHubReleasePR.version
      );
      checkpoint(
        `found release notes: \n---\n${chalk.grey(latestReleaseNotes)}\n---\n`,
        CheckpointType.Success
      );

      await this.gh.createRelease(
        this.packageName,
        gitHubReleasePR.version,
        gitHubReleasePR.sha,
        latestReleaseNotes
      );
      // Add a label indicating that a release has been created on GitHub,
      // but a publication has not yet occurred.
      await this.gh.addLabels([GITHUB_RELEASE_LABEL], gitHubReleasePR.number);
      // Remove 'autorelease: pending' which indicates a GitHub release
      // has not yet been created.
      await this.gh.removeLabels(this.labels, gitHubReleasePR.number);
    } else {
      checkpoint('no recent release PRs found', CheckpointType.Failure);
    }
  }

  private gitHubInstance(octokitAPIs?: OctokitAPIs): GitHub {
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

  static extractLatestReleaseNotes(
    changelogContents: string,
    version: string
  ): string {
    version = version.replace(/^v/, '');
    const latestRe = new RegExp(
      `## v?\\[?${version}[^\\n]*\\n(.*?)(\\n##\\s|\\n### \\[?[0-9]+\\.|($(?![\r\n])))`,
      'ms'
    );
    const match = changelogContents.match(latestRe);
    if (!match) {
      throw Error('could not find changelog entry corresponding to release PR');
    }
    return match[1];
  }
}
