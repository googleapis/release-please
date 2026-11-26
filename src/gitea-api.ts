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

import {RequestError} from '@octokit/request-error';
import {Repository} from './repository';
import {PullRequest} from './pull-request';
import {Release} from './release';
import {ScmRelease, ScmReleaseOptions} from './scm';
import {AuthError, DuplicateReleaseError, GitHubAPIError} from './errors';
import {Logger} from './util/code-suggester/types';
import {logger as defaultLogger} from './util/logger';

/* eslint-disable @typescript-eslint/no-explicit-any */
type FetchFunction = (url: string, init?: any) => Promise<any>;

const PAGE_SIZE = 50;
const DEFAULT_LABEL_COLOR = '#ededed';

export interface GiteaApiCreateOptions {
  owner: string;
  repo: string;
  /**
   * Gitea API base URL, e.g. `https://gitea.example.com/api/v1`.
   * A bare server URL (`https://gitea.example.com`) is also accepted.
   */
  apiUrl: string;
  token?: string;
  defaultBranch?: string;
  fetch?: FetchFunction;
  logger?: Logger;
}

export interface GiteaRepoInfo {
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
}

export interface GiteaLabel {
  id: number;
  name: string;
}

export interface GiteaPull {
  number: number;
  title: string;
  body?: string | null;
  html_url: string;
  state: 'open' | 'closed';
  merged?: boolean;
  merge_commit_sha?: string | null;
  labels?: GiteaLabel[] | null;
  head: {ref: string};
  base: {ref: string};
}

interface GiteaRelease {
  id: number;
  name?: string;
  tag_name: string;
  target_commitish: string;
  body?: string;
  html_url: string;
  draft: boolean;
  upload_url?: string;
}

/**
 * Normalize a user supplied Gitea URL into its REST API base URL.
 */
export function normalizeGiteaApiUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return /\/api\/v1$/.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
}

/**
 * Thin client for the parts of the Gitea REST API (v1) that release-please
 * needs: pull requests, releases, tags, labels and comments.
 */
export class GiteaApi {
  readonly repository: Repository;
  readonly apiUrl: string;
  readonly repoInfo: GiteaRepoInfo;
  private token?: string;
  private fetchFn: FetchFunction;
  private logger: Logger;
  private labelCache?: Promise<Map<string, number>>;

  constructor(options: {
    repository: Repository;
    apiUrl: string;
    repoInfo: GiteaRepoInfo;
    token?: string;
    fetch?: FetchFunction;
    logger?: Logger;
  }) {
    this.repository = options.repository;
    this.apiUrl = normalizeGiteaApiUrl(options.apiUrl);
    this.repoInfo = options.repoInfo;
    this.token = options.token;
    this.fetchFn = options.fetch ?? (globalThis.fetch as FetchFunction);
    this.logger = options.logger ?? defaultLogger;
  }

  static async create(options: GiteaApiCreateOptions): Promise<GiteaApi> {
    const bootstrap = new GiteaApi({
      repository: {
        owner: options.owner,
        repo: options.repo,
        defaultBranch: options.defaultBranch ?? '',
      },
      apiUrl: options.apiUrl,
      repoInfo: {defaultBranch: '', cloneUrl: '', htmlUrl: ''},
      token: options.token,
      fetch: options.fetch,
      logger: options.logger,
    });
    const data = await bootstrap.request<any>('GET', bootstrap.repoPath(''));
    const repoInfo: GiteaRepoInfo = {
      defaultBranch: data.default_branch,
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
    };
    return new GiteaApi({
      repository: {
        owner: options.owner,
        repo: options.repo,
        defaultBranch: options.defaultBranch ?? repoInfo.defaultBranch,
      },
      apiUrl: options.apiUrl,
      repoInfo,
      token: options.token,
      fetch: options.fetch,
      logger: options.logger,
    });
  }

  private repoPath(suffix: string): string {
    const owner = encodeURIComponent(this.repository.owner);
    const repo = encodeURIComponent(this.repository.repo);
    return `/repos/${owner}/${repo}${suffix}`;
  }

