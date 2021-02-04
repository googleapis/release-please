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

import {SharedOptions} from './';
import {DEFAULT_LABELS} from './constants';
import {checkpoint, CheckpointType} from './util/checkpoint';
import {factory} from './factory';
import {GitHub, OctokitAPIs} from './github';
import {parse} from 'semver';
import {ReleasePR} from './release-pr';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');
const GITHUB_RELEASE_LABEL = 'autorelease: tagged';

export interface ReleaseResponse {
  major: number;
  minor: number;
  patch: number;
  version: string;
  sha: string;
  html_url: string;
  tag_name: string;
  upload_url: string;
  pr: number;
  draft: boolean;
}

export interface GitHubReleaseOptions extends SharedOptions {
  releaseType?: string;
  changelogPath?: string;
  draft?: boolean;
  defaultBranch?: string;
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
  releaseType?: string;
  draft: boolean;
  defaultBranch?: string;

  constructor(options: GitHubReleaseOptions) {
    this.apiUrl = options.apiUrl;
    this.labels = options.label
      ? options.label.split(',')
      : DEFAULT_LABELS.split(',');
    this.repoUrl = options.repoUrl;
    this.monorepoTags = options.monorepoTags;
    this.token = options.token;
    this.path = options.path;
    this.packageName = options.packageName;
    this.releaseType = options.releaseType;
    this.draft = !!options.draft;
    this.defaultBranch = options.defaultBranch;

    this.changelogPath = options.changelogPath ?? 'CHANGELOG.md';

    this.gh = this.gitHubInstance(options.octokitAPIs);
  }

  async run(): Promise<ReleaseResponse | undefined> {
    // Attempt to lookup the package name from a well known location, such
    // as package.json, if none is provided:
    if (!this.packageName && this.releaseType) {
      this.packageName = await factory
        .releasePRClass(this.releaseType)
        .lookupPackageName(this.gh, this.path);
    }
    if (!this.packageName) {
      throw Error(
        `could not determine package name for release repo = ${this.repoUrl}`
      );
    }

    const releaseOptions = {
      packageName: this.packageName,
      repoUrl: this.repoUrl,
      apiUrl: this.apiUrl,
      defaultBranch: this.defaultBranch,
      label: this.labels.join(','),
      path: this.path,
      github: this.gh,
      monorepoTags: this.monorepoTags,
    };
    const releasePR = this.releaseType
      ? factory.releasePR({
          ...releaseOptions,
          ...{releaseType: this.releaseType},
        })
      : new ReleasePR({
          ...releaseOptions,
          ...{releaseType: 'unknown'},
        });

    const candidate = await releasePR.buildRelease(
      this.addPath(this.changelogPath)
    );
    if (!candidate) {
      checkpoint('Unable to build candidate', CheckpointType.Failure);
      return undefined;
    }

    const release = await this.gh.createRelease(
      candidate.name,
      candidate.tag,
      candidate.sha,
      candidate.notes,
      this.draft
    );
    checkpoint(`Created release: ${release.html_url}.`, CheckpointType.Success);

    // Add a label indicating that a release has been created on GitHub,
    // but a publication has not yet occurred.
    await this.gh.addLabels([GITHUB_RELEASE_LABEL], candidate.pullNumber);
    // Remove 'autorelease: pending' which indicates a GitHub release
    // has not yet been created.
    await this.gh.removeLabels(this.labels, candidate.pullNumber);

    const parsedVersion = parse(candidate.version, {loose: true});
    if (parsedVersion) {
      return {
        major: parsedVersion.major,
        minor: parsedVersion.minor,
        patch: parsedVersion.patch,
        sha: candidate.sha,
        version: candidate.version,
        pr: candidate.pullNumber,
        html_url: release.html_url,
        tag_name: release.tag_name,
        upload_url: release.upload_url,
        draft: release.draft,
      };
    } else {
      console.warn(
        `failed to parse version information from ${candidate.version}`
      );
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
      defaultBranch: this.defaultBranch,
      owner,
      repo,
      apiUrl: this.apiUrl,
      octokitAPIs,
    });
  }
}
