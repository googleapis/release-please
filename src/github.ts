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

import * as Octokit from '@octokit/rest';
const { request } = require('@octokit/request');
import {
  AnyResponse,
  IssuesListResponseItem,
  PullsListResponseItem,
  ReposListTagsResponseItem,
  Response,
} from '@octokit/rest';
import chalk = require('chalk');
import * as semver from 'semver';

import { checkpoint, CheckpointType } from './util/checkpoint';
import {
  Commit,
  CommitsResponse,
  graphqlToCommits,
  PREdge,
} from './graphql-to-commits';
import { Update } from './updaters/update';

const { graphql } = require('@octokit/graphql');

const VERSION_FROM_BRANCH_RE = /^.*:[^-]+-(.*)$/;

export interface OctokitAPIs {
  graphql: Function;
  request: Function;
  octokit: Octokit;
}

interface GitHubOptions {
  token?: string;
  owner: string;
  repo: string;
  apiUrl?: string;
  proxyKey?: string;
  octokitAPIs?: OctokitAPIs;
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

export interface GitHubFileContents {
  sha: string;
  content: string;
  parsedContent: string;
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

interface FileSearchResponse {
  items: FileSearchResponseFile[];
}

interface FileSearchResponseFile {
  path: string;
}

let probotMode = false;

export class GitHub {
  octokit: Octokit;
  request: Function;
  graphql: Function;
  token: string | undefined;
  owner: string;
  repo: string;
  apiUrl: string;
  proxyKey?: string;

  constructor(options: GitHubOptions) {
    this.token = options.token;
    this.owner = options.owner;
    this.repo = options.repo;
    this.apiUrl = options.apiUrl || 'https://api.github.com';
    this.proxyKey = options.proxyKey;

    if (options.octokitAPIs === undefined) {
      this.octokit = new Octokit({ baseUrl: options.apiUrl });
      const defaults: { [key: string]: string | object } = {
        baseUrl: this.apiUrl,
        headers: {
          'user-agent': `release-please/${
            require('../../package.json').version
          }`,
          // some proxies do not require the token prefix.
          Authorization: `${this.proxyKey ? '' : 'token '}${this.token}`,
        },
      };
      this.request = request.defaults(defaults);
      this.graphql = graphql;
    } else {
      // for the benefit of probot applications, we allow a configured instance
      // of octokit to be passed in as a parameter.
      probotMode = true;
      this.octokit = options.octokitAPIs.octokit;
      this.request = options.octokitAPIs.request;
      this.graphql = options.octokitAPIs.graphql;
    }
  }

  private async graphqlRequest(_opts: {
    [key: string]: string | number | null | undefined;
  }) {
    let opts = Object.assign({}, _opts);
    if (!probotMode) {
      opts = Object.assign(opts, {
        url: `${this.apiUrl}/graphql${
          this.proxyKey ? `?key=${this.proxyKey}` : ''
        }`,
        headers: {
          authorization: `${this.proxyKey ? '' : 'token '}${this.token}`,
          'content-type': 'application/vnd.github.v3+json',
        },
      });
    }
    return this.graphql(opts);
  }

  private decoratePaginateOpts(opts: {
    [key: string]: string | number;
  }): { [key: string]: string | number } {
    if (probotMode) {
      return opts;
    } else {
      return Object.assign(opts, {
        headers: {
          Authorization: `${this.proxyKey ? '' : 'token '}${this.token}`,
        },
      });
    }
  }

  async commitsSinceSha(
    sha: string | undefined,
    perPage = 100,
    labels = false,
    path: string | null = null
  ): Promise<Commit[]> {
    const commits: Commit[] = [];
    const method = labels ? 'commitsWithLabels' : 'commitsWithFiles';

    let cursor;
    while (true) {
      const commitsResponse: CommitsResponse = await this[method](
        cursor,
        perPage,
        path
      );
      for (let i = 0, commit: Commit; i < commitsResponse.commits.length; i++) {
        commit = commitsResponse.commits[i];
        if (commit.sha === sha) {
          return commits;
        } else {
          commits.push(commit);
        }
      }
      if (commitsResponse.hasNextPage === false || !commitsResponse.endCursor) {
        return commits;
      } else {
        cursor = commitsResponse.endCursor;
      }
    }
  }

