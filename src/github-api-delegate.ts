// Copyright 2026 Google LLC
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

import {Octokit} from '@octokit/rest';
import {request} from '@octokit/request';
import {RequestError} from '@octokit/request-error';
import {createPullRequest as suggesterCreatePullRequest} from 'code-suggester';
import {Logger} from 'code-suggester/build/src/types';

import {PullRequest} from './pull-request';
import {Repository} from './repository';
import {ReleasePullRequest} from './release-pull-request';
import {Release} from './release';
import {
  ScmRelease,
  ScmReleaseIteratorOptions,
  ScmCreatePullRequestOptions,
  ScmReleaseOptions,
  ScmCommitIteratorOptions,
  ScmChangeSet,
} from './scm';
import {
  GitHubAPIError,
  DuplicateReleaseError,
  ConfigurationError,
} from './errors';
import {logger as defaultLogger} from './util/logger';
import {signoffCommitMessage} from './util/signoff-commit-message';
import {PullRequestOverflowHandler} from './util/pull-request-overflow-handler';

export type OctokitType = InstanceType<typeof Octokit>;

// Extract some types from the `request` package.
type RequestBuilderType = typeof request;
type DefaultFunctionType = RequestBuilderType['defaults'];
type RequestFunctionType = ReturnType<DefaultFunctionType>;

export interface OctokitAPIs {
  graphql: Function;
  request: RequestFunctionType;
  octokit: OctokitType;
}

export interface GitHubApiDelegateOptions {
  repository: Repository;
  octokitAPIs: OctokitAPIs;
  logger?: Logger;
}

export interface GraphQLCommit {
  sha: string;
  message: string;
  associatedPullRequests: {
    nodes: GraphQLPullRequest[];
  };
}

export interface GraphQLPullRequest {
  number: number;
  title: string;
  body: string;
  baseRefName: string;
  headRefName: string;
  labels: {
    nodes: {
      name: string;
    }[];
  };
  mergeCommit?: {
    oid: string;
  };
  files: {
    nodes: {
      path: string;
    }[];
    pageInfo: {
      hasNextPage: boolean;
    };
  };
}

export interface PullRequestHistory {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | undefined;
  };
  data: PullRequest[];
}

export interface CommitHistory {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | undefined;
  };
  data: ScmRelease[]; // Wait, ScmRelease? Let's check CommitHistory in github.ts
}

export type CommitIteratorOptions = ScmCommitIteratorOptions;
export interface GraphQLRelease {
  name: string;
  tag: {
    name: string;
  };
  tagCommit: {
    oid: string;
  };
  url: string;
  description: string;
  isDraft: boolean;
}

export interface ReleaseHistory {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | undefined;
  };
  data: ScmRelease[];
}

export type ReleaseIteratorOptions = ScmReleaseIteratorOptions;

export const MAX_SLEEP_SECONDS = 20;
export const MAX_ISSUE_BODY_SIZE = 65536;

export class GitHubApiDelegate {
  readonly repository: Repository;
  private octokit: OctokitType;
  private graphql: Function;
  private logger: Logger;

  constructor(options: GitHubApiDelegateOptions) {
    this.repository = options.repository;
    this.octokit = options.octokitAPIs.octokit;
    this.graphql = options.octokitAPIs.graphql;
    this.logger = options.logger ?? defaultLogger;
  }

  private graphqlRequest = wrapAsync(
    async (
      opts: {
        [key: string]: string | number | null | undefined;
      },
      options?: {
        maxRetries?: number;
      }
    ) => {
      let maxRetries = options?.maxRetries ?? 5;
      let seconds = 1;
      while (maxRetries >= 0) {
        try {
          const response = await this.graphql(opts);
          if (response) {
            return response;
          }
          this.logger.trace('no GraphQL response, retrying');
        } catch (err) {
          if ((err as GitHubAPIError).status !== 502) {
            throw err;
          }
          if (maxRetries === 0) {
            this.logger.warn('ran out of retries and response is required');
            throw err;
          }
          this.logger.info(
            `received 502 error, ${maxRetries} attempts remaining`
          );
        }
        maxRetries -= 1;
        if (maxRetries >= 0) {
          this.logger.trace(`sleeping ${seconds} seconds`);
          await sleepInMs(1000 * seconds);
          seconds = Math.min(seconds * 2, MAX_SLEEP_SECONDS);
        }
      }
      this.logger.trace('ran out of retries');
      return undefined;
    }
  );

