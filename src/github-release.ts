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

import {GitHubReleaseConstructorOptions} from './';
import {checkpoint, CheckpointType} from './util/checkpoint';
import {GitHub} from './github';
import {parse} from 'semver';
import {ReleasePR} from './release-pr';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const GITHUB_RELEASE_LABEL = 'autorelease: tagged';

export interface GitHubReleaseResponse {
  major: number;
  minor: number;
  patch: number;
  version: string;
  sha: string;
  html_url: string;
  name: string;
  tag_name: string;
  upload_url: string;
  pr: number;
  draft: boolean;
}

export class GitHubRelease {
  releasePR: ReleasePR;
  gh: GitHub;
  draft: boolean;

  constructor(options: GitHubReleaseConstructorOptions) {
    this.draft = !!options.draft;
    this.gh = options.github;
    this.releasePR = options.releasePR;
  }

  async run(): Promise<GitHubReleaseResponse | undefined> {
    const candidate = await this.releasePR.buildRelease();
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

    // Comment on the release PR with the
    await this.gh.commentOnIssue(
      `:robot: Release is at ${release.html_url} :sunflower:`,
      candidate.pullNumber
    );

    // Add a label indicating that a release has been created on GitHub,
    // but a publication has not yet occurred.
    await this.gh.addLabels([GITHUB_RELEASE_LABEL], candidate.pullNumber);
    // Remove 'autorelease: pending' which indicates a GitHub release
    // has not yet been created.
    await this.gh.removeLabels(this.releasePR.labels, candidate.pullNumber);

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
        name: release.name,
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
}
