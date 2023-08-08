"use strict";
// Copyright 2021 Google LLC
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleepInMs = exports.GitHub = exports.GH_GRAPHQL_URL = exports.GH_API_URL = void 0;
const code_suggester_1 = require("code-suggester");
const rest_1 = require("@octokit/rest");
const request_1 = require("@octokit/request");
const graphql_1 = require("@octokit/graphql");
const request_error_1 = require("@octokit/request-error");
const errors_1 = require("./errors");
const MAX_ISSUE_BODY_SIZE = 65536;
const MAX_SLEEP_SECONDS = 20;
exports.GH_API_URL = 'https://api.github.com';
exports.GH_GRAPHQL_URL = 'https://api.github.com';
const logger_1 = require("./util/logger");
const manifest_1 = require("./manifest");
const signoff_commit_message_1 = require("./util/signoff-commit-message");
const git_file_utils_1 = require("@google-automations/git-file-utils");
const https_proxy_agent_1 = require("https-proxy-agent");
const http_proxy_agent_1 = require("http-proxy-agent");
class GitHub {
    constructor(options) {
        var _a;
        /**
         * Get the list of file paths modified in a given commit.
         *
         * @param {string} sha The commit SHA
         * @returns {string[]} File paths
         * @throws {GitHubAPIError} on an API error
         */
        this.getCommitFiles = wrapAsync(async (sha) => {
            this.logger.debug(`Backfilling file list for commit: ${sha}`);
            const files = [];
            for await (const resp of this.octokit.paginate.iterator(this.octokit.repos.getCommit, {
                owner: this.repository.owner,
                repo: this.repository.repo,
                ref: sha,
            })) {
                for (const f of resp.data.files || []) {
                    if (f.filename) {
                        files.push(f.filename);
                    }
                }
            }
            if (files.length >= 3000) {
                this.logger.warn(`Found ${files.length} files. This may not include all the files.`);
            }
            else {
                this.logger.debug(`Found ${files.length} files`);
            }
            return files;
        });
        this.graphqlRequest = wrapAsync(async (opts, options) => {
            var _a;
            let maxRetries = (_a = options === null || options === void 0 ? void 0 : options.maxRetries) !== null && _a !== void 0 ? _a : 5;
            let seconds = 1;
            while (maxRetries >= 0) {
                try {
                    const response = await this.graphql(opts);
                    if (response) {
                        return response;
                    }
                    this.logger.trace('no GraphQL response, retrying');
                }
                catch (err) {
                    if (err.status !== 502) {
                        throw err;
                    }
                    if (maxRetries === 0) {
                        this.logger.warn('ran out of retries and response is required');
                        throw err;
                    }
                    this.logger.info(`received 502 error, ${maxRetries} attempts remaining`);
                }
                maxRetries -= 1;
                if (maxRetries >= 0) {
                    this.logger.trace(`sleeping ${seconds} seconds`);
                    await (0, exports.sleepInMs)(1000 * seconds);
                    seconds = Math.min(seconds * 2, MAX_SLEEP_SECONDS);
                }
            }
            this.logger.trace('ran out of retries');
            return undefined;
        });
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
        this.findFilesByFilenameAndRef = wrapAsync(async (filename, ref, prefix) => {
            if (prefix) {
                prefix = normalizePrefix(prefix);
            }
            this.logger.debug(`finding files by filename: ${filename}, ref: ${ref}, prefix: ${prefix}`);
            return await this.fileCache.findFilesByFilename(filename, ref, prefix);
        });
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
        this.findFilesByGlobAndRef = wrapAsync(async (glob, ref, prefix) => {
            if (prefix) {
                prefix = normalizePrefix(prefix);
            }
            this.logger.debug(`finding files by glob: ${glob}, ref: ${ref}, prefix: ${prefix}`);
            return await this.fileCache.findFilesByGlob(glob, ref, prefix);
        });
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
        this.createPullRequest = wrapAsync(async (pullRequest, targetBranch, message, updates, options) => {
            //  Update the files for the release if not already supplied
            const changes = await this.buildChangeSet(updates, targetBranch);
            const prNumber = await (0, code_suggester_1.createPullRequest)(this.octokit, changes, {
                upstreamOwner: this.repository.owner,
                upstreamRepo: this.repository.repo,
                title: pullRequest.title,
                branch: pullRequest.headBranchName,
                description: pullRequest.body,
                primary: targetBranch,
                force: true,
                fork: !!(options === null || options === void 0 ? void 0 : options.fork),
                message,
                logger: this.logger,
                draft: !!(options === null || options === void 0 ? void 0 : options.draft),
                labels: pullRequest.labels,
            });
            if (options === null || options === void 0 ? void 0 : options.reviewers) {
                await this.octokit.pulls.requestReviewers({
                    owner: this.repository.owner,
                    repo: this.repository.repo,
                    pull_number: prNumber,
                    reviewers: options.reviewers,
                });
            }
            return await this.getPullRequest(prNumber);
        });
        /**
         * Fetch a pull request given the pull number
         * @param {number} number The pull request number
         * @returns {PullRequest}
         */
        this.getPullRequest = wrapAsync(async (number) => {
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
                    .map(label => label.name)
                    .filter(name => !!name),
            };
        });
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
        this.updatePullRequest = wrapAsync(async (number, releasePullRequest, targetBranch, options) => {
            //  Update the files for the release if not already supplied
            const changes = await this.buildChangeSet(releasePullRequest.updates, targetBranch);
            let message = releasePullRequest.title.toString();
            if (options === null || options === void 0 ? void 0 : options.signoffUser) {
                message = (0, signoff_commit_message_1.signoffCommitMessage)(message, options.signoffUser);
            }
            const title = releasePullRequest.title.toString();
            const body = ((options === null || options === void 0 ? void 0 : options.pullRequestOverflowHandler)
                ? await options.pullRequestOverflowHandler.handleOverflow(releasePullRequest)
                : releasePullRequest.body)
                .toString()
                .slice(0, MAX_ISSUE_BODY_SIZE);
            const prNumber = await (0, code_suggester_1.createPullRequest)(this.octokit, changes, {
                upstreamOwner: this.repository.owner,
                upstreamRepo: this.repository.repo,
                title,
                branch: releasePullRequest.headRefName,
                description: body,
                primary: targetBranch,
                force: true,
                fork: (options === null || options === void 0 ? void 0 : options.fork) === false ? false : true,
                message,
                logger: this.logger,
                draft: releasePullRequest.draft,
            });
            if (prNumber !== number) {
                this.logger.warn(`updated code for ${prNumber}, but update requested for ${number}`);
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
                    .map(label => label.name)
                    .filter(name => !!name),
            };
        });
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
        this.findFilesByExtensionAndRef = wrapAsync(async (extension, ref, prefix) => {
            if (prefix) {
                prefix = normalizePrefix(prefix);
            }
            return this.fileCache.findFilesByExtension(extension, ref, prefix);
        });
        /**
         * Create a GitHub release
         *
         * @param {Release} release Release parameters
         * @param {ReleaseOptions} options Release option parameters
         * @throws {DuplicateReleaseError} if the release tag already exists
         * @throws {GitHubAPIError} on other API errors
         */
        this.createRelease = wrapAsync(async (release, options = {}) => {
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
                notes: resp.data.body_text ||
                    resp.data.body ||
                    resp.data.body_html ||
                    undefined,
                url: resp.data.html_url,
                draft: resp.data.draft,
                uploadUrl: resp.data.upload_url,
            };
        }, e => {
            if (e instanceof request_error_1.RequestError) {
                if (e.status === 422 &&
                    errors_1.GitHubAPIError.parseErrors(e).some(error => {
                        return error.code === 'already_exists';
                    })) {
                    throw new errors_1.DuplicateReleaseError(e, 'tagName');
                }
            }
        });
        /**
         * Makes a comment on a issue/pull request.
         *
         * @param {string} comment - The body of the comment to post.
         * @param {number} number - The issue or pull request number.
         * @throws {GitHubAPIError} on an API error
         */
        this.commentOnIssue = wrapAsync(async (comment, number) => {
            this.logger.debug(`adding comment to https://github.com/${this.repository.owner}/${this.repository.repo}/issues/${number}`);
            const resp = await this.octokit.issues.createComment({
                owner: this.repository.owner,
                repo: this.repository.repo,
                issue_number: number,
                body: comment,
            });
            return resp.data.html_url;
        });
        /**
         * Removes labels from an issue/pull request.
         *
         * @param {string[]} labels The labels to remove.
         * @param {number} number The issue/pull request number.
         */
        this.removeIssueLabels = wrapAsync(async (labels, number) => {
            if (labels.length === 0) {
                return;
            }
            this.logger.debug(`removing labels: ${labels} from issue/pull ${number}`);
            await Promise.all(labels.map(label => this.octokit.issues.removeLabel({
                owner: this.repository.owner,
                repo: this.repository.repo,
                issue_number: number,
                name: label,
            })));
        });
        /**
         * Adds label to an issue/pull request.
         *
         * @param {string[]} labels The labels to add.
         * @param {number} number The issue/pull request number.
         */
        this.addIssueLabels = wrapAsync(async (labels, number) => {
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
        });
        this.repository = options.repository;
        this.octokit = options.octokitAPIs.octokit;
        this.request = options.octokitAPIs.request;
        this.graphql = options.octokitAPIs.graphql;
        this.fileCache = new git_file_utils_1.RepositoryFileCache(this.octokit, this.repository);
        this.logger = (_a = options.logger) !== null && _a !== void 0 ? _a : logger_1.logger;
    }
    static createDefaultAgent(baseUrl, defaultProxy) {
        if (!defaultProxy) {
            return undefined;
        }
        const { host, port } = defaultProxy;
        return new URL(baseUrl).protocol.replace(':', '') === 'http'
            ? new http_proxy_agent_1.HttpProxyAgent({
                host,
                port,
            })
            : new https_proxy_agent_1.HttpsProxyAgent({
                host,
                port,
            });
    }
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
    static async create(options) {
        var _a, _b, _c, _d;
        const apiUrl = (_a = options.apiUrl) !== null && _a !== void 0 ? _a : exports.GH_API_URL;
        const graphqlUrl = (_b = options.graphqlUrl) !== null && _b !== void 0 ? _b : exports.GH_GRAPHQL_URL;
        const releasePleaseVersion = require('../../package.json').version;
        const apis = (_c = options.octokitAPIs) !== null && _c !== void 0 ? _c : {
            octokit: new rest_1.Octokit({
                baseUrl: apiUrl,
                auth: options.token,
                request: {
                    agent: this.createDefaultAgent(apiUrl, options.proxy),
                },
            }),
            request: request_1.request.defaults({
                baseUrl: apiUrl,
                headers: {
                    'user-agent': `release-please/${releasePleaseVersion}`,
                    Authorization: `token ${options.token}`,
                },
            }),
            graphql: graphql_1.graphql.defaults({
                baseUrl: graphqlUrl,
                request: {
                    agent: this.createDefaultAgent(graphqlUrl, options.proxy),
                },
                headers: {
                    'user-agent': `release-please/${releasePleaseVersion}`,
                    Authorization: `token ${options.token}`,
                    'content-type': 'application/vnd.github.v3+json',
                },
            }),
        };
        const opts = {
            repository: {
                owner: options.owner,
                repo: options.repo,
                defaultBranch: (_d = options.defaultBranch) !== null && _d !== void 0 ? _d : (await GitHub.defaultBranch(options.owner, options.repo, apis.octokit)),
            },
            octokitAPIs: apis,
            logger: options.logger,
        };
        return new GitHub(opts);
    }
    /**
     * Returns the default branch for a given repository.
     *
     * @param {string} owner The GitHub repository owner
     * @param {string} repo The GitHub repository name
     * @param {OctokitType} octokit An authenticated octokit instance
     * @returns {string} Name of the default branch
     */
    static async defaultBranch(owner, repo, octokit) {
        const { data } = await octokit.repos.get({
            repo,
            owner,
        });
        return data.default_branch;
    }
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
    async commitsSince(targetBranch, filter, options = {}) {
        const commits = [];
        const generator = this.mergeCommitIterator(targetBranch, options);
        for await (const commit of generator) {
            if (filter(commit)) {
                break;
            }
            commits.push(commit);
        }
        return commits;
    }
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
    async *mergeCommitIterator(targetBranch, options = {}) {
        var _a;
        const maxResults = (_a = options.maxResults) !== null && _a !== void 0 ? _a : Number.MAX_SAFE_INTEGER;
        let cursor = undefined;
        let results = 0;
        while (results < maxResults) {
            const response = await this.mergeCommitsGraphQL(targetBranch, cursor, options);
            // no response usually means that the branch can't be found
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
    async mergeCommitsGraphQL(targetBranch, cursor, options = {}) {
        var _a, _b, _c, _d;
        this.logger.debug(`Fetching merge commits on branch ${targetBranch} with cursor: ${cursor}`);
        const query = `query pullRequestsSince($owner: String!, $repo: String!, $num: Int!, $maxFilesChanged: Int, $targetBranch: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        ref(qualifiedName: $targetBranch) {
          target {
            ... on Commit {
              history(first: $num, after: $cursor) {
                nodes {
                  associatedPullRequests(first: 10) {
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
                  }
                  sha: oid
                  message
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }
      }
    }`;
        const params = {
            cursor,
            owner: this.repository.owner,
            repo: this.repository.repo,
            num: 25,
            targetBranch,
            maxFilesChanged: 100, // max is 100
        };
        const response = await this.graphqlRequest({
            query,
            ...params,
        });
        if (!response) {
            this.logger.warn(`Did not receive a response for query: ${query}`, params);
            return null;
        }
        // if the branch does exist, return null
        if (!((_a = response.repository) === null || _a === void 0 ? void 0 : _a.ref)) {
            this.logger.warn(`Could not find commits for branch ${targetBranch} - it likely does not exist.`);
            return null;
        }
        const history = response.repository.ref.target.history;
        const commits = (history.nodes || []);
        const commitData = [];
        for (const graphCommit of commits) {
            const commit = {
                sha: graphCommit.sha,
                message: graphCommit.message,
            };
            const pullRequest = graphCommit.associatedPullRequests.nodes.find(pr => {
                return pr.mergeCommit && pr.mergeCommit.oid === graphCommit.sha;
            });
            if (pullRequest) {
                const files = (((_b = pullRequest.files) === null || _b === void 0 ? void 0 : _b.nodes) || []).map(node => node.path);
                commit.pullRequest = {
                    sha: commit.sha,
                    number: pullRequest.number,
                    baseBranchName: pullRequest.baseRefName,
                    headBranchName: pullRequest.headRefName,
                    title: pullRequest.title,
                    body: pullRequest.body,
                    labels: pullRequest.labels.nodes.map(node => node.name),
                    files,
                };
                if (((_d = (_c = pullRequest.files) === null || _c === void 0 ? void 0 : _c.pageInfo) === null || _d === void 0 ? void 0 : _d.hasNextPage) && options.backfillFiles) {
                    this.logger.info(`PR #${pullRequest.number} has many files, backfilling`);
                    commit.files = await this.getCommitFiles(graphCommit.sha);
                }
                else {
                    // We cannot directly fetch files on commits via graphql, only provide file
                    // information for commits with associated pull requests
                    commit.files = files;
                }
            }
            else if (options.backfillFiles) {
                // In this case, there is no squashed merge commit. This could be a simple
                // merge commit, a rebase merge commit, or a direct commit to the branch.
                // Fallback to fetching the list of commits from the REST API. In the future
                // we can perhaps lazy load these.
                commit.files = await this.getCommitFiles(graphCommit.sha);
            }
            commitData.push(commit);
        }
        return {
            pageInfo: history.pageInfo,
            data: commitData,
        };
    }
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
    async *pullRequestIterator(targetBranch, status = 'MERGED', maxResults = Number.MAX_SAFE_INTEGER, includeFiles = true) {
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
    async *pullRequestIteratorWithFiles(targetBranch, status = 'MERGED', maxResults = Number.MAX_SAFE_INTEGER) {
        let cursor = undefined;
        let results = 0;
        while (results < maxResults) {
            const response = await this.pullRequestsGraphQL(targetBranch, status, cursor);
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
    async *pullRequestIteratorWithoutFiles(targetBranch, status = 'MERGED', maxResults = Number.MAX_SAFE_INTEGER) {
        const statusMap = {
            OPEN: 'open',
            CLOSED: 'closed',
            MERGED: 'closed',
        };
        let results = 0;
        for await (const { data: pulls } of this.octokit.paginate.iterator(this.octokit.rest.pulls.list, {
            state: statusMap[status],
            owner: this.repository.owner,
            repo: this.repository.repo,
            base: targetBranch,
            sort: 'updated',
            direction: 'desc',
        })) {
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
                        labels: pull.labels.map(label => label.name),
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
    async pullRequestsGraphQL(targetBranch, states = 'MERGED', cursor) {
        var _a;
        this.logger.debug(`Fetching ${states} pull requests on branch ${targetBranch} with cursor ${cursor}`);
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
        if (!((_a = response === null || response === void 0 ? void 0 : response.repository) === null || _a === void 0 ? void 0 : _a.pullRequests)) {
            this.logger.warn(`Could not find merged pull requests for branch ${targetBranch} - it likely does not exist.`);
            return null;
        }
        const pullRequests = (response.repository.pullRequests.nodes ||
            []);
        return {
            pageInfo: response.repository.pullRequests.pageInfo,
            data: pullRequests.map(pullRequest => {
                var _a, _b, _c;
                return {
                    sha: (_a = pullRequest.mergeCommit) === null || _a === void 0 ? void 0 : _a.oid,
                    number: pullRequest.number,
                    baseBranchName: pullRequest.baseRefName,
                    headBranchName: pullRequest.headRefName,
                    labels: (((_b = pullRequest.labels) === null || _b === void 0 ? void 0 : _b.nodes) || []).map(l => l.name),
                    title: pullRequest.title,
                    body: pullRequest.body + '',
                    files: (((_c = pullRequest.files) === null || _c === void 0 ? void 0 : _c.nodes) || []).map(node => node.path),
                };
            }),
        };
    }
    /**
     * Iterate through releases with a max number of results scanned.
     *
     * @param {ReleaseIteratorOptions} options Query options
     * @param {number} options.maxResults Limit the number of results searched.
     *   Defaults to unlimited.
     * @yields {GitHubRelease}
     * @throws {GitHubAPIError} on an API error
     */
    async *releaseIterator(options = {}) {
        var _a;
        const maxResults = (_a = options.maxResults) !== null && _a !== void 0 ? _a : Number.MAX_SAFE_INTEGER;
        let results = 0;
        let cursor = undefined;
        while (true) {
            const response = await this.releaseGraphQL(cursor);
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
    async releaseGraphQL(cursor) {
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
        if (!response.repository.releases.nodes.length) {
            this.logger.warn('Could not find releases.');
            return null;
        }
        const releases = response.repository.releases.nodes;
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
                };
            }),
        };
    }
    /**
     * Iterate through tags with a max number of results scanned.
     *
     * @param {TagIteratorOptions} options Query options
     * @param {number} options.maxResults Limit the number of results searched.
     *   Defaults to unlimited.
     * @yields {GitHubTag}
     * @throws {GitHubAPIError} on an API error
     */
    async *tagIterator(options = {}) {
        const maxResults = options.maxResults || Number.MAX_SAFE_INTEGER;
        let results = 0;
        for await (const response of this.octokit.paginate.iterator(this.octokit.rest.repos.listTags, {
            owner: this.repository.owner,
            repo: this.repository.repo,
        })) {
            for (const tag of response.data) {
                if ((results += 1) > maxResults) {
                    break;
                }
                yield {
                    name: tag.name,
                    sha: tag.commit.sha,
                };
            }
            if (results > maxResults)
                break;
        }
    }
    /**
     * Fetch the contents of a file from the configured branch
     *
     * @param {string} path The path to the file in the repository
     * @returns {GitHubFileContents}
     * @throws {GitHubAPIError} on other API errors
     */
    async getFileContents(path) {
        return await this.getFileContentsOnBranch(path, this.repository.defaultBranch);
    }
    /**
     * Fetch the contents of a file
     *
     * @param {string} path The path to the file in the repository
     * @param {string} branch The branch to fetch from
     * @returns {GitHubFileContents}
     * @throws {FileNotFoundError} if the file cannot be found
     * @throws {GitHubAPIError} on other API errors
     */
    async getFileContentsOnBranch(path, branch) {
        this.logger.debug(`Fetching ${path} from branch ${branch}`);
        try {
            return await this.fileCache.getFileContents(path, branch);
        }
        catch (e) {
            if (e instanceof git_file_utils_1.FileNotFoundError) {
                throw new errors_1.FileNotFoundError(path);
            }
            throw e;
        }
    }
    async getFileJson(path, branch) {
        const content = await this.getFileContentsOnBranch(path, branch);
        return JSON.parse(content.parsedContent);
    }
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
    async findFilesByFilename(filename, prefix) {
        return this.findFilesByFilenameAndRef(filename, this.repository.defaultBranch, prefix);
    }
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
    async findFilesByGlob(glob, prefix) {
        return this.findFilesByGlobAndRef(glob, this.repository.defaultBranch, prefix);
    }
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
    async createReleasePullRequest(releasePullRequest, targetBranch, options) {
        let message = releasePullRequest.title.toString();
        if (options === null || options === void 0 ? void 0 : options.signoffUser) {
            message = (0, signoff_commit_message_1.signoffCommitMessage)(message, options.signoffUser);
        }
        const pullRequestLabels = (options === null || options === void 0 ? void 0 : options.skipLabeling)
            ? []
            : releasePullRequest.labels;
        return await this.createPullRequest({
            headBranchName: releasePullRequest.headRefName,
            baseBranchName: targetBranch,
            number: -1,
            title: releasePullRequest.title.toString(),
            body: releasePullRequest.body.toString().slice(0, MAX_ISSUE_BODY_SIZE),
            labels: pullRequestLabels,
            files: [],
        }, targetBranch, message, releasePullRequest.updates, {
            fork: options === null || options === void 0 ? void 0 : options.fork,
            draft: releasePullRequest.draft,
        });
    }
    /**
     * Given a set of proposed updates, build a changeset to suggest.
     *
     * @param {Update[]} updates The proposed updates
     * @param {string} defaultBranch The target branch
     * @return {Changes} The changeset to suggest.
     * @throws {GitHubAPIError} on an API error
     */
    async buildChangeSet(updates, defaultBranch) {
        const changes = new Map();
        for (const update of updates) {
            let content;
            try {
                content = await this.getFileContentsOnBranch(update.path, defaultBranch);
            }
            catch (err) {
                if (!(err instanceof errors_1.FileNotFoundError))
                    throw err;
                // if the file is missing and create = false, just continue
                // to the next update, otherwise create the file.
                if (!update.createIfMissing) {
                    this.logger.warn(`file ${update.path} did not exist`);
                    continue;
                }
            }
            const contentText = content
                ? Buffer.from(content.content, 'base64').toString('utf8')
                : undefined;
            const updatedContent = update.updater.updateContent(contentText, this.logger);
            if (updatedContent) {
                changes.set(update.path, {
                    content: updatedContent,
                    originalContent: (content === null || content === void 0 ? void 0 : content.parsedContent) || null,
                    mode: (content === null || content === void 0 ? void 0 : content.mode) || git_file_utils_1.DEFAULT_FILE_MODE,
                });
            }
        }
        return changes;
    }
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
    async findFilesByExtension(extension, prefix) {
        return this.findFilesByExtensionAndRef(extension, this.repository.defaultBranch, prefix);
    }
    /**
     * Generate release notes from GitHub at tag
     * @param {string} tagName Name of new release tag
     * @param {string} targetCommitish Target commitish for new tag
     * @param {string} previousTag Optional. Name of previous tag to analyze commits since
     */
    async generateReleaseNotes(tagName, targetCommitish, previousTag) {
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
    async createFileOnNewBranch(filename, contents, newBranchName, baseBranchName) {
        // create or update new branch to match base branch
        await this.forkBranch(newBranchName, baseBranchName);
        // use the single file upload API
        const { data: { content }, } = await this.octokit.repos.createOrUpdateFileContents({
            owner: this.repository.owner,
            repo: this.repository.repo,
            path: filename,
            // contents need to be base64 encoded
            content: Buffer.from(contents, 'binary').toString('base64'),
            message: 'Saving release notes',
            branch: newBranchName,
        });
        if (!(content === null || content === void 0 ? void 0 : content.html_url)) {
            throw new Error(`Failed to write to file: ${filename} on branch: ${newBranchName}`);
        }
        return content.html_url;
    }
    /**
     * Helper to fetch the SHA of a branch
     * @param {string} branchName The name of the branch
     * @return {string | undefined} Returns the SHA of the branch
     *   or undefined if it can't be found.
     */
    async getBranchSha(branchName) {
        this.logger.debug(`Looking up SHA for branch: ${branchName}`);
        try {
            const { data: { object: { sha }, }, } = await this.octokit.git.getRef({
                owner: this.repository.owner,
                repo: this.repository.repo,
                ref: `heads/${branchName}`,
            });
            this.logger.debug(`SHA for branch: ${sha}`);
            return sha;
        }
        catch (e) {
            if (e instanceof request_error_1.RequestError && e.status === 404) {
                this.logger.debug(`Branch: ${branchName} does not exist`);
                return undefined;
            }
            throw e;
        }
    }
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
    async forkBranch(targetBranchName, baseBranchName) {
        const baseBranchSha = await this.getBranchSha(baseBranchName);
        if (!baseBranchSha) {
            // this is highly unlikely to be thrown as we will have
            // already attempted to read from the branch
            throw new errors_1.ConfigurationError(`Unable to find base branch: ${baseBranchName}`, 'core', `${this.repository.owner}/${this.repository.repo}`);
        }
        // see if newBranchName exists
        if (await this.getBranchSha(targetBranchName)) {
            // branch already exists, update it to the match the base branch
            const branchSha = await this.updateBranchSha(targetBranchName, baseBranchSha);
            this.logger.debug(`Updated ${targetBranchName} to match ${baseBranchName} at ${branchSha}`);
            return branchSha;
        }
        else {
            // branch does not exist, create a new branch from the base branch
            const branchSha = await this.createNewBranch(targetBranchName, baseBranchSha);
            this.logger.debug(`Forked ${targetBranchName} from ${baseBranchName} at ${branchSha}`);
            return branchSha;
        }
    }
    /**
     * Helper to create a new branch from a given SHA.
     * @param {string} branchName The new branch name
     * @param {string} branchSha The SHA of the branch
     * @returns {string} The SHA of the new branch
     */
    async createNewBranch(branchName, branchSha) {
        this.logger.debug(`Creating new branch: ${branchName} at ${branchSha}`);
        const { data: { object: { sha }, }, } = await this.octokit.git.createRef({
            owner: this.repository.owner,
            repo: this.repository.repo,
            ref: `refs/heads/${branchName}`,
            sha: branchSha,
        });
        this.logger.debug(`New branch: ${branchName} at ${sha}`);
        return sha;
    }
    async updateBranchSha(branchName, branchSha) {
        this.logger.debug(`Updating branch ${branchName} to ${branchSha}`);
        const { data: { object: { sha }, }, } = await this.octokit.git.updateRef({
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
exports.GitHub = GitHub;
/**
 * Normalize a provided prefix by removing leading and trailing
 * slashes.
 *
 * @param prefix String to normalize
 */
function normalizePrefix(prefix) {
    const normalized = prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '');
    if (normalized === manifest_1.ROOT_PROJECT_PATH) {
        return '';
    }
    return normalized;
}
/**
 * Wrap an async method with error handling
 *
 * @param fn Async function that can throw Errors
 * @param errorHandler An optional error handler for rethrowing custom exceptions
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const wrapAsync = (fn, errorHandler) => {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (e) {
            if (errorHandler) {
                errorHandler(e);
            }
            if (e instanceof request_error_1.RequestError) {
                throw new errors_1.GitHubAPIError(e);
            }
            throw e;
        }
    };
};
const sleepInMs = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.sleepInMs = sleepInMs;
//# sourceMappingURL=github.js.map