  /**
   * Iterate through merged pull requests with a max number of results scanned.
   *
   * @param {string} targetBranch Target branch of commit.
   * @param {string} status The status of the pull request. Defaults to 'MERGED'.
   * @param {number} maxResults Limit the number of results searched. Defaults to
   *   unlimited.
   * @param {boolean} includeFiles Whether to fetch the list of files included in
   *   the pull request. Defaults to `true`.
   * @yields {PullRequest}
   * @throws {GitHubAPIError} on an API error
   */
  async *pullRequestIterator(
    targetBranch: string,
    status: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    maxResults: number = Number.MAX_SAFE_INTEGER,
    includeFiles = true
  ): AsyncGenerator<PullRequest, void, void> {
    const generator = includeFiles
      ? this.pullRequestIteratorWithFiles(targetBranch, status, maxResults)
      : this.pullRequestIteratorWithoutFiles(targetBranch, status, maxResults);
    for await (const pullRequest of generator) {
      yield pullRequest;
    }
  }

  /**
   * Helper implementation of pullRequestIterator that includes files via
   * the graphQL API.
   *
   * @param {string} targetBranch The base branch of the pull request
   * @param {string} status The status of the pull request
   * @param {number} maxResults Limit the number of results searched
   */
  private async *pullRequestIteratorWithFiles(
    targetBranch: string,
    status: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    maxResults: number = Number.MAX_SAFE_INTEGER
  ): AsyncGenerator<PullRequest, void, void> {
    let cursor: string | undefined = undefined;
    let results = 0;
    while (results < maxResults) {
      const response: PullRequestHistory | null =
        await this.pullRequestsGraphQL(targetBranch, status, cursor);
      // no response usually means we ran out of results
      if (!response) {
        break;
      }
      for (let i = 0; i < response.data.length; i++) {
        results += 1;
        yield response.data[i];
      }
      if (!response.pageInfo.hasNextPage) {
        break;
      }
      cursor = response.pageInfo.endCursor;
    }
  }

  /**
   * Helper implementation of pullRequestIterator that excludes files
   * via the REST API.
   *
   * @param {string} targetBranch The base branch of the pull request
   * @param {string} status The status of the pull request
   * @param {number} maxResults Limit the number of results searched
   */
  private async *pullRequestIteratorWithoutFiles(
    targetBranch: string,
    status: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    maxResults: number = Number.MAX_SAFE_INTEGER
  ): AsyncGenerator<PullRequest, void, void> {
    const statusMap: Record<string, 'open' | 'closed'> = {
      OPEN: 'open',
      CLOSED: 'closed',
      MERGED: 'closed',
    };
    let results = 0;
    for await (const {data: pulls} of this.octokit.paginate.iterator(
      'GET /repos/{owner}/{repo}/pulls',
      {
        state: statusMap[status],
        owner: this.repository.owner,
        repo: this.repository.repo,
        base: targetBranch,
        sort: 'updated',
        direction: 'desc',
      }
    )) {
      for (const pull of pulls) {
        // The REST API does not have an option for "merged"
        // pull requests - they are closed with a `merged_at` timestamp
        if (status !== 'MERGED' || pull.merged_at) {
          results += 1;
          yield {
            headBranchName: pull.head.ref,
            baseBranchName: pull.base.ref,
            number: pull.number,
            title: pull.title,
            body: pull.body || '',
            labels: pull.labels.map((label: any) => label.name),
            files: [],
            sha: pull.merge_commit_sha || undefined,
          };
          if (results >= maxResults) {
            break;
          }
        }
      }

      if (results >= maxResults) {
        break;
      }
    }
  }

