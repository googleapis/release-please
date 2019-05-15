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

import {IssuesListResponseItem} from '@octokit/rest';
import * as semver from 'semver';

import {checkpoint, CheckpointType} from './checkpoint';
import {ConventionalCommits} from './conventional-commits';
import {GitHub, GitHubTag} from './github';
import {ReleaseCandidate, ReleaseType} from './release-pr';
import {ReleasePR, ReleasePROptions} from './release-pr';

const parseGithubRepoUrl = require('parse-github-repo-url');

const ISSUE_TITLE = 'chore(release): proposal for next release';
const ISSUE_FOOTER = '[//]: # footer follows.';
const CHECKBOX = '* [ ] **Should I create this release for you :robot:?**';
const CHECK_REGEX = /\[x]/;

export class CandidateIssue {
  label: string;
  gh: GitHub;
  bumpMinorPreMajor?: boolean;
  repoUrl: string;
  token: string|undefined;
  packageName: string;
  releaseType: ReleaseType;

  constructor(options: ReleasePROptions) {
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.label = options.label;
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

    const issue: IssuesListResponseItem|undefined =
        await this.gh.findExistingReleaseIssue(ISSUE_TITLE);
    let body: string =
        CandidateIssue.bodyTemplate(changelogEntry, this.packageName);

    if (issue) {
      if (CHECK_REGEX.test(issue.body)) {
        // if the checkox has been clicked for a release
        // mint the release.
        checkpoint(
            `release checkbox was checked, creating release`,
            CheckpointType.Success);
        const rp = new ReleasePR({
          bumpMinorPreMajor: this.bumpMinorPreMajor,
          label: this.label,
          token: this.token,
          repoUrl: this.repoUrl,
          packageName: this.packageName,
          releaseType: this.releaseType
        });
        const prNumber = await rp.run();
        body = body.replace(CHECKBOX, `**release created at #${prNumber}**`);
      } else if (CandidateIssue.bodySansFooter(issue.body) === CandidateIssue.bodySansFooter(body)) {
        // don't update the issue if the content is the same for the release.
        checkpoint(
            `skipping update to #${issue.number}, no change to body`,
            CheckpointType.Failure);
        return;
      }
    }

    await this.gh.openIssue(ISSUE_TITLE, body, issue);
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

  static bodyTemplate(changelogEntry: string, packageName: string): string {
    return `_:robot: Here's what the next release of **${
        packageName}** would look like._

---

${changelogEntry}

---

${ISSUE_FOOTER}

${CHECKBOX}
`;
  }

  static bodySansFooter(body: string): string {
    const footerPosition = body.indexOf(ISSUE_FOOTER);
    if (footerPosition === -1) return body;
    else return body.slice(0, footerPosition);
  }
}
