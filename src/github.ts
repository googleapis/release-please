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
import {PullsCreateResponse, ReposListTagsResponseItem, Response} from '@octokit/rest';
import chalk from 'chalk';
import * as semver from 'semver';

import {checkpoint, CheckpointType} from './checkpoint';
import {Update} from './updaters/update';

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

interface GitHubPR {
  branch: string;
  version: string;
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

  async commitsSinceSha(sha: string, perPage = 100): Promise<string[]> {
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

  async latestTag(perPage = 100): Promise<GitHubTag> {
    const tags: {[version: string]: GitHubTag;} = await this.allTags(perPage);
    const versions = Object.keys(tags);
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

  async addLabel(pr: number, label: string) {
    checkpoint(
        `adding label ${chalk.green(label)} to https://github.com/${
            this.owner}/${this.repo}/pull/${pr}`,
        CheckpointType.Success);
    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: pr,
      labels: [label]
    });
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

    const title = `chore: release ${options.version}`;
    checkpoint(
        `open pull-request: ${chalk.yellow(title)}`, CheckpointType.Success);
    const resp: Response<PullsCreateResponse> =
        await this.octokit.pulls.create({
          owner: this.owner,
          repo: this.repo,
          title,
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
  async refByBranchName(branch: string): Promise<string|undefined> {
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
}

class AuthError extends Error {
  status: number;

  constructor() {
    super('unauthorized');
    this.status = 401;
  }
}