  /**
   * Return a list of merged pull requests. The list is not guaranteed to be sorted
   * by merged_at, but is generally most recent first.
   *
   * @param {string} targetBranch - Base branch of the pull request. Defaults to
   *   the configured default branch.
   * @param {number} page - Page of results. Defaults to 1.
   * @param {number} perPage - Number of results per page. Defaults to 100.
   * @returns {PullRequestHistory | null} - List of merged pull requests
   * @throws {GitHubAPIError} on an API error
   */
  private async pullRequestsGraphQL(
    targetBranch: string,
    states: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    cursor?: string
  ): Promise<PullRequestHistory | null> {
    this.logger.debug(
      `Fetching ${states} pull requests on branch ${targetBranch} with cursor ${cursor}`
    );
    const response = await this.graphqlRequest({
      query: `query mergedPullRequests($owner: String!, $repo: String!, $num: Int!, $maxFilesChanged: Int, $targetBranch: String!, $states: [PullRequestState!], $cursor: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: $num, after: $cursor, baseRefName: $targetBranch, states: $states, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              number
              title
              baseRefName
              headRefName
              labels(first: 10) {
                nodes {
                  name
                }
              }
              body
              mergeCommit {
                oid
              }
              files(first: $maxFilesChanged) {
                nodes {
                  path
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }`,
      cursor,
      owner: this.repository.owner,
      repo: this.repository.repo,
      num: 25,
      targetBranch,
      states,
      maxFilesChanged: 64,
    });
    if (!response?.repository?.pullRequests) {
      this.logger.warn(
        `Could not find merged pull requests for branch ${targetBranch} - it likely does not exist.`
      );
      return null;
    }
    const pullRequests = (response.repository.pullRequests.nodes ||
      []) as GraphQLPullRequest[];
    return {
      pageInfo: response.repository.pullRequests.pageInfo,
      data: pullRequests.map(pullRequest => {
        return {
          sha: pullRequest.mergeCommit?.oid, // already filtered non-merged
          number: pullRequest.number,
          baseBranchName: pullRequest.baseRefName,
          headBranchName: pullRequest.headRefName,
          labels: (pullRequest.labels?.nodes || []).map(l => l.name),
          title: pullRequest.title,
          body: pullRequest.body + '',
          files: (pullRequest.files?.nodes || []).map(node => node.path),
        };
      }),
    };
  }

  /**
   * Iterate through releases with a max number of results scanned.
   *
   * @param {ReleaseIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results scanned.
   *   Defaults to unlimited.
   * @yields {ScmRelease}
   * @throws {GitHubAPIError} on an API error
   */
  async *releaseIterator(options: ReleaseIteratorOptions = {}) {
    const maxResults = options.maxResults ?? Number.MAX_SAFE_INTEGER;
    let results = 0;
    let cursor: string | undefined = undefined;
    while (true) {
      const response: ReleaseHistory | null = await this.releaseGraphQL(cursor);
      if (!response) {
        break;
      }
      for (let i = 0; i < response.data.length; i++) {
        if ((results += 1) > maxResults) {
          break;
        }
        yield response.data[i];
      }
      if (results > maxResults || !response.pageInfo.hasNextPage) {
        break;
      }
      cursor = response.pageInfo.endCursor;
    }
  }

  private async releaseGraphQL(
    cursor?: string
  ): Promise<ReleaseHistory | null> {
    this.logger.debug(`Fetching releases with cursor ${cursor}`);
    const response = await this.graphqlRequest({
      query: `query releases($owner: String!, $repo: String!, $num: Int!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          releases(first: $num, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              name
              tag {
                name
              }
              tagCommit {
                oid
              }
              url
              description
              isDraft
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }`,
      cursor,
      owner: this.repository.owner,
      repo: this.repository.repo,
      num: 25,
    });
    if (!response?.repository?.releases?.nodes?.length) {
      this.logger.warn('Could not find releases.');
      return null;
    }
    const releases = response.repository.releases.nodes as GraphQLRelease[];
    return {
      pageInfo: response.repository.releases.pageInfo,
      data: releases
        .filter(release => !!release.tagCommit)
        .map(release => {
          if (!release.tag || !release.tagCommit) {
            this.logger.debug(release);
          }
          return {
            name: release.name || undefined,
            tagName: release.tag ? release.tag.name : 'unknown',
            sha: release.tagCommit.oid,
            notes: release.description,
            url: release.url,
            draft: release.isDraft,
          } as ScmRelease;
        }),
    } as ReleaseHistory;
  }

