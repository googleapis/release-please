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
import {join} from 'path';

import {checkpoint, CheckpointType} from './util/checkpoint';
import {ReleasePRFactory} from './release-pr-factory';
import {
  GitHub,
  GitHubReleasePR,
  OctokitAPIs,
  ReleaseCreateResponse,
} from './github';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');
const GITHUB_RELEASE_LABEL = 'autorelease: tagged';

export interface GitHubReleaseOptions {
  label: string;
  repoUrl: string;
  path?: string;
  packageName?: string;
  token?: string;
  apiUrl: string;
  proxyKey?: string;
  octokitAPIs?: OctokitAPIs;
  releaseType?: string;
  changelogPath?: string;
}

export class GitHubRelease {
  apiUrl: string;
  changelogPath: string;
  gh: GitHub;
  labels: string[];
  repoUrl: string;
  path?: string;
  packageName?: string;
  token?: string;
  proxyKey?: string;
  releaseType?: string;

  constructor(options: GitHubReleaseOptions) {
    this.apiUrl = options.apiUrl;
    this.proxyKey = options.proxyKey;
    this.labels = options.label.split(',');
    this.repoUrl = options.repoUrl;
    this.token = options.token;
    this.path = options.path;
    this.packageName = options.packageName;
    this.releaseType = options.releaseType;

    this.changelogPath = options.changelogPath ?? 'CHANGELOG.md';

    this.gh = this.gitHubInstance(options.octokitAPIs);
  }

  async createRelease(): Promise<ReleaseCreateResponse | undefined> {
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
        await this.gh.getFileContents(this.addPath(this.changelogPath))
      ).parsedContent;
      const latestReleaseNotes = GitHubRelease.extractLatestReleaseNotes(
        changelogContents,
        // For monorepo releases, the library name is prepended to the tag and branch:
        gitHubReleasePR.version.split('-').pop() || gitHubReleasePR.version
      );
      checkpoint(
        `found release notes: \n---\n${chalk.grey(latestReleaseNotes)}\n---\n`,
        CheckpointType.Success
      );

      // Attempt to lookup the package name from a well known location, such
      // as package.json, if none is provided:
      if (this.packageName === undefined && this.releaseType) {
        this.packageName = await ReleasePRFactory.class(
          this.releaseType
        ).lookupPackageName(this.gh);
      }
      if (this.packageName === undefined) {
        throw Error('could not determine package name for release');
      }

      const release = await this.gh.createRelease(
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
      return release;
    } else {
      checkpoint('no recent release PRs found', CheckpointType.Failure);
      return undefined;
    }
  }

  addPath(file: string) {
    if (this.path === undefined) {
      return file;
    } else {
      return join(this.path, `./${file}`);
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
