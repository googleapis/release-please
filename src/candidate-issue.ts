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
import {ReleaseCandidate, ReleaseType} from './mint-release';

const parseGithubRepoUrl = require('parse-github-repo-url');

export interface CandidateIssueOptions {
  bumpMinorPreMajor?: boolean;
  token?: string;
  repoUrl: string;
  packageName: string;
  releaseType: ReleaseType;
}

const ISSUE_TITLE = 'chore(release): proposal for next release';

export class CandidateIssue {
  bumpMinorPreMajor?: boolean;
  gh: GitHub;
  repoUrl: string;
  token: string|undefined;
  packageName: string;
  releaseType: ReleaseType;

  constructor(options: CandidateIssueOptions) {
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.repoUrl = options.repoUrl;
    this.token = options.token;
    this.packageName = options.packageName;
    this.releaseType = options.releaseType;

    this.gh = this.gitHubInstance();
  }
  async run() {
    switch (this.releaseType) {
      case ReleaseType.Node:
        await this.nodeReleaseCandidate();
        break;
      default:
        throw Error('unknown release type');
    }
  }

  private async nodeReleaseCandidate() {
    const latestTag: GitHubTag|undefined = await this.gh.latestTag();
    const commits: string[] =
        await this.commits(latestTag ? latestTag.sha : undefined);
    const cc = new ConventionalCommits({
      commits,
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: this.bumpMinorPreMajor
    });
    const candidate: ReleaseCandidate =
        await this.coerceReleaseCandidate(cc, latestTag);

    const changelogEntry: string = await cc.generateChangelogEntry({
      version: candidate.version,
      currentTag: `v${candidate.version}`,
      previousTag: candidate.previousTag
    });

    await this.gh.openIssue(ISSUE_TITLE, this.bodyTemplate(changelogEntry));
  }

  private async coerceReleaseCandidate(
      cc: ConventionalCommits,
      latestTag: GitHubTag|undefined): Promise<ReleaseCandidate> {
    const previousTag = latestTag ? latestTag.name : undefined;
    let version = latestTag ? latestTag.version : '1.0.0';

    if (latestTag) {
      const bump = await cc.suggestBump(version);
      const candidate = semver.inc(version, bump.releaseType);
      if (!candidate) throw Error(`failed to increment ${version}`);
      version = candidate;
    }

    return {version, previousTag};
  }

  private async commits(sha: string|undefined): Promise<string[]> {
    const commits = await this.gh.commitsSinceSha(sha);
    if (commits.length) {
      checkpoint(
          `found ${commits.length} commits since ${sha}`,
          CheckpointType.Success);
    } else {
      checkpoint(`no commits found since ${sha}`, CheckpointType.Failure);
    }
    return commits;
  }

  private gitHubInstance(): GitHub {
    const [owner, repo] = parseGithubRepoUrl(this.repoUrl);
    return new GitHub({token: this.token, owner, repo});
  }

  private bodyTemplate(changelogEntry: string): string {
    return `_:robot: This issue was created by robots! :robot:._
  
Its purpose is to show you what the next release of **${
        this.packageName}** would look like... _If we published it right now._

If you're a maintainer, and would like create a PR for this release, simply comment on this issue.

---

${changelogEntry}
`;
  }
}