  /**
   * Create a pull request given a changeset.
   */
  createPullRequestFromChanges = wrapAsync(
    async (
      pullRequest: PullRequest,
      targetBranch: string,
      message: string,
      changes: ScmChangeSet,
      options?: ScmCreatePullRequestOptions
    ): Promise<PullRequest> => {
      const prNumber = await suggesterCreatePullRequest(this.octokit, changes, {
        upstreamOwner: this.repository.owner,
        upstreamRepo: this.repository.repo,
        title: pullRequest.title,
        branch: pullRequest.headBranchName,
        description: pullRequest.body,
        primary: targetBranch,
        force: true,
        fork: !!options?.fork,
        message,
        logger: this.logger,
        draft: !!options?.draft,
        labels: pullRequest.labels,
      });
      return await this.getPullRequest(prNumber);
    }
  );

  /**
   * Fetch a pull request given the pull number
   * @param {number} number The pull request number
   * @returns {PullRequest}
   */
  getPullRequest = wrapAsync(async (number: number): Promise<PullRequest> => {
    const response = await this.octokit.pulls.get({
      owner: this.repository.owner,
      repo: this.repository.repo,
      pull_number: number,
    });
    return {
      headBranchName: response.data.head.ref,
      baseBranchName: response.data.base.ref,
      number: response.data.number,
      title: response.data.title,
      body: response.data.body || '',
      files: [],
      labels: response.data.labels
        .map((label: any) => label.name)
        .filter((name: any) => !!name) as string[],
    };
  });

  /**
   * Update a pull request's title and body given a changeset.
   */
  updatePullRequestFromChanges = wrapAsync(
    async (
      number: number,
      releasePullRequest: ReleasePullRequest,
      targetBranch: string,
      changes: ScmChangeSet,
      options?: {
        signoffUser?: string;
        fork?: boolean;
        pullRequestOverflowHandler?: PullRequestOverflowHandler;
      }
    ): Promise<PullRequest> => {
      let message = releasePullRequest.title.toString();
      if (options?.signoffUser) {
        message = signoffCommitMessage(message, options.signoffUser);
      }
      const title = releasePullRequest.title.toString();
      const body = (
        options?.pullRequestOverflowHandler
          ? await options.pullRequestOverflowHandler.handleOverflow(
              releasePullRequest
            )
          : releasePullRequest.body
      )
        .toString()
        .slice(0, MAX_ISSUE_BODY_SIZE);
      const prNumber = await suggesterCreatePullRequest(this.octokit, changes, {
        upstreamOwner: this.repository.owner,
        upstreamRepo: this.repository.repo,
        title,
        branch: releasePullRequest.headRefName,
        description: body,
        primary: targetBranch,
        force: true,
        fork: options?.fork === false ? false : true,
        message,
        logger: this.logger,
        draft: releasePullRequest.draft,
      });
      if (prNumber !== number) {
        this.logger.warn(
          `updated code for ${prNumber}, but update requested for ${number}`
        );
      }
      const response = await this.octokit.pulls.update({
        owner: this.repository.owner,
        repo: this.repository.repo,
        pull_number: number,
        title: releasePullRequest.title.toString(),
        body,
        state: 'open',
      });
      return {
        headBranchName: response.data.head.ref,
        baseBranchName: response.data.base.ref,
        number: response.data.number,
        title: response.data.title,
        body: response.data.body || '',
        files: [],
        labels: response.data.labels
          .map((label: any) => label.name)
          .filter((name: any) => !!name) as string[],
      };
    }
  );

