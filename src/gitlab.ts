// Copyright 2025 Google LLC
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

import {Gitlab as GitbeakerClient} from '@gitbeaker/rest';
import {GitbeakerRequestError} from '@gitbeaker/requester-utils';
import {logger as defaultLogger} from './util/logger';
import type {Logger} from './util/logger';
import type {Repository} from './repository';
import type {Commit} from './commit';
import type {PullRequest} from './pull-request';
import type {ReleasePullRequest} from './release-pull-request';
import type {Update} from './update';
import type {Release} from './release';
import type {
  CommitIteratorOptions,
  CreatePullRequestOptions,
  ReleaseOptions,
  ReleaseIteratorOptions,
  TagIteratorOptions,
} from './github';
import type {GitHubRelease, GitHubTag} from './provider-interfaces';
import type {GitHubFileContents} from '@google-automations/git-file-utils';
import type {PullRequestOverflowHandler} from './util/pull-request-overflow-handler';
import {mergeUpdates} from './updaters/composite';
import {HostedGitClient} from './provider';

type GitbeakerInstance = InstanceType<typeof GitbeakerClient>;

type GitLabFileContents = {
  sha: string;
  content: string;
  parsedContent: string;
  mode: string;
  update: boolean;
};

type GitLabCommitAction = {
  action: 'create' | 'update';
  filePath: string;
  file_path?: string;
  content: string;
  encoding?: 'text';
  fileMode?: string;
  file_mode?: string;
};
type GitLabMergeRequest = {
  iid: number;
  title: string;
  description?: string | null;
  labels?: Array<string | {name?: string}>;
};
type GitLabMergeRequestSummary = {
  iid: number;
  title: string;
  description?: string | null;
  source_branch: string;
  target_branch: string;
  state: string;
  labels?: Array<string | {name?: string}>;
  merge_commit_sha?: string | null;
  merged_at?: string | null;
};
type GitLabMergeRequestChanges = {
  changes?: Array<{
    new_path?: string | null;
    old_path?: string | null;
  }>;
};

type GitLabNote = {
  id?: number;
  web_url?: string;
  webUrl?: string;
};
type GitLabReleaseSummary = {
  name?: string | null;
  tag_name?: string;
  tagName?: string;
  description?: string | null;
  commit?: {id?: string | null} | null;
  links?: {self?: string | null} | null;
  _links?: {self?: string | null} | null;
  upcoming_release?: boolean;
  upcomingRelease?: boolean;
};
export declare const DEFAULT_FILE_MODE = '100644';

interface FileDiff {
  readonly mode: '100644' | '100755' | '040000' | '160000' | '120000';
  readonly content: string | null;
  readonly originalContent: string | null;
  readonly update: boolean;
}
export type GitLabChangeSet = Map<string, FileDiff>;

export const GL_URL = 'https://gitlab.com';
export const GL_API_URL = 'https://gitlab.com/api/v4';
const MAX_PER_PAGE = 100;
const API_SUFFIX = '/api/v4';

const stripApiSuffix = (url: string): string =>
  url.endsWith(API_SUFFIX) ? url.slice(0, -API_SUFFIX.length) : url;

export interface GitLabCreateOptions {
  owner: string;
  repo: string;
  defaultBranch?: string;
  apiUrl?: string;
  token?: string;
  logger?: Logger;
  host?: string;
  hostUrl?: string;
}

interface GitLabOptions {
  repository: Repository;
  token?: string;
  apiUrl?: string;
  logger?: Logger;
  gitbeaker?: GitbeakerInstance;
  hostUrl?: string;
}

// GitLab may return config files that include a UTF-8 BOM, which breaks JSON.parse.
const stripBom = (value: string): string =>
  value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;

const isNotFoundError = (error: unknown): boolean =>
  error instanceof GitbeakerRequestError &&
  error.cause?.response?.status === 404;

export class GitLab implements HostedGitClient {
  readonly repository: Repository;
  private readonly token?: string;
  private readonly apiUrl: string;
  private readonly logger: Logger;
  private readonly gitbeaker: GitbeakerInstance;
  private readonly hostUrl?: string;

