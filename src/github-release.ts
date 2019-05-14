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

// import {checkpoint, CheckpointType} from './checkpoint';
// import {ConventionalCommits} from './conventional-commits';
import {GitHub, GitHubReleasePR} from './github';

const parseGithubRepoUrl = require('parse-github-repo-url');

export interface GitHubReleaseOptions {
  label: string;
  repoUrl: string;
  token: string;
}

export class GitHubRelease {
  label: string;
  gh: GitHub;
  repoUrl: string;
  token: string|undefined;

  constructor(options: GitHubReleaseOptions) {
    this.label = options.label;
    this.repoUrl = options.repoUrl;
    this.token = options.token;

    this.gh = this.gitHubInstance();
  }

  async createRelease() {
    const githubReleasePR: GitHubReleasePR|undefined =
        await this.gh.latestReleasePR(this.label);
    if (githubReleasePR) {
      console.info(githubReleasePR);
    }
  }

  private gitHubInstance(): GitHub {
    const [owner, repo] = parseGithubRepoUrl(this.repoUrl);
    return new GitHub({token: this.token, owner, repo});
  }
}