  /**
   * Create a GitHub release
   *
   * @param {Release} release Release parameters
   * @param {ScmReleaseOptions} options Release option parameters
   * @throws {DuplicateReleaseError} if the release tag already exists
   * @throws {GitHubAPIError} on other API errors
   */
  createRelease = wrapAsync(
    async (
      release: Release,
      options: ScmReleaseOptions = {}
    ): Promise<ScmRelease> => {
      if (options.forceTag) {
        try {
          await this.octokit.git.createRef({
            owner: this.repository.owner,
            repo: this.repository.repo,
            ref: `refs/tags/${release.tag.toString()}`,
            sha: release.sha,
          });
        } catch (err) {
          // ignore if tag already exists
          if ((err as RequestError).status === 422) {
            this.logger.debug(
              `Tag ${release.tag.toString()} already exists, skipping tag creation`
            );
          } else {
            throw err;
          }
        }
      }
      const resp = await this.octokit.repos.createRelease({
        name: release.name,
        owner: this.repository.owner,
        repo: this.repository.repo,
        tag_name: release.tag.toString(),
        body: release.notes,
        draft: !!options.draft,
        prerelease: !!options.prerelease,
        target_commitish: release.sha,
      });
      return {
        id: resp.data.id,
        name: resp.data.name || undefined,
        tagName: resp.data.tag_name,
        sha: resp.data.target_commitish,
        notes:
          resp.data.body_text ||
          resp.data.body ||
          resp.data.body_html ||
          undefined,
        url: resp.data.html_url,
        draft: resp.data.draft,
        uploadUrl: resp.data.upload_url,
      };
    },
    e => {
      if (e instanceof RequestError) {
        if (
          e.status === 422 &&
          GitHubAPIError.parseErrors(e).some(error => {
            return error.code === 'already_exists';
          })
        ) {
          throw new DuplicateReleaseError(e, 'tagName');
        }
      }
    }
  );

  /**
   * Makes a comment on a issue/pull request.
   *
   * @param {string} comment - The body of the comment to post.
   * @param {number} number - The issue or pull request number.
   * @throws {GitHubAPIError} on an API error
   */
  commentOnIssue = wrapAsync(
    async (comment: string, number: number): Promise<string> => {
      this.logger.debug(
        `adding comment to https://github.com/${this.repository.owner}/${this.repository.repo}/issues/${number}`
      );
      const resp = await this.octokit.issues.createComment({
        owner: this.repository.owner,
        repo: this.repository.repo,
        issue_number: number,
        body: comment,
      });
      return resp.data.html_url;
    }
  );

  /**
   * Removes labels from an issue/pull request.
   *
   * @param {string[]} labels The labels to remove.
   * @param {number} number The issue/pull request number.
   */
  removeIssueLabels = wrapAsync(
    async (labels: string[], number: number): Promise<void> => {
      if (labels.length === 0) {
        return;
      }
      this.logger.debug(`removing labels: ${labels} from issue/pull ${number}`);
      await Promise.all(
        labels.map(label =>
          this.octokit.issues.removeLabel({
            owner: this.repository.owner,
            repo: this.repository.repo,
            issue_number: number,
            name: label,
          })
        )
      );
    }
  );

  /**
   * Adds label to an issue/pull request.
   *
   * @param {string[]} labels The labels to add.
   * @param {number} number The issue/pull request number.
   */
  addIssueLabels = wrapAsync(
    async (labels: string[], number: number): Promise<void> => {
      if (labels.length === 0) {
        return;
      }
      this.logger.debug(`adding labels: ${labels} from issue/pull ${number}`);
      await this.octokit.issues.addLabels({
        owner: this.repository.owner,
        repo: this.repository.repo,
        issue_number: number,
        labels,
      });
    }
  );

  /**
   * Generate release notes from GitHub at tag
   * @param {string} tagName Name of new release tag
   * @param {string} targetCommitish Target commitish for new tag
   * @param {string} previousTag Optional. Name of previous tag to analyze commits since
   */
  async generateReleaseNotes(
    tagName: string,
    targetCommitish: string,
    previousTag?: string
  ): Promise<string> {
    const resp = await this.octokit.repos.generateReleaseNotes({
      owner: this.repository.owner,
      repo: this.repository.repo,
      tag_name: tagName,
      previous_tag_name: previousTag,
      target_commitish: targetCommitish,
    });
    return resp.data.body;
  }

