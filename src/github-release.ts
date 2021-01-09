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
import {checkpoint, CheckpointType} from './util/checkpoint';
import {packageBranchPrefix} from './util/package-branch-prefix';
import {ReleasePRFactory} from './release-pr-factory';
import {GitHub, OctokitAPIs} from './github';
import {parse} from 'semver';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');
const GITHUB_RELEASE_LABEL = 'autorelease: tagged';

interface ReleaseResponse {
  major: number;
  minor: number;
  patch: number;
  version: string;
  sha: string;
  html_url: string;
  tag_name: string;
  upload_url: string;
  pr: number;
}

export interface GitHubReleaseOptions {
  label: string;
  repoUrl: string;
  path?: string;
  packageName?: string;
  monorepoTags?: boolean;
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
  monorepoTags?: boolean;
  token?: string;
  proxyKey?: string;
  releaseType?: string;

  constructor(options: GitHubReleaseOptions) {
    this.apiUrl = options.apiUrl;
    this.proxyKey = options.proxyKey;
    this.labels = options.label.split(',');
    this.repoUrl = options.repoUrl;
    this.monorepoTags = options.monorepoTags;
    this.token = options.token;
    this.path = options.path;
    this.packageName = options.packageName;
    this.releaseType = options.releaseType;

    this.changelogPath = options.changelogPath ?? 'CHANGELOG.md';

    this.gh = this.gitHubInstance(options.octokitAPIs);
  }

  async createRelease(): Promise<ReleaseResponse | undefined> {
    // Attempt to lookup the package name from a well known location, such
    // as package.json, if none is provided:
    if (!this.packageName && this.releaseType) {
      this.packageName = await ReleasePRFactory.class(
        this.releaseType
      ).lookupPackageName(this.gh, this.path);
    }
    if (this.packageName === undefined) {
      throw Error(
        `could not determine package name for release repo = ${this.repoUrl}`
      );
    }

    // In most configurations, createRelease() should be called close to when
    // a release PR is merged, e.g., a GitHub action that kicks off this
    // workflow on merge. For tis reason, we can pull a fairly small number of PRs:
    const pageSize = 25;
    const gitHubReleasePR = await this.gh.findMergedReleasePR(
      this.labels,
      pageSize,
      this.monorepoTags
        ? packageBranchPrefix(this.packageName, this.releaseType)
        : undefined
    );
    if (!gitHubReleasePR) {
      checkpoint('no recent release PRs found', CheckpointType.Failure);
      return undefined;
    }
    const version = `v${gitHubReleasePR.version}`;

    checkpoint(
      `found release branch ${chalk.green(version)} at ${chalk.green(
        gitHubReleasePR.sha
      )}`,
      CheckpointType.Success
    );

    const changelogContents = (
      await this.gh.getFileContents(this.addPath(this.changelogPath))
    ).parsedContent;
    const latestReleaseNotes = GitHubRelease.extractLatestReleaseNotes(
      changelogContents,
      version
    );
    checkpoint(
      `found release notes: \n---\n${chalk.grey(latestReleaseNotes)}\n---\n`,
      CheckpointType.Success
    );
    // Go uses '/' for a tag separator, rather than '-':
    let tagSeparator = '-';
    if (this.releaseType) {
      tagSeparator = ReleasePRFactory.class(this.releaseType).tagSeparator();
    }

    const release = await this.gh.createRelease(
      this.packageName,
      this.monorepoTags
        ? `${this.packageName}${tagSeparator}${version}`
        : version,
      gitHubReleasePR.sha,
      latestReleaseNotes
    );
    // Add a label indicating that a release has been created on GitHub,
    // but a publication has not yet occurred.
    await this.gh.addLabels([GITHUB_RELEASE_LABEL], gitHubReleasePR.number);
    // Remove 'autorelease: pending' which indicates a GitHub release
    // has not yet been created.
    await this.gh.removeLabels(this.labels, gitHubReleasePR.number);

    const parsedVersion = parse(version, {loose: true});
    if (parsedVersion) {
      return {
        major: parsedVersion.major,
        minor: parsedVersion.minor,
        patch: parsedVersion.patch,
        sha: gitHubReleasePR.sha,
        version,
        pr: gitHubReleasePR.number,
        html_url: release.html_url,
        tag_name: release.tag_name,
        upload_url: release.upload_url,
      };
    } else {
      console.warn(`failed to parse version informatino from ${version}`);
      return undefined;
    }
  }

  addPath(file: string) {
    if (this.path === undefined) {
      return file;
    } else {
      const path = this.path.replace(/[/\\]$/, '');
      file = file.replace(/^[/\\]/, '');
      return `${path}/${file}`;
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
