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
import {IssuesListResponseItem, PullsCreateResponse, PullsListResponseItem, ReposGetLatestReleaseResponse, ReposListTagsResponseItem, Response} from '@octokit/rest';
import chalk from 'chalk';
import * as semver from 'semver';

import {checkpoint, CheckpointType} from './checkpoint';
import {Update} from './updaters/update';

const graphql = require('@octokit/graphql');

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
  labels: string[];
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
          console.info(commit);
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

  async commitsWithPathSinceSha(
      sha: string|undefined, perPage = 64,
      maxFilesChanged = 64): Promise<string[]> {
    // The GitHub v3 API does not offer an elegant way to fetch commits
    // in conjucntion with the path that they modify. We lean on the graphql
    // API for this one task, fetching commits in descending chronological
    // order along with the file paths attached to them.
    const repository = await graphql({
      query:
          `query lastCommits($owner: String!, $repo: String!, $perPage: Int, $maxFilesChanged: Int) {
        repository(owner: $owner, name: $repo) {
          defaultBranchRef {
            target{
              ... on Commit {
                history(first: $perPage) {
                  edges{
                    node {
                      ... on Commit {
                        message
                        oid
                        associatedPullRequests(first:1) {
                          edges {
                            node {
                              ... on PullRequest {
                                files(first: $maxFilesChanged) {
                                  edges {
                                    node {
                                      path
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      owner: this.owner,
      repo: this.repo,
      perPage,
      maxFilesChanged,
      headers: {authorization: `token ${this.token}`}
    });
    return [];
  }

  async latestTag(perPage = 100): Promise<GitHubTag|undefined> {
    const tags: {[version: string]: GitHubTag;} = await this.allTags(perPage);
    const versions = Object.keys(tags);
    // no tags have been created yet.
    if (versions.length === 0) return undefined;

    versions.sort(semver.rcompare);
    return {
      name: tags[versions[0]].name,
      sha: tags[versions[0]].sha,
      version: tags[versions[0]].version
    };
  }

  // TODO: investigate why this returns a target_commitish of `master`
  // even months after the release is created; is there a way to
  // get the SHA that the release was created at?
  async latestRelease(): Promise<GitHubTag|undefined> {
    try {
      const latestRelease: Response<ReposGetLatestReleaseResponse> =
          await this.octokit.repos.getLatestRelease(
              {owner: this.owner, repo: this.repo});
      const version = semver.valid(latestRelease.data.name);
      if (version) {
        console.info(latestRelease.data);
        return {
          name: latestRelease.data.name,
          sha: latestRelease.data.target_commitish,
          version
        };
      }
    } catch (err) {
      if (err.status === 404) {
        // fallback to tags if we don't find a GitHub release.
      } else {
        throw err;
      }
    }
    return undefined;
  }

  async findMergedReleasePR(labels: string[], perPage = 25):
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
      if (this.hasAllLabels(labels, pull.labels.map(l => l.name))) {
        // it's expected that a release PR will have a
        // HEAD matching the format repo:release-v1.0.0.
        if (!pull.head) continue;
        const match = pull.head.label.match(VERSION_FROM_BRANCH_RE);
        if (!match || !pull.merged_at) continue;
        return {
          number: pull.number,
          sha: pull.merge_commit_sha,
          version: match[1]
        } as GitHubReleasePR;
      }
    }
    return undefined;
  }

  private hasAllLabels(labelsA: string[], labelsB: string[]) {
    let hasAll = true;
    labelsA.forEach((label) => {
      if (labelsB.indexOf(label) === -1) hasAll = false;
    });
    return hasAll;
  }

  async findOpenReleasePRs(labels: string[], perPage = 25):
      Promise<PullsListResponseItem[]> {
    const openReleasePRs: PullsListResponseItem[] = [];
    const pullsResponse: Response<PullsListResponseItem[]> =
        await this.octokit.pulls.list({
          owner: this.owner,
          repo: this.repo,
          state: 'open',
          per_page: perPage
        });
    for (let i = 0, pull; i < pullsResponse.data.length; i++) {
      pull = pullsResponse.data[i];
      for (let ii = 0, label; ii < pull.labels.length; ii++) {
        label = pull.labels[ii];
        if (labels.indexOf(label.name) !== -1) {
          openReleasePRs.push(pull);
        }
      }
    }
    return openReleasePRs;
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
      checkpoint(
          `updating issue #${issue.number} with labels = ${
              JSON.stringify(labels)}`,
          CheckpointType.Success);
      this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        body,
        issue_number: issue.number,
        labels
      });
    } else {
      checkpoint(
          `creating new release proposal issue with labels = ${
              JSON.stringify(labels)}`,
          CheckpointType.Success);
      this.octokit.issues.create(
          {owner: this.owner, repo: this.repo, title, body, labels});
    }
  }

  async findExistingReleaseIssue(
      title: string, labels: string[],
      perPage = 100): Promise<IssuesListResponseItem|undefined> {
    const paged = 0;
    try {
      for await (const response of this.octokit.paginate.iterator({
        method: 'GET',
        url: `/repos/${this.owner}/${this.repo}/issues?per_page=${
            perPage}&labels=${labels.join(',')}`
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
    let openReleasePR: PullsListResponseItem|undefined;

    // If the branch exists, we delete it and create a new branch
    // with the same name; this results in the existing PR being closed.
    if (!refName) {
      refName = `refs/heads/${options.branch}`;

      // the branch didn't yet exist, so make it.
      try {
        checkpoint(
            `creating branch ${chalk.green(options.branch)}`,
            CheckpointType.Success);
        await this.octokit.git.createRef({
          owner: this.owner,
          repo: this.repo,
          ref: refName,
          sha: options.sha
        });
      } catch (err) {
        if (err.status === 404) {
          // the most likely cause of a 404 during this step is actually
          // that the user does not have access to the repo:
          throw new AuthError();
        } else {
          throw err;
        }
      }

    } else {
      try {
        checkpoint(
            `branch ${chalk.red(options.branch)} already exists`,
            CheckpointType.Failure);

        // check if there's an existing PR, so that we can opt to update it
        // rather than creating a new PR.
        (await this.findOpenReleasePRs(options.labels))
            .forEach((releasePR: PullsListResponseItem) => {
              if (refName && refName.indexOf(releasePR.head.ref) !== -1) {
                openReleasePR = releasePR;
              }
            });

        await this.octokit.git.updateRef({
          owner: this.owner,
          repo: this.repo,
          // TODO: remove the replace logic depending on the outcome of:
          // https://github.com/octokit/rest.js/issues/1039.
          ref: refName.replace('refs/', ''),
          sha: options.sha,
          force: true
        });
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

    await this.updateFiles(options.updates, options.branch, refName);

    if (openReleasePR) {
      // TODO: dig into why `updateRef` closes an issue attached
      // to the branch being updated:
      // https://github.com/octokit/rest.js/issues/1373
      checkpoint(
          `update pull-request #${openReleasePR.number}: ${
              chalk.yellow(options.title)}`,
          CheckpointType.Success);
      await this.octokit.pulls.update({
        pull_number: openReleasePR.number,
        owner: this.owner,
        repo: this.repo,
        title: options.title,
        body: options.body,
        state: 'open',
        base: 'master'
      });
      return openReleasePR.number;
    } else {
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

  async closePR(prNumber: number) {
    this.octokit.pulls.update({
      owner: this.owner,
      repo: this.repo,
      number: prNumber,
      state: 'closed'
    });
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

  async removeLabels(labels: string[], prNumber: number) {
    for (let i = 0, label; i < labels.length; i++) {
      label = labels[i];
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
}

class AuthError extends Error {
  status: number;

  constructor() {
    super('unauthorized');
    this.status = 401;
  }
}