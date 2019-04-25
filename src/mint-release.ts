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

import {ConventionalCommits} from './conventional-commits';
import {GitHub} from './github';

const parseGithubRepoUrl = require('parse-github-repo-url');

enum ReleaseType {
  Node = "node"
}

export interface MintReleaseOptions {
  token?: string;
  repoUrl: string;
  releaseType: ReleaseType;
}

export class MintRelease {
  repoUrl: string;
  token: string|undefined;
  releaseType: ReleaseType;

  constructor (options: MintReleaseOptions) {
    this.repoUrl = options.repoUrl;
    this.token = options.token;
    this.releaseType = options.releaseType;
  }
  async run () {
    console.info(this.releaseType);
    switch (this.releaseType) {
      case ReleaseType.Node:
        await this.nodeRelease()
        break;
      default:
        throw Error('unknown release type')
    }
  }
  private async nodeRelease () {
    await this.release();
  }
  private async release () {
    const [owner, repo] = parseGithubRepoUrl(this.repoUrl);
    const gh = new GitHub({token: this.token, owner, repo});
    const latestTag = await gh.latestTag();
    const commits = await gh.commitsSinceSha(latestTag.sha);

    const cc = new ConventionalCommits({commits, githubRepoUrl: this.repoUrl});
    const bump = await cc.suggestBump(latestTag.version);
    const version = semver.inc(latestTag.version, bump.releaseType);

    if (!version) throw Error(`failed to increment ${latestTag.version}`)

    if (version) {
      const changelogEntry = await cc.generateChangelogEntry(
        {version, currentTag: `v${version}`, previousTag: latestTag.name});
      console.info(changelogEntry);
    }
  }
}

/*
TODO: refactor this into class.
export async function mintRelease(options: MintReleaseOptions) {


  // generate the CHANGELOG.
  const cc = new ConventionalCommits({commits, githubRepoUrl: repoUrl});
  const bump = await cc.suggestBump(latestTag.version);
  const version = semver.inc(latestTag.version, bump.releaseType);
  if (version) {
    console.info(`${latestTag.version} -> ${version}`);
    const changelogEntry = await cc.generateChangelogEntry(
        {version, currentTag: `v${version}`, previousTag: latestTag.name});
    console.info(changelogEntry);

    const split = commits[0].split('-hash-');
    const sha = split[split.length - 1].trim();
    await gh.openPR(
        {branch: `release-v${version}`, version, sha, updates:
    []});
  }
}
*/