  /**
   * Perform a request against the Gitea API. Non-2xx responses are thrown as
   * GitHubAPIError so that the rest of release-please can handle them the
   * same way it handles GitHub errors.
   */
  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | undefined>
  ): Promise<T> {
    const response = await this.rawRequest(method, path, body, query);
    if (response.status === 204) {
      return undefined as T;
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async rawRequest(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | undefined>
  ): Promise<any> {
    const url = new URL(`${this.apiUrl}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, `${value}`);
      }
    }
    const headers: Record<string, string> = {
      accept: 'application/json',
      'user-agent': 'release-please',
    };
    if (this.token) {
      headers.authorization = `token ${this.token}`;
    }
    if (body !== undefined) {
      headers['content-type'] = 'application/json';
    }
    this.logger.trace(`${method} ${url.toString()}`);
    const response = await this.fetchFn(url.toString(), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    const text = await response.text();
    let data: any = text;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      // keep raw text
    }
    const message = `Gitea API ${method} ${url.pathname} failed with ${
      response.status
    }: ${typeof data === 'object' && data?.message ? data.message : text}`;
    const requestError = new RequestError(message, response.status, {
      request: {method: method as any, url: url.toString(), headers: {}},
      response: {
        status: response.status,
        url: url.toString(),
        headers: {},
        data,
      },
    });
    if (response.status === 401) {
      throw new AuthError(requestError);
    }
    throw new GitHubAPIError(requestError);
  }

  /**
   * Iterate through a paginated list endpoint.
   */
  private async *paginate<T>(
    path: string,
    query: Record<string, string | number | undefined> = {}
  ): AsyncGenerator<T, void, void> {
    for (let page = 1; ; page++) {
      const items = await this.request<T[]>('GET', path, undefined, {
        ...query,
        page,
        limit: PAGE_SIZE,
      });
      if (!items || items.length === 0) {
        return;
      }
      for (const item of items) {
        yield item;
      }
      if (items.length < PAGE_SIZE) {
        return;
      }
    }
  }

  static toPullRequest(pull: GiteaPull, files: string[] = []): PullRequest {
    return {
      headBranchName: pull.head.ref,
      baseBranchName: pull.base.ref,
      number: pull.number,
      title: pull.title,
      body: pull.body || '',
      labels: (pull.labels ?? []).map(label => label.name).filter(n => !!n),
      files,
      sha: pull.merge_commit_sha || undefined,
      mergeCommitOid: pull.merged
        ? pull.merge_commit_sha || undefined
        : undefined,
    };
  }

  /**
   * Iterate through pull requests targeting a branch, most recently updated
   * first.
   *
   * `CLOSED` yields pull requests closed without being merged, matching the
   * semantics of GitHub's `CLOSED` pull request state.
   */
  async *pullRequestIterator(
    targetBranch: string,
    status: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    maxResults: number = Number.MAX_SAFE_INTEGER,
    includeFiles = true
  ): AsyncGenerator<PullRequest, void, void> {
    let results = 0;
    for await (const pull of this.paginate<GiteaPull>(this.repoPath('/pulls'), {
      state: status === 'OPEN' ? 'open' : 'closed',
      sort: 'recentupdate',
    })) {
      if (results >= maxResults) {
        return;
      }
      if (pull.base.ref !== targetBranch) {
        continue;
      }
      if (status === 'MERGED' && !pull.merged) {
        continue;
      }
      if (status === 'CLOSED' && pull.merged) {
        continue;
      }
      results += 1;
      const files = includeFiles
        ? await this.getPullRequestFiles(pull.number)
        : [];
      yield GiteaApi.toPullRequest(pull, files);
    }
  }

  async getPullRequestFiles(number: number): Promise<string[]> {
    const files: string[] = [];
    for await (const file of this.paginate<{filename: string}>(
      this.repoPath(`/pulls/${number}/files`)
    )) {
      files.push(file.filename);
    }
    return files;
  }

  async getPull(number: number): Promise<GiteaPull> {
    return await this.request<GiteaPull>(
      'GET',
      this.repoPath(`/pulls/${number}`)
    );
  }

  /**
   * Fetch a pull request, returning undefined if the number does not refer
   * to a pull request (e.g. it is an issue or does not exist).
   */
  async findPull(number: number): Promise<GiteaPull | undefined> {
    try {
      return await this.getPull(number);
    } catch (e) {
      if (e instanceof GitHubAPIError && e.status === 404) {
        return undefined;
      }
      throw e;
    }
  }

  async getPullRequest(number: number): Promise<PullRequest> {
    return GiteaApi.toPullRequest(await this.getPull(number));
  }

  async findOpenPullRequest(
    headBranchName: string,
    baseBranchName: string
  ): Promise<GiteaPull | undefined> {
    for await (const pull of this.paginate<GiteaPull>(this.repoPath('/pulls'), {
      state: 'open',
      sort: 'recentupdate',
    })) {
      if (
        pull.head.ref === headBranchName &&
        pull.base.ref === baseBranchName
      ) {
        return pull;
      }
    }
    return undefined;
  }

  async createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    options?: {draft?: boolean}
  ): Promise<PullRequest> {
    let title = pullRequest.title;
    if (options?.draft && !/^(WIP:|\[WIP\])/i.test(title)) {
      // Gitea marks pull requests as drafts via a "WIP:" title prefix
      title = `WIP: ${title}`;
    }
    const labels = await this.getLabelIds(pullRequest.labels, true);
    const pull = await this.request<GiteaPull>(
      'POST',
      this.repoPath('/pulls'),
      {
        head: pullRequest.headBranchName,
        base: targetBranch,
        title,
        body: pullRequest.body,
        labels,
      }
    );
    this.logger.info(
      `Successfully opened pull request available at url: ${pull.html_url}.`
    );
    return GiteaApi.toPullRequest(pull);
  }

  async updatePullRequest(
    number: number,
    title: string,
    body: string
  ): Promise<PullRequest> {
    const pull = await this.request<GiteaPull>(
      'PATCH',
      this.repoPath(`/pulls/${number}`),
      {title, body, state: 'open'}
    );
    return GiteaApi.toPullRequest(pull);
  }

  async *releaseIterator(): AsyncGenerator<GiteaRelease, void, void> {
    yield* this.paginate<GiteaRelease>(this.repoPath('/releases'));
  }

  async getTagCommitSha(tagName: string): Promise<string | undefined> {
    try {
      const tag = await this.request<{commit?: {sha?: string}}>(
        'GET',
        this.repoPath(`/tags/${encodeURIComponent(tagName)}`)
      );
      return tag?.commit?.sha;
    } catch (e) {
      if (e instanceof GitHubAPIError && e.status === 404) {
        return undefined;
      }
      throw e;
    }
  }

  async createRelease(
    release: Release,
    options: ScmReleaseOptions = {}
  ): Promise<ScmRelease> {
    const tagName = release.tag.toString();
    if (options.forceTag) {
      try {
        await this.request('POST', this.repoPath('/tags'), {
          tag_name: tagName,
          target: release.sha,
        });
      } catch (e) {
        if (
          e instanceof GitHubAPIError &&
          (e.status === 409 || e.status === 422)
        ) {
          this.logger.debug(
            `Tag ${tagName} already exists, skipping tag creation`
          );
        } else {
          throw e;
        }
      }
    }
    let created: GiteaRelease;
    try {
      created = await this.request<GiteaRelease>(
        'POST',
        this.repoPath('/releases'),
        {
          tag_name: tagName,
          target_commitish: release.sha,
          name: release.name,
          body: release.notes,
          draft: !!options.draft,
          prerelease: !!options.prerelease,
        }
      );
    } catch (e) {
      if (e instanceof GitHubAPIError && e.status === 409) {
        throw new DuplicateReleaseError(e.cause as RequestError, tagName);
      }
      throw e;
    }
    return {
      id: created.id,
      name: created.name || undefined,
      tagName: created.tag_name,
      sha: release.sha,
      notes: created.body || undefined,
      url: created.html_url,
      draft: created.draft,
      uploadUrl: created.upload_url,
    };
  }

  async commentOnIssue(comment: string, number: number): Promise<string> {
    this.logger.debug(`adding comment to issue/pull ${number}`);
    const resp = await this.request<{html_url: string}>(
      'POST',
      this.repoPath(`/issues/${number}/comments`),
      {body: comment}
    );
    return resp.html_url;
  }

  /**
   * Resolve label names to Gitea label ids. Gitea, unlike GitHub, does not
   * create labels on the fly, so missing labels are created when `create`
   * is set.
   */
  async getLabelIds(names: string[], create: boolean): Promise<number[]> {
    if (names.length === 0) {
      return [];
    }
    const labels = await this.getRepositoryLabels();
    const ids: number[] = [];
    for (const name of names) {
      let id = labels.get(name);
      if (id === undefined && create) {
        this.logger.info(`Creating missing label: ${name}`);
        const label = await this.request<GiteaLabel>(
          'POST',
          this.repoPath('/labels'),
          {name, color: DEFAULT_LABEL_COLOR}
        );
        id = label.id;
        labels.set(name, id);
      }
      if (id !== undefined) {
        ids.push(id);
      }
    }
    return ids;
  }

  private getRepositoryLabels(): Promise<Map<string, number>> {
    if (!this.labelCache) {
      this.labelCache = (async () => {
        const labels = new Map<string, number>();
        for await (const label of this.paginate<GiteaLabel>(
          this.repoPath('/labels')
        )) {
          labels.set(label.name, label.id);
        }
        return labels;
      })();
      // do not cache failures
      this.labelCache.catch(() => (this.labelCache = undefined));
    }
    return this.labelCache;
  }

  async addIssueLabels(labels: string[], number: number): Promise<void> {
    if (labels.length === 0) {
      return;
    }
    this.logger.debug(`adding labels: ${labels} to issue/pull ${number}`);
    const ids = await this.getLabelIds(labels, true);
    await this.request('POST', this.repoPath(`/issues/${number}/labels`), {
      labels: ids,
    });
  }

  async removeIssueLabels(labels: string[], number: number): Promise<void> {
    if (labels.length === 0) {
      return;
    }
    this.logger.debug(`removing labels: ${labels} from issue/pull ${number}`);
    const current = await this.request<GiteaLabel[]>(
      'GET',
      this.repoPath(`/issues/${number}/labels`)
    );
    const toRemove = (current ?? []).filter(label =>
      labels.includes(label.name)
    );
    for (const label of toRemove) {
      await this.request(
        'DELETE',
        this.repoPath(`/issues/${number}/labels/${label.id}`)
      );
    }
  }
}