  private constructor(options: GitLabOptions) {
    this.repository = options.repository;
    this.token = options.token;
    this.apiUrl = options.apiUrl || GL_API_URL;
    this.logger = options.logger ?? defaultLogger;
    this.hostUrl = options.hostUrl;
    const host = stripApiSuffix(this.apiUrl);
    this.gitbeaker =
      options.gitbeaker ??
      new GitbeakerClient(this.token ? {host, token: this.token} : {host});
  }

  /**
   * Build a new GitLab client with auto-detected default branch.
   */
  static async create(options: GitLabCreateOptions): Promise<GitLab> {
    const apiUrl = options.host
      ? `${options.host}/api/v4`
      : options.apiUrl ?? GL_API_URL;
    const host = stripApiSuffix(apiUrl);
    const gitbeaker = new GitbeakerClient(
      options.token ? {host, token: options.token} : {host}
    );

    const log = options.logger ?? defaultLogger;
    log.debug('Creating GitLab client');
    log.debug(`Using API URL: ${apiUrl}`);
    log.debug(`Using host: ${host}`);
    log.debug(`Using owner: ${options.owner}`);
    log.debug(`Using repo: ${options.repo}`);

    const repository: Repository = {
      owner: options.owner,
      repo: options.repo,
      defaultBranch:
        options.defaultBranch ??
        (await GitLab.defaultBranch(options.owner, options.repo, gitbeaker)),
    };
    return new GitLab({
      repository,
      token: options.token,
      apiUrl,
      logger: options.logger,
      gitbeaker,
      hostUrl: options.hostUrl,
    });
  }

  /**
   * Returns the default branch for a given repository.
   */
  static async defaultBranch(
    owner: string,
    repo: string,
    gitbeaker: GitbeakerInstance
  ): Promise<string> {
    const projectPath = `${owner}/${repo}`;
    defaultLogger.debug(`Resolving GitLab default branch for ${projectPath}`);
    try {
      const project = (await gitbeaker.Projects.show(projectPath)) as {
        default_branch?: string;
      };
      if (project?.default_branch) {
        defaultLogger.debug(
          `GitLab default branch for ${projectPath} is ${project.default_branch}`
        );
        return project.default_branch;
      }
      defaultLogger.debug(
        `GitLab project ${projectPath} did not specify a default branch; falling back to main`
      );
      return 'main';
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      defaultLogger.warn(
        `Failed to fetch GitLab project ${projectPath}: ${message}`
      );
      throw new Error(`Failed to fetch GitLab project: ${message}`);
    }
  }

  async commitsSince(
    targetBranch: string,
    filter: (commit: Commit) => boolean,
    options: CommitIteratorOptions = {}
  ): Promise<Commit[]> {
    const commits: Commit[] = [];
    const generator = this.mergeCommitIterator(targetBranch, options);
    for await (const commit of generator) {
      if (filter(commit)) {
        break;
      }
      commits.push(commit);
    }
    return commits;
  }

