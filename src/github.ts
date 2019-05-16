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

import * as Octokit from '@octokit/rest';
import {IssuesListResponseItem, PullsCreateResponse, PullsListResponseItem, ReposListTagsResponseItem, Response} from '@octokit/rest';
import chalk from 'chalk';
import * as semver from 'semver';

import {checkpoint, CheckpointType} from './checkpoint';
import {Update} from './updaters/update';

const VERSION_FROM_BRANCH_RE = /^.*:[^-]+-(.*)$/;

interface GitHubOptions {
  token?: string;
  owner: string;
  repo: string;
}

export interface GitHubTag {
  name: string;
  sha: string;
  version: string;
}

export interface GitHubReleasePR {
  number: number;
  version: string;
  sha: string;
}

interface GitHubPR {
  branch: string;
  version: string;
  title: string;
  body: string;
  sha: string;
  updates: Update[];
}

export class GitHub {
  octokit: Octokit;
  token: string|undefined;
  owner: string;
  repo: string;

  constructor(options: GitHubOptions) {
    this.token = options.token;
    this.owner = options.owner;
    this.repo = options.repo;
    this.octokit = new Octokit({auth: this.token});
  }

  async commitsSinceSha(sha: string|undefined, perPage = 100):
      Promise<string[]> {
    const commits = [];
    for await (const response of this.octokit.paginate.iterator({
      method: 'GET',
      url: `/repos/${this.owner}/${this.repo}/commits?per_page=${perPage}`
    })) {
      for (let i = 0, commit; response.data[i] !== undefined; i++) {
        commit = response.data[i];
        if (commit.sha === sha) {
          return commits;
        } else {
          // conventional commits parser expects:
          // [commit message]
          // -hash-
          // [commit sha]
          commits.push(`${commit.commit.message}\n-hash-\n${commit.sha}`);
        }
      }
    }
    return commits;
  }

  async latestTag(perPage = 100): Promise<GitHubTag|undefined> {
    const tags: {[version: string]: GitHubTag;} = await this.allTags(perPage);
    const versions = Object.keys(tags);
    // no tags have been created yet.
    if (versions.length === 0) return undefined;

    // TODO: we can improve the latestTag logic by using
    // this.octokit.repos.getLatestRelease as a sanity check, this should
    // help address concerns that the largest tag might be on a branch
    // other than master.
    versions.sort(semver.rcompare);
    return {
      name: tags[versions[0]].name,
      sha: tags[versions[0]].sha,
      version: tags[versions[0]].version
    } as GitHubTag;
  }

  async latestReleasePR(releaseLabel: string, perPage = 100):
      Promise<GitHubReleasePR|undefined> {
    const pullsResponse: Response<PullsListResponseItem[]> =
        await this.octokit.pulls.list({
          owner: this.owner,
          repo: this.repo,
          state: 'closed',
          per_page: perPage
        });
    for (let i = 0, pull; i < pullsResponse.data.length; i++) {
      pull = pullsResponse.data[i];
      for (let ii = 0, label; ii < pull.labels.length; ii++) {
        label = pull.labels[ii];
        if (label.name === releaseLabel) {
          // it's expected that a release PR will have a
          // HEAD matching the format repo:release-v1.0.0.
          if (!pull.head) continue;
          const match = pull.head.label.match(VERSION_FROM_BRANCH_RE);
          if (!match || !pull.merge_commit_sha) continue;
          return {
            number: pull.number,
            sha: pull.merge_commit_sha,
            version: match[1]
          } as GitHubReleasePR;
        }
      }
    }
    return undefined;
  }

  private async allTags(perPage = 100):
      Promise<{[version: string]: GitHubTag;}> {
    const tags: {[version: string]: GitHubTag;} = {};
    for await (const response of this.octokit.paginate.iterator({
      method: 'GET',
      url: `/repos/${this.owner}/${this.repo}/tags?per_page=${perPage}`
    })) {
      response.data.forEach((data: ReposListTagsResponseItem) => {
        const version = semver.valid(data.name);
        if (version) {
          tags[version] = {sha: data.commit.sha, name: data.name, version};
        }
      });
    }
    return tags;
  }

  async addLabels(pr: number, labels: string[]) {
    checkpoint(
        `adding label ${chalk.green(labels.join(','))} to https://github.com/${
            this.owner}/${this.repo}/pull/${pr}`,
        CheckpointType.Success);
    await this.octokit.issues.addLabels(
        {owner: this.owner, repo: this.repo, issue_number: pr, labels});
  }

