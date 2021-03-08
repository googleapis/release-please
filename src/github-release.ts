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
import {GitHub, MergedGitHubPR, ReleaseCreateResponse} from './github';
import {parse} from 'semver';
import {ReleasePR, CandidateRelease} from './release-pr';

export const GITHUB_RELEASE_LABEL = 'autorelease: tagged';

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
  body: string;
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

  async createRelease(): Promise<
    [CandidateRelease, ReleaseCreateResponse] | [undefined, undefined]
  >;
  async createRelease(
    version: string,
    mergedPR: MergedGitHubPR
  ): Promise<ReleaseCreateResponse | undefined>;
  async createRelease(
    version?: string,
    mergedPR?: MergedGitHubPR
  ): Promise<
    | [CandidateRelease, ReleaseCreateResponse]
    | [undefined, undefined]
    | ReleaseCreateResponse
    | undefined
  > {
    let candidate: CandidateRelease | undefined;
    if (version && mergedPR) {
      candidate = await this.releasePR.buildReleaseForVersion(
        version,
        mergedPR
      );
      return await this.gh.createRelease(
        candidate.name,
        candidate.tag,
        candidate.sha,
        candidate.notes,
        this.draft
      );
    } else {
      candidate = await this.releasePR.buildRelease();
    }
    if (candidate !== undefined) {
      const release = await this.gh.createRelease(
        candidate.name,
        candidate.tag,
        candidate.sha,
        candidate.notes,
        this.draft
      );
      return [candidate, release];
    } else {
      checkpoint('Unable to build candidate', CheckpointType.Failure);
      return [undefined, undefined];
    }
  }

  async run(): Promise<GitHubReleaseResponse | undefined> {
    const [candidate, release] = await this.createRelease();
    if (!(candidate && release)) {
      return;
    }

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
    return this.releaseResponse({
      release,
      version: candidate.version,
      sha: candidate.sha,
      number: candidate.pullNumber,
    });
  }

  releaseResponse(params: {
    release: ReleaseCreateResponse;
    version: string;
    sha: string;
    number: number;
  }): GitHubReleaseResponse | undefined {
    checkpoint(
      `Created release: ${params.release.html_url}.`,
      CheckpointType.Success
    );
    const parsedVersion = parse(params.version, {loose: true});
    if (parsedVersion) {
      return {
        major: parsedVersion.major,
        minor: parsedVersion.minor,
        patch: parsedVersion.patch,
        sha: params.sha,
        version: params.version,
        pr: params.number,
        html_url: params.release.html_url,
        name: params.release.name,
        tag_name: params.release.tag_name,
        upload_url: params.release.upload_url,
        draft: params.release.draft,
        body: params.release.body,
      };
    } else {
      console.warn(
        `failed to parse version information from ${params.version}`
      );
      return undefined;
    }
  }
}