  async *mergeCommitIterator(
    targetBranch: string,
    options: CommitIteratorOptions = {}
  ): AsyncGenerator<Commit, void, void> {
    const maxResults = options.maxResults ?? Number.MAX_SAFE_INTEGER;
    const projectPath = encodeURIComponent(
      `${this.repository.owner}/${this.repository.repo}`
    );
    let page = 1;
    let results = 0;
    while (results < maxResults) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.token) {
        headers['PRIVATE-TOKEN'] = this.token;
      }
      const response = await fetch(
        `${this.apiUrl}/projects/${projectPath}/repository/commits?ref_name=${targetBranch}&per_page=${MAX_PER_PAGE}&page=${page}`,
        {headers}
      );
      if (!response.ok) {
        this.logger.warn(
          `Failed to fetch commits for branch ${targetBranch}: ${response.status}`
        );
        break;
      }
      const gitlabCommits = (await response.json()) as {
        id: string;
        message: string;
      }[];
      if (!gitlabCommits.length) {
        break;
      }
      for (const gitlabCommit of gitlabCommits) {
        if (results >= maxResults) {
          break;
        }
        results += 1;
        const commit: Commit = {
          sha: gitlabCommit.id,
          message: gitlabCommit.message,
          files: [],
        };
        // TODO: Fetch associated merge requests and files when support is added.
        if (options.backfillFiles) {
          this.logger.warn(
            `backfillFiles requested for commit ${gitlabCommit.id}, but GitLab provider does not yet populate file lists.`
          );
        }
        yield commit;
      }
      if (gitlabCommits.length < MAX_PER_PAGE) {
        break;
      }
      page += 1;
    }
  }

  async *pullRequestIterator(
    targetBranch: string,
    status: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    maxResults: number = Number.MAX_SAFE_INTEGER,
    includeFiles = true
  ): AsyncGenerator<PullRequest, void, void> {
    const stateMap: Record<typeof status, 'opened' | 'closed' | 'merged'> = {
      OPEN: 'opened',
      CLOSED: 'closed',
      MERGED: 'merged',
    };
    const projectPath = this.projectPath();
    const perPage = MAX_PER_PAGE;
    let page = 1;
    let results = 0;
    while (results < maxResults) {
      let mergeRequests: GitLabMergeRequestSummary[];
      try {
        mergeRequests = (await this.gitbeaker.MergeRequests.all({
          projectId: projectPath,
          targetBranch,
          state: stateMap[status],
          perPage,
          page,
          orderBy: 'updated_at',
          sort: 'desc',
        })) as GitLabMergeRequestSummary[];
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to fetch merge requests for branch ${targetBranch}: ${message}`
        );
        break;
      }

      if (!mergeRequests.length) {
        break;
      }

      for (const mergeRequest of mergeRequests) {
        if (results >= maxResults) {
          break;
        }

        if (mergeRequest.target_branch !== targetBranch) {
          continue;
        }

        let files: string[] = [];
        if (includeFiles) {
          try {
            const changes = (await this.gitbeaker.MergeRequests.showChanges(
              projectPath,
              mergeRequest.iid
            )) as GitLabMergeRequestChanges;
            if (Array.isArray(changes?.changes)) {
              const fileSet = new Set<string>();
              for (const change of changes.changes) {
                if (change?.new_path) {
                  fileSet.add(change.new_path);
                }
                if (change?.old_path) {
                  fileSet.add(change.old_path);
                }
              }
              files = Array.from(fileSet);
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(
              `Failed to fetch changes for merge request !${mergeRequest.iid}: ${message}`
            );
          }
        }

        results += 1;
        yield {
          headBranchName: mergeRequest.source_branch,
          baseBranchName: mergeRequest.target_branch,
          number: mergeRequest.iid,
          title: mergeRequest.title,
          body: mergeRequest.description ?? '',
          labels: this.extractLabelNames(
            mergeRequest.labels as GitLabMergeRequest['labels']
          ),
          files,
          mergeCommitOid: mergeRequest.merge_commit_sha ?? undefined,
          sha: mergeRequest.merge_commit_sha ?? undefined,
        };
      }

      if (mergeRequests.length < perPage) {
        break;
      }
      page += 1;
    }
  }

  async *releaseIterator(
    options: ReleaseIteratorOptions = {}
  ): AsyncGenerator<GitHubRelease, void, void> {
    const maxResults = options.maxResults ?? Number.MAX_SAFE_INTEGER;
    const projectPath = this.projectPath();
    const perPage = MAX_PER_PAGE;
    let page = 1;
    let results = 0;
    while (results < maxResults) {
      let releases: GitLabReleaseSummary[];
      try {
        releases = (await this.gitbeaker.ProjectReleases.all(projectPath, {
          perPage,
          page,
        })) as GitLabReleaseSummary[];
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to fetch releases: ${message}`);
        break;
      }
      if (!releases.length) {
        break;
      }
      for (const release of releases) {
        if (results >= maxResults) {
          break;
        }
        const rawTagName =
          (release as {tagName?: string}).tagName ??
          (release as {tag_name?: string}).tag_name;
        const tagName =
          typeof rawTagName === 'string' && rawTagName.trim().length > 0
            ? rawTagName.trim()
            : undefined;
        if (!tagName) {
          continue;
        }
        const commitId =
          typeof release.commit?.id === 'string' && release.commit.id.length > 0
            ? release.commit.id
            : undefined;
        if (!commitId) {
          continue;
        }
        results += 1;
        yield {
          id: this.releaseNumericId(tagName),
          name: release.name ?? undefined,
          tagName,
          sha: commitId,
          notes: release.description ?? undefined,
          url: this.releaseWebUrl(tagName),
          draft:
            release.upcomingRelease ?? release.upcoming_release ?? undefined,
        };
      }
      if (releases.length < perPage) {
        break;
      }
      page += 1;
    }
  }

  async *tagIterator(
    options: TagIteratorOptions = {}
  ): AsyncGenerator<GitHubTag, void, void> {
    const maxResults = options.maxResults ?? Number.MAX_SAFE_INTEGER;
    const projectPath = encodeURIComponent(
      `${this.repository.owner}/${this.repository.repo}`
    );
    let page = 1;
    let results = 0;
    while (results < maxResults) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.token) {
        headers['PRIVATE-TOKEN'] = this.token;
      }
      const response = await fetch(
        `${this.apiUrl}/projects/${projectPath}/repository/tags?per_page=${MAX_PER_PAGE}&page=${page}`,
        {headers}
      );
      if (!response.ok) {
        this.logger.warn(`Failed to fetch tags: ${response.status}`);
        break;
      }
      const tags = (await response.json()) as {
        name: string;
        commit: {id: string};
      }[];
      if (!tags.length) {
        break;
      }
      for (const tag of tags) {
        if (results >= maxResults) {
          break;
        }
        results += 1;
        yield {
          name: tag.name,
          sha: tag.commit.id,
        };
      }
      if (tags.length < MAX_PER_PAGE) {
        break;
      }
      page += 1;
    }
  }

  async getFileContents(path: string): Promise<GitLabFileContents> {
    return this.getFileContentsOnBranch(path, this.repository.defaultBranch);
  }

  async getFileContentsOnBranch(
    path: string,
    branch: string
  ): Promise<GitLabFileContents> {
    const projectPath = this.projectPath();
    try {
      const file = (await this.gitbeaker.RepositoryFiles.show(
        projectPath,
        path,
        branch
      )) as {
        blob_id: string;
        content: string;
        encoding?: string;
        file_mode?: string;
      };

      return {
        sha: file.blob_id,
        content: file.content,
        parsedContent: file.content,
        mode: file.file_mode ?? '100644',
        update: true,
      };
    } catch (err) {
      if (isNotFoundError(err)) {
        return undefined as unknown as GitLabFileContents;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to fetch file ${path}: ${message}`);
    }
  }

  async getFileJson<T>(path: string, branch: string): Promise<T> {
    const fileContents = await this.getFileContentsOnBranch(path, branch);
    return JSON.parse(stripBom(fileContents.parsedContent)) as T;
  }

  async findFilesByFilename(
    filename: string,
    prefix?: string
  ): Promise<string[]> {
    return this.findFilesByFilenameAndRef(
      filename,
      this.repository.defaultBranch,
      prefix
    );
  }

  async findFilesByFilenameAndRef(
    filename: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    void filename;
    void ref;
    void prefix;
    this.logger.warn('findFilesByFilenameAndRef not yet fully implemented');
    return [];
  }

  async findFilesByGlob(glob: string, prefix?: string): Promise<string[]> {
    return this.findFilesByGlobAndRef(
      glob,
      this.repository.defaultBranch,
      prefix
    );
  }

  async findFilesByGlobAndRef(
    glob: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    void glob;
    void ref;
    void prefix;
    this.logger.warn('findFilesByGlobAndRef not yet fully implemented');
    return [];
  }

  async findFilesByExtension(
    extension: string,
    prefix?: string
  ): Promise<string[]> {
    return this.findFilesByExtensionAndRef(
      extension,
      this.repository.defaultBranch,
      prefix
    );
  }

  async findFilesByExtensionAndRef(
    extension: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    void extension;
    void ref;
    void prefix;
    this.logger.warn('findFilesByExtensionAndRef not yet fully implemented');
    return [];
  }

  /**
   * Given a set of proposed updates, build a changeset to suggest.
   *
   * @param {Update[]} updates The proposed updates
   * @param {string} defaultBranch The target branch
   * @return {Changes} The changeset to suggest.
   * @throws {GitHubAPIError} on an API error
   */
  async buildChangeSet(
    updates: Update[],
    defaultBranch: string
  ): Promise<GitLabChangeSet> {
    // Sometimes multiple updates are proposed for the same file,
    // such as when the manifest file is additionally changed by the
    // node-workspace plugin. We need to merge these updates.
    const mergedUpdates = mergeUpdates(updates);
    this.logger.debug(
      `Building change set with ${mergedUpdates.length} updates for ${defaultBranch}`
    );
    const changes = new Map();
    for (const update of mergedUpdates) {
      let content: GitHubFileContents | undefined;
      try {
        content = await this.getFileContentsOnBranch(
          update.path,
          defaultBranch
        );
      } catch (err) {
        // if the file is missing and create = false, just continue
        // to the next update, otherwise create the file.
      }

      if (content === undefined && !update.createIfMissing) {
        this.logger.warn(`file ${update.path} did not exist`);
        continue;
      }

      if (content === undefined) {
        this.logger.debug(
          `Planning to create new file ${update.path} on ${defaultBranch}`
        );
      } else {
        this.logger.debug(`Planning to update ${update.path}`);
      }

      const contentText = content
        ? Buffer.from(content.content, 'base64').toString('utf8')
        : undefined;
      const updatedContent = update.updater.updateContent(
        contentText,
        this.logger
      );
      if (updatedContent) {
        changes.set(update.path, {
          content: updatedContent,
          originalContent: content?.parsedContent || null,
          mode: content?.mode || DEFAULT_FILE_MODE,
          update: content !== undefined,
        });
      }
    }
    return changes;
  }

  createPullRequest = wrapAsync(
    async (
      pullRequest: PullRequest,
      targetBranch: string,
      message: string,
      updates: Update[],
      options?: CreatePullRequestOptions
    ): Promise<PullRequest> => {
      if (options?.fork) {
        throw new Error(
          'GitLab provider does not yet support fork-based pull requests'
        );
      }
      const changes = await this.buildChangeSet(updates, targetBranch);
      const changedFiles = Array.from(changes.keys());

      const projectPath = this.projectPath();
      const sourceBranch = pullRequest.headBranchName;
      const mergeRequestTitle = this.normalizeMergeRequestTitle(
        pullRequest.title,
        options?.draft
      );

      this.logger.debug(
        `Creating merge request from ${sourceBranch} to ${targetBranch} with title "${mergeRequestTitle}"`
      );

      try {
        this.logger.info(
          `Creating branch ${sourceBranch} from ${targetBranch}`
        );

        // Commit the changes using gitbreaker Commits API
        const actions = this.buildCommitActions(changes);
        this.logger.debug(
          `Prepared ${actions.length} commit action(s) across ${changedFiles.length} file(s)`
        );
        if (actions.length) {
          await this.gitbeaker.Commits.create(
            projectPath,
            sourceBranch,
            message,
            actions,
            {
              startBranch: targetBranch,
              force: true,
            }
          );
        } else {
          this.logger.info(`No changes to commit on branch ${sourceBranch}`);
          // create branch without changes
          await this.gitbeaker.Branches.create(
            projectPath,
            sourceBranch,
            targetBranch
          );
        }

        this.logger.info(`Created branch ${sourceBranch} from ${targetBranch}`);
      } catch (err) {
        if (this.isBranchAlreadyExistsError(err)) {
          this.logger.info(`Branch ${sourceBranch} already exists; reusing.`);
        } else {
          throw err;
        }
      }

      // Create the merge request
      const mergeRequest = (await this.gitbeaker.MergeRequests.create(
        projectPath,
        sourceBranch,
        targetBranch,
        mergeRequestTitle,
        {
          description: pullRequest.body ?? '',
          removeSourceBranch: true,
          squash: true,
          labels: this.formatLabels(pullRequest.labels),
        }
      )) as GitLabMergeRequest;

      this.logger.debug(
        `Created merge request !${mergeRequest.iid} for ${sourceBranch}`
      );

      return {
        headBranchName: sourceBranch,
        baseBranchName: targetBranch,
        number: mergeRequest.iid,
        title: mergeRequest.title,
        body: mergeRequest.description ?? '',
        files: changedFiles,
        labels: this.extractLabelNames(mergeRequest.labels),
        sha: (mergeRequest as {sha?: string}).sha ?? undefined,
      };
    }
  );

  private buildCommitActions(changes: GitLabChangeSet): GitLabCommitAction[] {
    const actions: GitLabCommitAction[] = [];
    for (const [filePath, change] of changes.entries()) {
      if (change.content === null || change.content === undefined) {
        continue;
      }
      const action: GitLabCommitAction = {
        action: change.update === false ? 'create' : 'update', // Original content can be null for an empty file
        filePath,
        file_path: filePath,
        content: change.content,
        encoding: 'text',
      };
      if (change.mode) {
        action.fileMode = change.mode;
        action.file_mode = change.mode;
      }
      actions.push(action);
    }
    return actions;
  }

  private releaseNumericId(tagName: string): number {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = (hash << 5) - hash + tagName.charCodeAt(i);
      hash |= 0;
    }
    const value = Math.abs(hash);
    return value === 0 ? 1 : value;
  }

  private releaseWebUrl(tagName: string): string {
    const host = stripApiSuffix(this.apiUrl);
    const encodedTag = encodeURIComponent(tagName);
    return `${host}/${this.repository.owner}/${this.repository.repo}/-/releases/${encodedTag}`;
  }

  private resourceWebUrl(
    kind: 'merge_requests' | 'issues',
    iid: number
  ): string {
    const host = stripApiSuffix(this.apiUrl);
    return `${host}/${this.repository.owner}/${this.repository.repo}/-/${kind}/${iid}`;
  }

  private noteWebUrl(
    kind: 'merge_requests' | 'issues',
    iid: number,
    note?: GitLabNote | null
  ): string {
    const baseUrl = this.resourceWebUrl(kind, iid);
    if (!note) {
      return baseUrl;
    }
    const noteUrl = note.web_url ?? note.webUrl;
    if (typeof noteUrl === 'string' && noteUrl.length > 0) {
      return noteUrl;
    }
    if (typeof note?.id === 'number') {
      return `${baseUrl}#note_${note.id}`;
    }
    return baseUrl;
  }

  private projectPath(): string {
    return `${this.repository.owner}/${this.repository.repo}`;
  }

  private isBranchAlreadyExistsError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    if (/branch already exists/i.test(error.message)) {
      return true;
    }
    const response = (
      error as {response?: {status?: number; data?: unknown; body?: unknown}}
    ).response;
    if (!response) {
      return false;
    }
    const status = response.status;
    if (status !== 400 && status !== 409) {
      return false;
    }
    const responseText =
      typeof response.data === 'string'
        ? response.data
        : typeof response.body === 'string'
        ? response.body
        : '';
    return /branch already exists/i.test(responseText);
  }

  private normalizeMergeRequestTitle(title: string, draft?: boolean): string {
    if (!draft) {
      return title;
    }
    return /^(\s*(draft|wip):)/i.test(title) ? title : `Draft: ${title}`;
  }

  private formatLabels(labels?: string[] | null): string | undefined {
    if (!labels || labels.length === 0) {
      return undefined;
    }
    return labels.join(',');
  }

  private extractLabelNames(labels: GitLabMergeRequest['labels']): string[] {
    if (!Array.isArray(labels)) {
      return [];
    }
    const names: string[] = [];
    for (const label of labels) {
      if (typeof label === 'string') {
        names.push(label);
      } else if (
        label &&
        typeof label === 'object' &&
        'name' in label &&
        typeof (label as {name?: unknown}).name === 'string'
      ) {
        names.push((label as {name: string}).name);
      }
    }
    return names;
  }

  async createReleasePullRequest(
    releasePullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: {
      signoffUser?: string;
      fork?: boolean;
      skipLabeling?: boolean;
    }
  ): Promise<PullRequest> {
    void releasePullRequest;
    void targetBranch;
    void options;
    throw new Error('createReleasePullRequest not yet implemented for GitLab');
  }

  async getPullRequest(number: number): Promise<PullRequest> {
    void number;
    throw new Error('getPullRequest not yet implemented for GitLab');
  }

  updatePullRequest = wrapAsync(
    async (
      number: number,
      releasePullRequest: ReleasePullRequest,
      targetBranch: string,
      options?: {
        signoffUser?: string;
        fork?: boolean;
        pullRequestOverflowHandler?: PullRequestOverflowHandler;
      }
    ): Promise<PullRequest> => {
      const changes = await this.buildChangeSet(
        releasePullRequest.updates,
        targetBranch
      );
      this.logger.debug(
        `Updating merge request !${number} with ${changes.size} file change(s)`
      );
      const title = releasePullRequest.title.toString();
      const body = (
        options?.pullRequestOverflowHandler
          ? await options.pullRequestOverflowHandler.handleOverflow(
              releasePullRequest
            )
          : releasePullRequest.body
      )
        .toString()
        .slice(0, 1048576); // GitLab limit is 1 MiB

      this.logger.info(
        `Creating branch ${releasePullRequest.headRefName} from ${targetBranch}`
      );
      const projectPath = this.projectPath();

      // Commit the changes using gitbreaker Commits API
      const actions = this.buildCommitActions(changes);
      this.logger.debug(
        `Prepared ${actions.length} commit action(s) for branch ${releasePullRequest.headRefName}`
      );
      await this.gitbeaker.Commits.create(
        projectPath,
        releasePullRequest.headRefName,
        title,
        actions,
        {
          force: true,
          startBranch: targetBranch,
        }
      );

      // Update the merge request
      const mergeRequest = (await this.gitbeaker.MergeRequests.edit(
        projectPath,
        number,
        {
          title,
          description: body,
          labels: this.formatLabels(releasePullRequest.labels),
        }
      )) as GitLabMergeRequest;

      this.logger.debug(`Updated merge request !${mergeRequest.iid}`);

      return {
        headBranchName: releasePullRequest.headRefName,
        baseBranchName: targetBranch,
        number: mergeRequest.iid,
        title: title,
        body: body || '',
        files: [],
        labels: releasePullRequest.labels,
      };
    }
  );

  createRelease = wrapAsync(
    async (
      release: Release,
      options: ReleaseOptions = {}
    ): Promise<GitHubRelease> => {
      const projectPath = this.projectPath();
      const tagName = release.tag.toString();

      if (options.draft) {
        this.logger.warn(
          'GitLab provider does not support draft releases; ignoring draft flag.'
        );
      }

      if (options.prerelease) {
        this.logger.warn(
          'GitLab provider does not support prerelease releases; ignoring prerelease flag.'
        );
      }

      try {
        this.logger.debug(
          `Creating GitLab release ${tagName} targeting ${release.sha}`
        );
        const gitlabRelease = (await this.gitbeaker.ProjectReleases.create(
          projectPath,
          {
            name: release.name ?? tagName,
            tagName,
            description: release.notes,
            ref: release.sha,
          }
        )) as GitLabReleaseSummary;
        this.logger.debug(
          `Created GitLab release ${tagName} pointing at ${release.sha}`
        );

        const commitSha =
          typeof gitlabRelease.commit?.id === 'string' &&
          gitlabRelease.commit.id.trim().length > 0
            ? gitlabRelease.commit.id
            : release.sha;

        const url =
          gitlabRelease._links?.self ??
          gitlabRelease.links?.self ??
          this.releaseWebUrl(tagName);

        const draft =
          gitlabRelease.upcomingRelease ??
          gitlabRelease.upcoming_release ??
          undefined;

        return {
          id: this.releaseNumericId(tagName),
          name: gitlabRelease.name ?? release.name ?? undefined,
          tagName,
          sha: commitSha,
          notes: gitlabRelease.description ?? release.notes,
          url,
          draft,
        };
      } catch (err) {
        if (err instanceof GitbeakerRequestError) {
          const status = err.cause?.response?.status;
          if (status === 409) {
            this.logger.error(`Release ${tagName} already exists`);
          }
        }
        throw err;
      }
    }
  );

  async generateReleaseNotes(
    tagName: string,
    targetCommitish: string,
    previousTag?: string
  ): Promise<string> {
    void tagName;
    void targetCommitish;
    void previousTag;
    this.logger.warn('generateReleaseNotes not yet fully implemented');
    return '';
  }

  /**
   * Makes a comment on an issue or merge request.
   *
   * @param {string} comment - The body of the comment to post.
   * @param {number} number - The issue or merge request number.
   * @throws {GitHubAPIError} on an API error
   */
  commentOnIssue = wrapAsync(
    async (comment: string, number: number): Promise<string> => {
      const projectPath = this.projectPath();
      this.logger.debug(
        `adding comment to ${this.resourceWebUrl('merge_requests', number)}`
      );
      try {
        const note = (await this.gitbeaker.MergeRequestNotes.create(
          projectPath,
          number,
          comment
        )) as GitLabNote | null;
        return this.noteWebUrl('merge_requests', number, note);
      } catch (err) {
        if (err instanceof GitbeakerRequestError) {
          const status = err.cause?.response?.status;
          if (status === 404) {
            this.logger.debug(
              `merge request !${number} not found; attempting issue #${number}`
            );
            const issueNote = (await this.gitbeaker.IssueNotes.create(
              projectPath,
              number,
              comment
            )) as GitLabNote | null;
            return this.noteWebUrl('issues', number, issueNote);
          }
        }
        throw err;
      }
    }
  );

  /**
   * Removes labels from an issue or merge request.
   *
   * @param {string[]} labels The labels to remove.
   * @param {number} number The issue or merge request number.
   */
  removeIssueLabels = wrapAsync(
    async (labels: string[], number: number): Promise<void> => {
      if (labels.length === 0) {
        return;
      }
      const projectPath = this.projectPath();
      const labelList = this.formatLabels(labels);
      if (!labelList) {
        return;
      }
      this.logger.debug(
        `removing labels: ${labels} from ${this.resourceWebUrl(
          'merge_requests',
          number
        )}`
      );
      try {
        await this.gitbeaker.MergeRequests.edit(projectPath, number, {
          removeLabels: labelList,
        });
      } catch (err) {
        if (err instanceof GitbeakerRequestError) {
          const status = err.cause?.response?.status;
          if (status === 404) {
            this.logger.debug(
              `merge request !${number} not found; attempting issue #${number}`
            );
            await this.gitbeaker.Issues.edit(projectPath, number, {
              removeLabels: labelList,
            });
            return;
          }
        }
        throw err;
      }
    }
  );

  /**
   * Adds labels to an issue or merge request.
   *
   * @param {string[]} labels The labels to add.
   * @param {number} number The issue or merge request number.
   */
  addIssueLabels = wrapAsync(
    async (labels: string[], number: number): Promise<void> => {
      if (labels.length === 0) {
        return;
      }
      const projectPath = this.projectPath();
      const labelList = this.formatLabels(labels);
      if (!labelList) {
        return;
      }
      this.logger.debug(
        `adding labels: ${labels} to ${this.resourceWebUrl(
          'merge_requests',
          number
        )}`
      );
      try {
        await this.gitbeaker.MergeRequests.edit(projectPath, number, {
          addLabels: labelList,
        });
      } catch (err) {
        if (err instanceof GitbeakerRequestError) {
          const status = err.cause?.response?.status;
          if (status === 404) {
            this.logger.debug(
              `merge request !${number} not found; attempting issue #${number}`
            );
            await this.gitbeaker.Issues.edit(projectPath, number, {
              addLabels: labelList,
            });
            return;
          }
        }
        throw err;
      }
    }
  );

  async createFileOnNewBranch(
    filename: string,
    contents: string,
    newBranchName: string,
    baseBranchName: string
  ): Promise<string> {
    void filename;
    void contents;
    void newBranchName;
    void baseBranchName;
    throw new Error('createFileOnNewBranch not yet implemented for GitLab');
  }

  async getProviderDetails(): Promise<{
    hostUrl: string;
    issueFormatUrl: string;
    commitFormatUrl: string;
  }> {
    const hostUrl = this.hostUrl ?? stripApiSuffix(this.apiUrl);
    const repoPath = `${this.repository.owner}/${this.repository.repo}`;

    return {
      hostUrl,
      issueFormatUrl: `${hostUrl}/${repoPath}/-/issues/{{id}}`,
      commitFormatUrl: `${hostUrl}/${repoPath}/-/commit/{{sha}}`,
    };
  }
}

/**
 * Wrap an async method with error handling
 *
 * @param fn Async function that can throw Errors
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const wrapAsync = <T extends Array<any>, V>(fn: (...args: T) => Promise<V>) => {
  return async (...args: T): Promise<V> => {
    return await fn(...args);
  };
};
