import { PullRequest } from './pull-request';
import { Commit } from './commit';
import { Octokit } from '@octokit/rest';
import { request } from '@octokit/request';
export declare const GH_API_URL = "https://api.github.com";
export declare const GH_GRAPHQL_URL = "https://api.github.com";
type OctokitType = InstanceType<typeof Octokit>;
import { Repository } from './repository';
import { ReleasePullRequest } from './release-pull-request';
import { Update } from './update';
import { Release } from './release';
import { GitHubFileContents } from '@google-automations/git-file-utils';
import { Logger } from 'code-suggester/build/src/types';
import { PullRequestOverflowHandler } from './util/pull-request-overflow-handler';
type RequestBuilderType = typeof request;
type DefaultFunctionType = RequestBuilderType['defaults'];
type RequestFunctionType = ReturnType<DefaultFunctionType>;
export interface OctokitAPIs {
    graphql: Function;
    request: RequestFunctionType;
    octokit: OctokitType;
}
export interface GitHubOptions {
    repository: Repository;
    octokitAPIs: OctokitAPIs;
    logger?: Logger;
}
interface ProxyOption {
    host: string;
    port: number;
}
interface GitHubCreateOptions {
    owner: string;
    repo: string;
    defaultBranch?: string;
    apiUrl?: string;
    graphqlUrl?: string;
    octokitAPIs?: OctokitAPIs;
    token?: string;
    logger?: Logger;
    proxy?: ProxyOption;
}
type CommitFilter = (commit: Commit) => boolean;
interface CommitIteratorOptions {
    maxResults?: number;
    backfillFiles?: boolean;
}
interface ReleaseIteratorOptions {
    maxResults?: number;
}
interface TagIteratorOptions {
    maxResults?: number;
}
export interface ReleaseOptions {
    draft?: boolean;
    prerelease?: boolean;
}
export interface GitHubRelease {
    id: number;
    name?: string;
    tagName: string;
    sha: string;
    notes?: string;
    url: string;
    draft?: boolean;
    uploadUrl?: string;
}
export interface GitHubTag {
    name: string;
    sha: string;
}
interface FileDiff {
    readonly mode: '100644' | '100755' | '040000' | '160000' | '120000';
    readonly content: string | null;
    readonly originalContent: string | null;
}
export type ChangeSet = Map<string, FileDiff>;
interface CreatePullRequestOptions {
    fork?: boolean;
    draft?: boolean;
    reviewers?: [string];
}
export declare class GitHub {
    readonly repository: Repository;
    private octokit;
    private request;
    private graphql;
    private fileCache;
    private logger;
    private constructor();
    static createDefaultAgent(baseUrl: string, defaultProxy?: ProxyOption): import("https-proxy-agent/dist/agent").default | import("http-proxy-agent/dist/agent").default | undefined;
    /**
     * Build a new GitHub client with auto-detected default branch.
     *
     * @param {GitHubCreateOptions} options Configuration options
     * @param {string} options.owner The repository owner.
     * @param {string} options.repo The repository name.
     * @param {string} options.defaultBranch Optional. The repository's default branch.
     *   Defaults to the value fetched via the API.
     * @param {string} options.apiUrl Optional. The base url of the GitHub API.
     * @param {string} options.graphqlUrl Optional. The base url of the GraphQL API.
     * @param {OctokitAPISs} options.octokitAPIs Optional. Override the internal
     *   client instances with a pre-authenticated instance.
     * @param {string} token Optional. A GitHub API token used for authentication.
     */
    static create(options: GitHubCreateOptions): Promise<GitHub>;
    /**
     * Returns the default branch for a given repository.
     *
     * @param {string} owner The GitHub repository owner
     * @param {string} repo The GitHub repository name
     * @param {OctokitType} octokit An authenticated octokit instance
     * @returns {string} Name of the default branch
     */
    static defaultBranch(owner: string, repo: string, octokit: OctokitType): Promise<string>;
    /**
     * Returns the list of commits to the default branch after the provided filter
     * query has been satified.
     *
     * @param {string} targetBranch Target branch of commit
     * @param {CommitFilter} filter Callback function that returns whether a
     *   commit/pull request matches certain criteria
     * @param {CommitIteratorOptions} options Query options
     * @param {number} options.maxResults Limit the number of results searched.
     *   Defaults to unlimited.
     * @param {boolean} options.backfillFiles If set, use the REST API for
     *   fetching the list of touched files in this commit. Defaults to `false`.
     * @returns {Commit[]} List of commits to current branch
     * @throws {GitHubAPIError} on an API error
     */
    commitsSince(targetBranch: string, filter: CommitFilter, options?: CommitIteratorOptions): Promise<Commit[]>;
    /**
     * Iterate through commit history with a max number of results scanned.
     *
     * @param {string} targetBranch target branch of commit
     * @param {CommitIteratorOptions} options Query options
     * @param {number} options.maxResults Limit the number of results searched.
     *   Defaults to unlimited.
     * @param {boolean} options.backfillFiles If set, use the REST API for
     *   fetching the list of touched files in this commit. Defaults to `false`.
     * @yields {Commit}
     * @throws {GitHubAPIError} on an API error
     */
    mergeCommitIterator(targetBranch: string, options?: CommitIteratorOptions): AsyncGenerator<Commit, void, unknown>;
    private mergeCommitsGraphQL;
    /**
     * Get the list of file paths modified in a given commit.
     *
     * @param {string} sha The commit SHA
     * @returns {string[]} File paths
     * @throws {GitHubAPIError} on an API error
     */
    getCommitFiles: (sha: string) => Promise<string[]>;
    private graphqlRequest;
    /**
     * Iterate through merged pull requests with a max number of results scanned.
     *
     * @param {string} targetBranch The base branch of the pull request
     * @param {string} status The status of the pull request
     * @param {number} maxResults Limit the number of results searched. Defaults to
     *   unlimited.
     * @param {boolean} includeFiles Whether to fetch the list of files included in
     *   the pull request. Defaults to `true`.
     * @yields {PullRequest}
     * @throws {GitHubAPIError} on an API error
     */
    pullRequestIterator(targetBranch: string, status?: 'OPEN' | 'CLOSED' | 'MERGED', maxResults?: number, includeFiles?: boolean): AsyncGenerator<PullRequest, void, void>;
    /**
     * Helper implementation of pullRequestIterator that includes files via
     * the graphQL API.
     *
     * @param {string} targetBranch The base branch of the pull request
     * @param {string} status The status of the pull request
     * @param {number} maxResults Limit the number of results searched
     */
    private pullRequestIteratorWithFiles;
    /**
     * Helper implementation of pullRequestIterator that excludes files
     * via the REST API.
     *
     * @param {string} targetBranch The base branch of the pull request
     * @param {string} status The status of the pull request
     * @param {number} maxResults Limit the number of results searched
     */
    private pullRequestIteratorWithoutFiles;
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
    private pullRequestsGraphQL;
    /**
     * Iterate through releases with a max number of results scanned.
     *
     * @param {ReleaseIteratorOptions} options Query options
     * @param {number} options.maxResults Limit the number of results searched.
     *   Defaults to unlimited.
     * @yields {GitHubRelease}
     * @throws {GitHubAPIError} on an API error
     */
    releaseIterator(options?: ReleaseIteratorOptions): AsyncGenerator<GitHubRelease, void, unknown>;
    private releaseGraphQL;
    /**
     * Iterate through tags with a max number of results scanned.
     *
     * @param {TagIteratorOptions} options Query options
     * @param {number} options.maxResults Limit the number of results searched.
     *   Defaults to unlimited.
     * @yields {GitHubTag}
     * @throws {GitHubAPIError} on an API error
     */
    tagIterator(options?: TagIteratorOptions): AsyncGenerator<{
        name: string;
        sha: string;
    }, void, unknown>;
    /**
     * Fetch the contents of a file from the configured branch
     *
     * @param {string} path The path to the file in the repository
     * @returns {GitHubFileContents}
     * @throws {GitHubAPIError} on other API errors
     */
    getFileContents(path: string): Promise<GitHubFileContents>;
    /**
     * Fetch the contents of a file
     *
     * @param {string} path The path to the file in the repository
     * @param {string} branch The branch to fetch from
     * @returns {GitHubFileContents}
     * @throws {FileNotFoundError} if the file cannot be found
     * @throws {GitHubAPIError} on other API errors
     */
    getFileContentsOnBranch(path: string, branch: string): Promise<GitHubFileContents>;
    getFileJson<T>(path: string, branch: string): Promise<T>;
    /**
     * Returns a list of paths to all files with a given name.
     *
     * If a prefix is specified, only return paths that match
     * the provided prefix.
     *
     * @param filename The name of the file to find
     * @param prefix Optional path prefix used to filter results
     * @returns {string[]} List of file paths
     * @throws {GitHubAPIError} on an API error
     */
    findFilesByFilename(filename: string, prefix?: string): Promise<string[]>;
    /**
     * Returns a list of paths to all files with a given name.
     *
     * If a prefix is specified, only return paths that match
     * the provided prefix.
     *
     * @param filename The name of the file to find
     * @param ref Git reference to search files in
     * @param prefix Optional path prefix used to filter results
     * @throws {GitHubAPIError} on an API error
     */
    findFilesByFilenameAndRef: (filename: string, ref: string, prefix?: string | undefined) => Promise<string[]>;
    /**
     * Returns a list of paths to all files matching a glob pattern.
     *
     * If a prefix is specified, only return paths that match
     * the provided prefix.
     *
     * @param glob The glob to match
     * @param prefix Optional path prefix used to filter results
     * @returns {string[]} List of file paths
     * @throws {GitHubAPIError} on an API error
     */
    findFilesByGlob(glob: string, prefix?: string): Promise<string[]>;
    /**
     * Returns a list of paths to all files matching a glob pattern.
     *
     * If a prefix is specified, only return paths that match
     * the provided prefix.
     *
     * @param glob The glob to match
     * @param ref Git reference to search files in
     * @param prefix Optional path prefix used to filter results
     * @throws {GitHubAPIError} on an API error
     */
    findFilesByGlobAndRef: (glob: string, ref: string, prefix?: string | undefined) => Promise<string[]>;
    /**
     * Open a pull request
     *
     * @deprecated This logic is handled by the Manifest class now as it
     *   can be more complicated if the release notes are too big
     * @param {ReleasePullRequest} releasePullRequest Pull request data to update
     * @param {string} targetBranch The base branch of the pull request
     * @param {GitHubPR} options The pull request options
     * @throws {GitHubAPIError} on an API error
     */
    createReleasePullRequest(releasePullRequest: ReleasePullRequest, targetBranch: string, options?: {
        signoffUser?: string;
        fork?: boolean;
        skipLabeling?: boolean;
    }): Promise<PullRequest>;
    /**
     * Open a pull request
     *
     * @param {PullRequest} pullRequest Pull request data to update
     * @param {string} targetBranch The base branch of the pull request
     * @param {string} message The commit message for the commit
     * @param {Update[]} updates The files to update
     * @param {CreatePullRequestOptions} options The pull request options
     * @throws {GitHubAPIError} on an API error
     */
    createPullRequest: (pullRequest: PullRequest, targetBranch: string, message: string, updates: Update[], options?: CreatePullRequestOptions | undefined) => Promise<PullRequest>;
    /**
     * Fetch a pull request given the pull number
     * @param {number} number The pull request number
     * @returns {PullRequest}
     */
    getPullRequest: (number: number) => Promise<PullRequest>;
    /**
     * Update a pull request's title and body.
     * @param {number} number The pull request number
     * @param {ReleasePullRequest} releasePullRequest Pull request data to update
     * @param {string} targetBranch The target branch of the pull request
     * @param {string} options.signoffUser Optional. Commit signoff message
     * @param {boolean} options.fork Optional. Whether to open the pull request from
     *   a fork or not. Defaults to `false`
     * @param {PullRequestOverflowHandler} options.pullRequestOverflowHandler Optional.
     *   Handles extra large pull request body messages.
     */
    updatePullRequest: (number: number, releasePullRequest: ReleasePullRequest, targetBranch: string, options?: {
        signoffUser?: string | undefined;
        fork?: boolean | undefined;
        pullRequestOverflowHandler?: PullRequestOverflowHandler | undefined;
    } | undefined) => Promise<PullRequest>;
    /**
     * Given a set of proposed updates, build a changeset to suggest.
     *
     * @param {Update[]} updates The proposed updates
     * @param {string} defaultBranch The target branch
     * @return {Changes} The changeset to suggest.
     * @throws {GitHubAPIError} on an API error
     */
    buildChangeSet(updates: Update[], defaultBranch: string): Promise<ChangeSet>;
    /**
     * Returns a list of paths to all files with a given file
     * extension.
     *
     * If a prefix is specified, only return paths that match
     * the provided prefix.
     *
     * @param extension The file extension used to filter results.
     *   Example: `js`, `java`
     * @param ref Git reference to search files in
     * @param prefix Optional path prefix used to filter results
     * @returns {string[]} List of file paths
     * @throws {GitHubAPIError} on an API error
     */
    findFilesByExtensionAndRef: (extension: string, ref: string, prefix?: string | undefined) => Promise<string[]>;
    /**
     * Returns a list of paths to all files with a given file
     * extension.
     *
     * If a prefix is specified, only return paths that match
     * the provided prefix.
     *
     * @param extension The file extension used to filter results.
     *   Example: `js`, `java`
     * @param prefix Optional path prefix used to filter results
     * @returns {string[]} List of file paths
     * @throws {GitHubAPIError} on an API error
     */
    findFilesByExtension(extension: string, prefix?: string): Promise<string[]>;
    /**
     * Create a GitHub release
     *
     * @param {Release} release Release parameters
     * @param {ReleaseOptions} options Release option parameters
     * @throws {DuplicateReleaseError} if the release tag already exists
     * @throws {GitHubAPIError} on other API errors
     */
    createRelease: (release: Release, options?: ReleaseOptions | undefined) => Promise<GitHubRelease>;
    /**
     * Makes a comment on a issue/pull request.
     *
     * @param {string} comment - The body of the comment to post.
     * @param {number} number - The issue or pull request number.
     * @throws {GitHubAPIError} on an API error
     */
    commentOnIssue: (comment: string, number: number) => Promise<string>;
    /**
     * Removes labels from an issue/pull request.
     *
     * @param {string[]} labels The labels to remove.
     * @param {number} number The issue/pull request number.
     */
    removeIssueLabels: (labels: string[], number: number) => Promise<void>;
    /**
     * Adds label to an issue/pull request.
     *
     * @param {string[]} labels The labels to add.
     * @param {number} number The issue/pull request number.
     */
    addIssueLabels: (labels: string[], number: number) => Promise<void>;
    /**
     * Generate release notes from GitHub at tag
     * @param {string} tagName Name of new release tag
     * @param {string} targetCommitish Target commitish for new tag
     * @param {string} previousTag Optional. Name of previous tag to analyze commits since
     */
    generateReleaseNotes(tagName: string, targetCommitish: string, previousTag?: string): Promise<string>;
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
    createFileOnNewBranch(filename: string, contents: string, newBranchName: string, baseBranchName: string): Promise<string>;
    /**
     * Helper to fetch the SHA of a branch
     * @param {string} branchName The name of the branch
     * @return {string | undefined} Returns the SHA of the branch
     *   or undefined if it can't be found.
     */
    private getBranchSha;
    /**
     * Helper to fork a branch from an existing branch. Uses `force` so
     * it will overwrite the contents of `targetBranchName` to match
     * the current contents of `baseBranchName`.
     *
     * @param {string} targetBranchName The name of the new forked branch
     * @param {string} baseBranchName The base branch from which to fork.
     * @returns {string} The branch SHA
     * @throws {ConfigurationError} if the base branch cannot be found.
     */
    private forkBranch;
    /**
     * Helper to create a new branch from a given SHA.
     * @param {string} branchName The new branch name
     * @param {string} branchSha The SHA of the branch
     * @returns {string} The SHA of the new branch
     */
    private createNewBranch;
    private updateBranchSha;
}
export declare const sleepInMs: (ms: number) => Promise<unknown>;
export {};
