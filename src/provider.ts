// Minimal provider factory to allow using different VCS/hosting providers in future.
// For now it only supports GitHub and returns the existing GitHub client so
// existing code can continue to operate unchanged.
import {
  ChangeSet,
  CommitFilter,
  CommitIteratorOptions,
  CreatePullRequestOptions,
  GitHub,
  ReleaseIteratorOptions,
  ReleaseOptions,
  TagIteratorOptions,
} from './github';
import {GitHubRelease, GitHubTag} from './provider-interfaces';
import {GitLab} from './gitlab';
import {PullRequest} from './pull-request';
import {ReleasePullRequest} from './release-pull-request';
import {Update} from './update';
import {Repository} from './repository';
import {Release} from './release';
import {GitHubFileContents} from '@google-automations/git-file-utils';
import {PullRequestOverflowHandler} from './util/pull-request-overflow-handler';
import {Commit} from './commit';

export interface HostedGitClient {
  readonly repository: Repository;
  commitsSince(
    targetBranch: string,
    filter: CommitFilter,
    options?: CommitIteratorOptions
  ): Promise<Commit[]>;
  mergeCommitIterator(
    targetBranch: string,
    options?: CommitIteratorOptions
  ): AsyncGenerator<Commit, void, void>;
  pullRequestIterator(
    targetBranch: string,
    status?: 'OPEN' | 'CLOSED' | 'MERGED',
    maxResults?: number,
    includeFiles?: boolean
  ): AsyncGenerator<PullRequest, void, void>;
  releaseIterator(
    options?: ReleaseIteratorOptions
  ): AsyncGenerator<GitHubRelease, void, void>;
  tagIterator(
    options?: TagIteratorOptions
  ): AsyncGenerator<GitHubTag, void, void>;
  getFileContents(path: string): Promise<GitHubFileContents>;
  getFileContentsOnBranch(
    path: string,
    branch: string
  ): Promise<GitHubFileContents>;
  getFileJson<T>(path: string, branch: string): Promise<T>;
  findFilesByFilename(filename: string, prefix?: string): Promise<string[]>;
  findFilesByFilenameAndRef(
    filename: string,
    ref: string,
    prefix?: string
  ): Promise<string[]>;
  findFilesByGlob(glob: string, prefix?: string): Promise<string[]>;
  findFilesByGlobAndRef(
    glob: string,
    ref: string,
    prefix?: string
  ): Promise<string[]>;
  findFilesByExtension(extension: string, prefix?: string): Promise<string[]>;
  findFilesByExtensionAndRef(
    extension: string,
    ref: string,
    prefix?: string
  ): Promise<string[]>;
  buildChangeSet(updates: Update[], defaultBranch: string): Promise<ChangeSet>;
  createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    message: string,
    updates: Update[],
    options?: CreatePullRequestOptions
  ): Promise<PullRequest>;
  createReleasePullRequest(
    releasePullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: {
      signoffUser?: string;
      fork?: boolean;
      skipLabeling?: boolean;
    }
  ): Promise<PullRequest>;
  getPullRequest(number: number): Promise<PullRequest>;
  updatePullRequest(
    number: number,
    releasePullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: {
      signoffUser?: string;
      fork?: boolean;
      pullRequestOverflowHandler?: PullRequestOverflowHandler;
    }
  ): Promise<PullRequest>;
  createRelease(
    release: Release,
    options?: ReleaseOptions
  ): Promise<GitHubRelease>;
  generateReleaseNotes(
    tagName: string,
    targetCommitish: string,
    previousTag?: string
  ): Promise<string>;
  commentOnIssue(comment: string, number: number): Promise<string>;
  removeIssueLabels(labels: string[], number: number): Promise<void>;
  addIssueLabels(labels: string[], number: number): Promise<void>;
  createFileOnNewBranch(
    filename: string,
    contents: string,
    newBranchName: string,
    baseBranchName: string
  ): Promise<string>;
  getProviderDetails(): Promise<{
    hostUrl: string;
    issueFormatUrl: string;
    commitFormatUrl: string;
  }>;
}

export interface ProviderOptions {
  owner: string;
  repo: string;
  token?: string;
  apiUrl?: string;
  graphqlUrl?: string;
  host?: string;
  hostUrl?: string;
}

export class ProviderFactory {
  /**
   * Create a provider client.
   * @param provider name of provider (currently only 'github')
   * @param opts provider specific options
   */
  static async create(
    provider: string,
    opts: ProviderOptions
  ): Promise<HostedGitClient> {
    switch ((provider || '').toLowerCase()) {
      case 'github':
        return GitHub.create({
          owner: opts.owner,
          repo: opts.repo,
          token: opts.token,
          apiUrl: opts.apiUrl,
          graphqlUrl: opts.graphqlUrl,
          hostUrl: opts.hostUrl,
        });
      case 'gitlab':
        return GitLab.create({
          owner: opts.owner,
          repo: opts.repo,
          token: opts.token,
          apiUrl: opts.apiUrl,
          host: opts.host,
          hostUrl: opts.hostUrl,
        });
      default:
        throw new Error(`unsupported provider: ${provider}`);
    }
  }
}

export default ProviderFactory;