  /**
   * Create a single file on a new branch based on an existing
   * branch. This will force-push to that branch.
   * @param {string} filename Filename with path in the repository
   * @param {string} contents Contents of the file
   * @param {string} newBranchName Name of the new branch
   * @param {string} baseBranchName Name of the base branch (where
   *   new branch is forked from)
   * @returns {string} HTML URL of the new file
   */
  async createFileOnNewBranch(
    filename: string,
    contents: string,
    newBranchName: string,
    baseBranchName: string
  ): Promise<string> {
    // create or update new branch to match base branch
    await this.forkBranch(newBranchName, baseBranchName);

    // use the single file upload API
    const {
      data: {content},
    } = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.repository.owner,
      repo: this.repository.repo,
      path: filename,
      // contents need to be base64 encoded
      content: Buffer.from(contents, 'binary').toString('base64'),
      message: 'Saving release notes',
      branch: newBranchName,
    });
    return content?.html_url || '';
  }

  /**
   * Fork a branch from a base branch.
   */
  private async forkBranch(
    targetBranchName: string,
    baseBranchName: string
  ): Promise<string> {
    const baseBranchSha = await this.getBranchSha(baseBranchName);
    if (!baseBranchSha) {
      throw new ConfigurationError(
        `Unable to find base branch: ${baseBranchName}`,
        'core',
        `${this.repository.owner}/${this.repository.repo}`
      );
    }
    if (await this.getBranchSha(targetBranchName)) {
      const branchSha = await this.updateBranchSha(
        targetBranchName,
        baseBranchSha
      );
      this.logger.debug(
        `Updated ${targetBranchName} to match ${baseBranchName} at ${branchSha}`
      );
      return branchSha;
    } else {
      const branchSha = await this.createNewBranch(
        targetBranchName,
        baseBranchSha
      );
      this.logger.debug(
        `Created ${targetBranchName} from ${baseBranchName} at ${branchSha}`
      );
      return branchSha;
    }
  }

  /**
   * Helper to fetch the SHA of a branch
   */
  private async getBranchSha(branchName: string): Promise<string | undefined> {
    this.logger.debug(`Looking up SHA for branch: ${branchName}`);
    try {
      const {
        data: {
          object: {sha},
        },
      } = await this.octokit.git.getRef({
        owner: this.repository.owner,
        repo: this.repository.repo,
        ref: `heads/${branchName}`,
      });
      this.logger.debug(`SHA for branch: ${sha}`);
      return sha;
    } catch (e) {
      if (e instanceof RequestError && e.status === 404) {
        this.logger.debug(`Branch: ${branchName} does not exist`);
        return undefined;
      }
      throw e;
    }
  }

  /**
   * Helper to create a new branch from a given SHA.
   */
  private async createNewBranch(
    branchName: string,
    branchSha: string
  ): Promise<string> {
    this.logger.debug(`Creating new branch: ${branchName} at ${branchSha}`);
    const {
      data: {
        object: {sha},
      },
    } = await this.octokit.git.createRef({
      owner: this.repository.owner,
      repo: this.repository.repo,
      ref: `refs/heads/${branchName}`,
      sha: branchSha,
    });
    this.logger.debug(`New branch: ${branchName} at ${sha}`);
    return sha;
  }

  /**
   * Helper to update branch SHA.
   */
  private async updateBranchSha(
    branchName: string,
    branchSha: string
  ): Promise<string> {
    this.logger.debug(`Updating branch ${branchName} to ${branchSha}`);
    const {
      data: {
        object: {sha},
      },
    } = await this.octokit.git.updateRef({
      owner: this.repository.owner,
      repo: this.repository.repo,
      ref: `heads/${branchName}`,
      sha: branchSha,
      force: true,
    });
    this.logger.debug(`Updated branch: ${branchName} to ${sha}`);
    return sha;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const wrapAsync = <T extends Array<any>, V>(
  fn: (...args: T) => Promise<V>,
  errorHandler?: (e: Error) => void
) => {
  return async (...args: T): Promise<V> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (errorHandler) {
        errorHandler(e as GitHubAPIError);
      }
      if (e instanceof RequestError) {
        throw new GitHubAPIError(e);
      }
      throw e;
    }
  };
};

export const sleepInMs = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));