  private async commitsWithFiles(
    cursor: string | undefined = undefined,
    perPage = 32,
    path: string | null = null,
    maxFilesChanged = 64,
    retries = 0
  ): Promise<CommitsResponse> {
    // The GitHub v3 API does not offer an elegant way to fetch commits
    // in conjucntion with the path that they modify. We lean on the graphql
    // API for this one task, fetching commits in descending chronological
    // order along with the file paths attached to them.
    try {
      const response = await this.graphqlRequest({
        query: `query commitsWithFiles($cursor: String, $owner: String!, $repo: String!, $perPage: Int, $maxFilesChanged: Int, $path: String) {
          repository(owner: $owner, name: $repo) {
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: $perPage, after: $cursor, path: $path) {
                    edges{
                      node {
                        ... on Commit {
                          message
                          oid
                          associatedPullRequests(first: 1) {
                            edges {
                              node {
                                ... on PullRequest {
                                  number
                                  mergeCommit {
                                    oid
                                  }
                                  files(first: $maxFilesChanged) {
                                    edges {
                                      node {
                                        path
                                      }
                                    }
                                    pageInfo {
                                      endCursor
                                      hasNextPage
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    pageInfo {
                      endCursor
                      hasNextPage
                    }
                  }
                }
              }
            }
          }
        }`,
        cursor,
        maxFilesChanged,
        owner: this.owner,
        path,
        perPage,
        repo: this.repo,
      });
      return graphqlToCommits(this, response);
    } catch (err) {
      if (err.status === 502 && retries < 3) {
        // GraphQL sometimes returns a 502 on the first request,
        // this seems to relate to a cache being warmed and the
        // second request generally works.
        return this.commitsWithFiles(
          cursor,
          perPage,
          path,
          maxFilesChanged,
          retries++
        );
      } else {
        throw err;
      }
    }
  }

  private async commitsWithLabels(
    cursor: string | undefined = undefined,
    perPage = 32,
    path: string | null = null,
    maxLabels = 16,
    retries = 0
  ): Promise<CommitsResponse> {
    try {
      const response = await this.graphqlRequest({
        query: `query commitsWithLabels($cursor: String, $owner: String!, $repo: String!, $perPage: Int, $maxLabels: Int, $path: String) {
          repository(owner: $owner, name: $repo) {
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: $perPage, after: $cursor, path: $path) {
                    edges{
                      node {
                        ... on Commit {
                          message
                          oid
                          associatedPullRequests(first: 1) {
                            edges {
                              node {
                                ... on PullRequest {
                                  number
                                  mergeCommit {
                                    oid
                                  }
                                  labels(first: $maxLabels) {
                                    edges {
                                      node {
                                        name
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
                    pageInfo {
                      endCursor
                      hasNextPage
                    }
                  }
                }
              }
            }
          }
        }`,
        cursor,
        maxLabels,
        owner: this.owner,
        path,
        perPage,
        repo: this.repo,
      });
      return graphqlToCommits(this, response);
    } catch (err) {
      if (err.status === 502 && retries < 3) {
        // GraphQL sometimes returns a 502 on the first request,
        // this seems to relate to a cache being warmed and the
        // second request generally works.
        return this.commitsWithLabels(
          cursor,
          perPage,
          path,
          maxLabels,
          retries++
        );
      } else {
        throw err;
      }
    }
  }

  async pullRequestFiles(
    num: number,
    cursor: string,
    maxFilesChanged = 100
  ): Promise<PREdge> {
    // Used to handle the edge-case in which a PR has more than 100
    // modified files attached to it.
    const response = await this.graphqlRequest({
      query: `query pullRequestFiles($cursor: String, $owner: String!, $repo: String!, $maxFilesChanged: Int, $num: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $num) {
              number
              files(first: $maxFilesChanged, after: $cursor) {
                edges {
                  node {
                    path
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }
        }`,
      cursor,
      maxFilesChanged,
      owner: this.owner,
      repo: this.repo,
      num,
    });
    return { node: response.repository.pullRequest } as PREdge;
  }