  async openIssue(
      title: string, body: string, labels: string[],
      issue?: IssuesListResponseItem) {
    if (issue) {
      checkpoint(`updating issue #${issue.number}`, CheckpointType.Success);
      this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        body,
        issue_number: issue.number,
        labels
      });
    } else {
      checkpoint(`creating new release proposal issue`, CheckpointType.Success);
      this.octokit.issues.create(
          {owner: this.owner, repo: this.repo, title, body, labels});
    }
  }

  async findExistingReleaseIssue(title: string, label: string, perPage = 100):
      Promise<IssuesListResponseItem|undefined> {
    const paged = 0;
    try {
      for await (const response of this.octokit.paginate.iterator({
        method: 'GET',
        url: `/repos/${this.owner}/${this.repo}/issues?per_page=${
            perPage}&labels=${label}`
      })) {
        for (let i = 0, issue; response.data[i] !== undefined; i++) {
          const issue: IssuesListResponseItem = response.data[i];
          if (issue.title.indexOf(title) !== -1 && issue.state === 'open') {
            return issue;
          }
        }
      }
    } catch (err) {
      if (err.status === 404) {
        // the most likely cause of a 404 during this step is actually
        // that the user does not have access to the repo:
        throw new AuthError();
      } else {
        throw err;
      }
    }
    return undefined;
  }

  async openPR(options: GitHubPR): Promise<number> {
    let refName = await this.refByBranchName(options.branch);

    // If the branch exists, we delete it and create a new branch
    // with the same name; this results in the existing PR being closed.
    if (!refName) {
      refName = `refs/heads/${options.branch}`;
    } else {
      try {
        checkpoint(
            `branch ${chalk.red(options.branch)} already exists`,
            CheckpointType.Failure);
        await this.octokit.git.deleteRef({
          owner: this.owner,
          repo: this.repo,
          // DELETE requires that the refs/ prefix used during
          // creation be removed; this seems like a bug we should log.
          ref: refName.replace('refs/', '')
        });
        checkpoint(
            `branch ${chalk.red(options.branch)} deleted`,
            CheckpointType.Success);
      } catch (err) {
        if (err.status === 404) {
          // the most likely cause of a 404 during this step is actually
          // that the user does not have access to the repo:
          throw new AuthError();
        } else {
          throw err;
        }
      }
    }

    // always create the branch (it was potentially deleted in the prior step).
    try {
      checkpoint(
          `creating branch ${chalk.green(options.branch)}`,
          CheckpointType.Success);
      await this.octokit.git.createRef(
          {owner: this.owner, repo: this.repo, ref: refName, sha: options.sha});
    } catch (err) {
      if (err.status === 404) {
        // the most likely cause of a 404 during this step is actually
        // that the user does not have access to the repo:
        throw new AuthError();
      } else {
        throw err;
      }
    }

    await this.updateFiles(options.updates, options.branch, refName);

    checkpoint(
        `open pull-request: ${chalk.yellow(options.title)}`,
        CheckpointType.Success);
    const resp: Response<PullsCreateResponse> =
        await this.octokit.pulls.create({
          owner: this.owner,
          repo: this.repo,
          title: options.title,
          body: options.body,
          head: options.branch,
          base: 'master'
        });

    return resp.data.number;
  }
  async updateFiles(updates: Update[], branch: string, refName: string) {
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      let content;
      try {
        content = await this.octokit.repos.getContents({
          owner: this.owner,
          repo: this.repo,
          path: update.path,
          ref: refName
        });
      } catch (err) {
        if (err.status !== 404) throw err;
        // if the file is missing and create = false, just continue
        // to the next update, otherwise create the file.
        if (!update.create) {
          checkpoint(
              `file ${chalk.green(update.path)} did not exist`,
              CheckpointType.Failure);
          continue;
        }
      }
      const contentText = content ?
          Buffer.from(content.data.content, 'base64').toString('utf8') :
          undefined;
      const updatedContent = update.updateContent(contentText);

      if (content) {
        await this.octokit.repos.updateFile({
          owner: this.owner,
          repo: this.repo,
          path: update.path,
          message: `updated ${update.path}`,
          content: Buffer.from(updatedContent, 'utf8').toString('base64'),
          sha: content.data.sha,
          branch
        });
      } else {
        await this.octokit.repos.createFile({
          owner: this.owner,
          repo: this.repo,
          path: update.path,
          message: `created ${update.path}`,
          content: Buffer.from(updatedContent, 'utf8').toString('base64'),
          branch
        });
      }
    }
  }
  private async refByBranchName(branch: string): Promise<string|undefined> {
    let ref;
    try {
      for await (const response of this.octokit.paginate.iterator(
          {method: 'GET', url: `/repos/${this.owner}/${this.repo}/git/refs`})) {
        for (let i = 0, r; response.data[i] !== undefined; i++) {
          r = response.data[i];
          const refRe = new RegExp(`/${branch}$`);
          if (r.ref.match(refRe)) {
            ref = r.ref;
          }
        }
      }
    } catch (err) {
      if (err.status === 404) {
        // the most likely cause of a 404 during this step is actually
        // that the user does not have access to the repo:
        throw new AuthError();
      } else {
        throw err;
      }
    }
    return ref;
  }
  async getFileContents(path: string): Promise<string> {
    const content = await this.octokit.repos.getContents(
        {owner: this.owner, repo: this.repo, path});
    return Buffer.from(content.data.content, 'base64').toString('utf8');
  }
  async createRelease(version: string, sha: string, releaseNotes: string) {
    checkpoint(`creating release ${version}`, CheckpointType.Success);
    await this.octokit.repos.createRelease({
      owner: this.owner,
      repo: this.repo,
      tag_name: version,
      target_commitish: sha,
      body: releaseNotes,
      name: version
    });
  }
  async removeLabel(label: string, prNumber: number) {
    checkpoint(
        `removing label ${chalk.green(label)} from ${
            chalk.green('' + prNumber)}`,
        CheckpointType.Success);
    await this.octokit.issues.removeLabel({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
      name: label
    });
  }
}

class AuthError extends Error {
  status: number;

  constructor() {
    super('unauthorized');
    this.status = 401;
  }
}