  async getTagSha(name: string): Promise<string> {
    const refResponse = (await this.request(
      `GET /repos/:owner/:repo/git/refs/tags/:name${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        name,
      }
    )) as AnyResponse;
    return refResponse.data.object.sha;
  }

  async latestTag(perPage = 100): Promise<GitHubTag | undefined> {
    const tags: { [version: string]: GitHubTag } = await this.allTags(perPage);
    const versions = Object.keys(tags);
    // no tags have been created yet.
    if (versions.length === 0) return undefined;

    versions.sort(semver.rcompare);
    return {
      name: tags[versions[0]].name,
      sha: tags[versions[0]].sha,
      version: tags[versions[0]].version,
    };
  }

  async findMergedReleasePR(
    labels: string[],
    perPage = 100
  ): Promise<GitHubReleasePR | undefined> {
    const pullsResponse = (await this.request(
      `GET /repos/:owner/:repo/pulls?state=closed&per_page=${perPage}${
        this.proxyKey ? `&key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
      }
    )) as Response<PullsListResponseItem[]>;
    for (let i = 0, pull; i < pullsResponse.data.length; i++) {
      pull = pullsResponse.data[i];
      if (
        this.hasAllLabels(
          labels,
          pull.labels.map(l => l.name)
        )
      ) {
        // it's expected that a release PR will have a
        // HEAD matching the format repo:release-v1.0.0.
        if (!pull.head) continue;
        const match = pull.head.label.match(VERSION_FROM_BRANCH_RE);
        if (!match || !pull.merged_at) continue;
        return {
          number: pull.number,
          sha: pull.merge_commit_sha,
          version: match[1],
        } as GitHubReleasePR;
      }
    }
    return undefined;
  }

  private hasAllLabels(labelsA: string[], labelsB: string[]) {
    let hasAll = true;
    labelsA.forEach(label => {
      if (labelsB.indexOf(label) === -1) hasAll = false;
    });
    return hasAll;
  }

  async findOpenReleasePRs(
    labels: string[],
    perPage = 100
  ): Promise<PullsListResponseItem[]> {
    const openReleasePRs: PullsListResponseItem[] = [];
    const pullsResponse = (await this.request(
      `GET /repos/:owner/:repo/pulls?state=open&per_page=${perPage}${
        this.proxyKey ? `&key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
      }
    )) as Response<PullsListResponseItem[]>;
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

  private async allTags(
    perPage = 100
  ): Promise<{ [version: string]: GitHubTag }> {
    const tags: { [version: string]: GitHubTag } = {};
    for await (const response of this.octokit.paginate.iterator(
      this.decoratePaginateOpts({
        method: 'GET',
        url: `/repos/${this.owner}/${this.repo}/tags?per_page=100${
          this.proxyKey ? `&key=${this.proxyKey}` : ''
        }`,
      })
    )) {
      response.data.forEach((data: ReposListTagsResponseItem) => {
        const version = semver.valid(data.name);
        if (version) {
          tags[version] = { sha: data.commit.sha, name: data.name, version };
        }
      });
    }
    return tags;
  }

  async addLabels(labels: string[], pr: number) {
    checkpoint(
      `adding label ${chalk.green(labels.join(','))} to https://github.com/${
        this.owner
      }/${this.repo}/pull/${pr}`,
      CheckpointType.Success
    );
    return this.request(
      `POST /repos/:owner/:repo/issues/:issue_number/labels${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        issue_number: pr,
        labels,
      }
    );
  }

  async findExistingReleaseIssue(
    title: string,
    labels: string[],
    perPage = 100
  ): Promise<IssuesListResponseItem | undefined> {
    const paged = 0;
    try {
      for await (const response of this.octokit.paginate.iterator(
        this.decoratePaginateOpts({
          method: 'GET',
          url: `/repos/${this.owner}/${this.repo}/issues?labels=${labels.join(
            ','
          )}${this.proxyKey ? `&key=${this.proxyKey}` : ''}`,
          per_page: 100,
        })
      )) {
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
    let openReleasePR: PullsListResponseItem | undefined;

    // If the branch exists, we delete it and create a new branch
    // with the same name; this results in the existing PR being closed.
    if (!refName) {
      refName = `refs/heads/${options.branch}`;

      // the branch didn't yet exist, so make it.
      try {
        checkpoint(
          `creating branch ${chalk.green(options.branch)}`,
          CheckpointType.Success
        );
        await this.request(
          `POST /repos/:owner/:repo/git/refs${
            this.proxyKey ? `?key=${this.proxyKey}` : ''
          }`,
          {
            owner: this.owner,
            repo: this.repo,
            ref: refName,
            sha: options.sha,
            key: this.proxyKey,
          }
        );
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
          CheckpointType.Failure
        );

        // check if there's an existing PR, so that we can opt to update it
        // rather than creating a new PR.
        (await this.findOpenReleasePRs(options.labels)).forEach(
          (releasePR: PullsListResponseItem) => {
            if (refName && refName.indexOf(releasePR.head.ref) !== -1) {
              openReleasePR = releasePR;
            }
          }
        );

        // short-circuit of there have been no changes to the
        // pull-request body.
        if (openReleasePR && openReleasePR.body === options.body) {
          checkpoint(
            `PR https://github.com/${this.owner}/${this.repo}/pull/${openReleasePR.number} remained the same`,
            CheckpointType.Failure
          );
          return -1;
        }

        await this.request(
          `PATCH /repos/:owner/:repo/git/refs/:ref${
            this.proxyKey ? `?key=${this.proxyKey}` : ''
          }`,
          {
            owner: this.owner,
            repo: this.repo,
            // TODO: remove the replace logic depending on the outcome of:
            // https://github.com/octokit/rest.js/issues/1039.
            ref: refName.replace('refs/', ''),
            sha: options.sha,
            force: true,
          }
        );
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
        `update pull-request #${openReleasePR.number}: ${chalk.yellow(
          options.title
        )}`,
        CheckpointType.Success
      );
      await this.request(
        `PATCH /repos/:owner/:repo/pulls/:pull_number${
          this.proxyKey ? `?key=${this.proxyKey}` : ''
        }`,
        {
          pull_number: openReleasePR.number,
          owner: this.owner,
          repo: this.repo,
          title: options.title,
          body: options.body,
          state: 'open',
          base: 'master',
        }
      );
      return openReleasePR.number;
    } else {
      checkpoint(
        `open pull-request: ${chalk.yellow(options.title)}`,
        CheckpointType.Success
      );
      const resp = await this.request(
        `POST /repos/:owner/:repo/pulls${
          this.proxyKey ? `?key=${this.proxyKey}` : ''
        }`,
        {
          owner: this.owner,
          repo: this.repo,
          title: options.title,
          body: options.body,
          head: options.branch,
          base: 'master',
        }
      );
      return resp.data.number;
    }
  }

  async updateFiles(updates: Update[], branch: string, refName: string) {
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      let content;
      try {
        if (update.contents) {
          // we already loaded the file contents earlier, let's not
          // hit GitHub again.
          content = { data: update.contents };
        } else {
          content = await this.request(
            `GET /repos/:owner/:repo/contents/:path${
              this.proxyKey ? `?key=${this.proxyKey}` : ''
            }`,
            {
              owner: this.owner,
              repo: this.repo,
              path: update.path,
              ref: refName,
            }
          );
        }
      } catch (err) {
        if (err.status !== 404) throw err;
        // if the file is missing and create = false, just continue
        // to the next update, otherwise create the file.
        if (!update.create) {
          checkpoint(
            `file ${chalk.green(update.path)} did not exist`,
            CheckpointType.Failure
          );
          continue;
        }
      }
      const contentText = content
        ? Buffer.from(content.data.content, 'base64').toString('utf8')
        : undefined;
      const updatedContent = update.updateContent(contentText);

      if (content) {
        await this.request(
          `PUT /repos/:owner/:repo/contents/:path${
            this.proxyKey ? `?key=${this.proxyKey}` : ''
          }`,
          {
            owner: this.owner,
            repo: this.repo,
            path: update.path,
            message: `updated ${update.path} [ci skip]`,
            content: Buffer.from(updatedContent, 'utf8').toString('base64'),
            sha: content.data.sha,
            branch,
          }
        );
      } else {
        await this.request(
          `PUT /repos/:owner/:repo/contents/:path${
            this.proxyKey ? `?key=${this.proxyKey}` : ''
          }`,
          {
            owner: this.owner,
            repo: this.repo,
            path: update.path,
            message: `created ${update.path} [ci skip]`,
            content: Buffer.from(updatedContent, 'utf8').toString('base64'),
            branch,
          }
        );
      }
    }
  }

  private async refByBranchName(branch: string): Promise<string | undefined> {
    let ref;
    try {
      for await (const response of this.octokit.paginate.iterator(
        this.decoratePaginateOpts({
          method: 'GET',
          url: `/repos/${this.owner}/${this.repo}/git/refs?per_page=100${
            this.proxyKey ? `&key=${this.proxyKey}` : ''
          }`,
        })
      )) {
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
    await this.request(
      `PATCH /repos/:owner/:repo/pulls/:pull_number${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        state: 'closed',
      }
    );
  }

  async getFileContents(path: string): Promise<GitHubFileContents> {
    const resp = await this.request(
      `GET /repos/:owner/:repo/contents/:path${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        path,
      }
    );
    return {
      parsedContent: Buffer.from(resp.data.content, 'base64').toString('utf8'),
      content: resp.data.content,
      sha: resp.data.sha,
    };
  }

  async createRelease(
    packageName: string,
    version: string,
    sha: string,
    releaseNotes: string
  ) {
    checkpoint(`creating release ${version}`, CheckpointType.Success);
    await this.request(
      `POST /repos/:owner/:repo/releases${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        tag_name: version,
        target_commitish: sha,
        body: releaseNotes,
        name: `${packageName} ${version}`,
      }
    );
  }

  async removeLabels(labels: string[], prNumber: number) {
    for (let i = 0, label; i < labels.length; i++) {
      label = labels[i];
      checkpoint(
        `removing label ${chalk.green(label)} from ${chalk.green(
          '' + prNumber
        )}`,
        CheckpointType.Success
      );
      await this.request(
        `DELETE /repos/:owner/:repo/issues/:issue_number/labels/:name${
          this.proxyKey ? `?key=${this.proxyKey}` : ''
        }`,
        {
          owner: this.owner,
          repo: this.repo,
          issue_number: prNumber,
          name: label,
        }
      );
    }
  }

  async findFilesByFilename(filename: string): Promise<string[]> {
    const response: Octokit.Response<FileSearchResponse> = await this.octokit.search.code(
      {
        q: `filename:${filename}+repo:${this.owner}/${this.repo}`,
      }
    );
    return response.data.items.map(file => {
      return file.path;
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
