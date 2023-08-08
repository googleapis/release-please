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
exports.Manifest = exports.MANIFEST_PULL_REQUEST_TITLE_PATTERN = exports.SNOOZE_LABEL = exports.DEFAULT_SNAPSHOT_LABELS = exports.DEFAULT_RELEASE_LABELS = exports.DEFAULT_LABELS = exports.DEFAULT_COMPONENT_NAME = exports.ROOT_PROJECT_PATH = exports.DEFAULT_RELEASE_PLEASE_MANIFEST = exports.DEFAULT_RELEASE_PLEASE_CONFIG = void 0;
const version_1 = require("./version");
const commit_1 = require("./commit");
const logger_1 = require("./util/logger");
const commit_split_1 = require("./util/commit-split");
const tag_name_1 = require("./util/tag-name");
const branch_name_1 = require("./util/branch-name");
const pull_request_title_1 = require("./util/pull-request-title");
const factory_1 = require("./factory");
const merge_1 = require("./plugins/merge");
const release_please_manifest_1 = require("./updaters/release-please-manifest");
const errors_1 = require("./errors");
const pull_request_overflow_handler_1 = require("./util/pull-request-overflow-handler");
const signoff_commit_message_1 = require("./util/signoff-commit-message");
const commit_exclude_1 = require("./util/commit-exclude");
exports.DEFAULT_RELEASE_PLEASE_CONFIG = 'release-please-config.json';
exports.DEFAULT_RELEASE_PLEASE_MANIFEST = '.release-please-manifest.json';
exports.ROOT_PROJECT_PATH = '.';
exports.DEFAULT_COMPONENT_NAME = '';
exports.DEFAULT_LABELS = ['autorelease: pending'];
exports.DEFAULT_RELEASE_LABELS = ['autorelease: tagged'];
exports.DEFAULT_SNAPSHOT_LABELS = ['autorelease: snapshot'];
exports.SNOOZE_LABEL = 'autorelease: snooze';
const DEFAULT_RELEASE_SEARCH_DEPTH = 400;
const DEFAULT_COMMIT_SEARCH_DEPTH = 500;
exports.MANIFEST_PULL_REQUEST_TITLE_PATTERN = 'chore: release ${branch}';
class Manifest {
    /**
     * Create a Manifest from explicit config in code. This assumes that the
     * repository has a single component at the root path.
     *
     * @param {GitHub} github GitHub client
     * @param {string} targetBranch The releaseable base branch
     * @param {RepositoryConfig} repositoryConfig Parsed configuration of path => release configuration
     * @param {ReleasedVersions} releasedVersions Parsed versions of path => latest release version
     * @param {ManifestOptions} manifestOptions Optional. Manifest options
     * @param {string} manifestOptions.bootstrapSha If provided, use this SHA
     *   as the point to consider commits after
     * @param {boolean} manifestOptions.alwaysLinkLocal Option for the node-workspace
     *   plugin
     * @param {boolean} manifestOptions.separatePullRequests If true, create separate pull
     *   requests instead of a single manifest release pull request
     * @param {PluginType[]} manifestOptions.plugins Any plugins to use for this repository
     * @param {boolean} manifestOptions.fork If true, create pull requests from a fork. Defaults
     *   to `false`
     * @param {string} manifestOptions.signoff Add a Signed-off-by annotation to the commit
     * @param {string} manifestOptions.manifestPath Path to the versions manifest
     * @param {string[]} manifestOptions.labels Labels that denote a pending, untagged release
     *   pull request. Defaults to `[autorelease: pending]`
     * @param {string[]} manifestOptions.releaseLabels Labels to apply to a tagged release
     *   pull request. Defaults to `[autorelease: tagged]`
     */
    constructor(github, targetBranch, repositoryConfig, releasedVersions, manifestOptions) {
        var _a, _b;
        this.repository = github.repository;
        this.github = github;
        this.targetBranch = targetBranch;
        this.repositoryConfig = repositoryConfig;
        this.releasedVersions = releasedVersions;
        this.manifestPath =
            (manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.manifestPath) || exports.DEFAULT_RELEASE_PLEASE_MANIFEST;
        this.separatePullRequests =
            (_a = manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.separatePullRequests) !== null && _a !== void 0 ? _a : Object.keys(repositoryConfig).length === 1;
        this.fork = (manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.fork) || false;
        this.signoffUser = manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.signoff;
        this.releaseLabels =
            (manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.releaseLabels) || exports.DEFAULT_RELEASE_LABELS;
        this.labels = (manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.labels) || exports.DEFAULT_LABELS;
        this.skipLabeling = (manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.skipLabeling) || false;
        this.sequentialCalls = (manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.sequentialCalls) || false;
        this.snapshotLabels =
            (manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.snapshotLabels) || exports.DEFAULT_SNAPSHOT_LABELS;
        this.bootstrapSha = manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.bootstrapSha;
        this.lastReleaseSha = manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.lastReleaseSha;
        this.draft = manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.draft;
        this.draftPullRequest = manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.draftPullRequest;
        this.groupPullRequestTitlePattern =
            manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.groupPullRequestTitlePattern;
        this.releaseSearchDepth =
            (manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.releaseSearchDepth) || DEFAULT_RELEASE_SEARCH_DEPTH;
        this.commitSearchDepth =
            (manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.commitSearchDepth) || DEFAULT_COMMIT_SEARCH_DEPTH;
        this.logger = (_b = manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.logger) !== null && _b !== void 0 ? _b : logger_1.logger;
        this.plugins = ((manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.plugins) || []).map(pluginType => (0, factory_1.buildPlugin)({
            type: pluginType,
            github: this.github,
            targetBranch: this.targetBranch,
            repositoryConfig: this.repositoryConfig,
            manifestPath: this.manifestPath,
        }));
        this.pullRequestOverflowHandler = new pull_request_overflow_handler_1.FilePullRequestOverflowHandler(this.github, this.logger);
        this.reviewers = manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.reviewers;
    }
    /**
     * Create a Manifest from config files in the repository.
     *
     * @param {GitHub} github GitHub client
     * @param {string} targetBranch The releaseable base branch
     * @param {string} configFile Optional. The path to the manifest config file
     * @param {string} manifestFile Optional. The path to the manifest versions file
     * @param {string} path The single path to check. Optional
     * @returns {Manifest}
     */
    static async fromManifest(github, targetBranch, configFile = exports.DEFAULT_RELEASE_PLEASE_CONFIG, manifestFile = exports.DEFAULT_RELEASE_PLEASE_MANIFEST, manifestOptionOverrides = {}, path, releaseAs) {
        const [{ config: repositoryConfig, options: manifestOptions }, releasedVersions,] = await Promise.all([
            parseConfig(github, configFile, targetBranch, path, releaseAs),
            parseReleasedVersions(github, manifestFile, targetBranch),
        ]);
        return new Manifest(github, targetBranch, repositoryConfig, releasedVersions, {
            manifestPath: manifestFile,
            ...manifestOptions,
            ...manifestOptionOverrides,
        });
    }
    /**
     * Create a Manifest from explicit config in code. This assumes that the
     * repository has a single component at the root path.
     *
     * @param {GitHub} github GitHub client
     * @param {string} targetBranch The releaseable base branch
     * @param {ReleaserConfig} config Release strategy options
     * @param {ManifestOptions} manifestOptions Optional. Manifest options
     * @param {string} manifestOptions.bootstrapSha If provided, use this SHA
     *   as the point to consider commits after
     * @param {boolean} manifestOptions.alwaysLinkLocal Option for the node-workspace
     *   plugin
     * @param {boolean} manifestOptions.separatePullRequests If true, create separate pull
     *   requests instead of a single manifest release pull request
     * @param {PluginType[]} manifestOptions.plugins Any plugins to use for this repository
     * @param {boolean} manifestOptions.fork If true, create pull requests from a fork. Defaults
     *   to `false`
     * @param {string} manifestOptions.signoff Add a Signed-off-by annotation to the commit
     * @param {string} manifestOptions.manifestPath Path to the versions manifest
     * @param {string[]} manifestOptions.labels Labels that denote a pending, untagged release
     *   pull request. Defaults to `[autorelease: pending]`
     * @param {string[]} manifestOptions.releaseLabels Labels to apply to a tagged release
     *   pull request. Defaults to `[autorelease: tagged]`
     * @returns {Manifest}
     */
    static async fromConfig(github, targetBranch, config, manifestOptions, path = exports.ROOT_PROJECT_PATH) {
        const repositoryConfig = {};
        repositoryConfig[path] = config;
        const strategy = await (0, factory_1.buildStrategy)({
            github,
            ...config,
        });
        const component = await strategy.getBranchComponent();
        const releasedVersions = {};
        const latestVersion = await latestReleaseVersion(github, targetBranch, version => isPublishedVersion(strategy, version), config, component, manifestOptions === null || manifestOptions === void 0 ? void 0 : manifestOptions.logger);
        if (latestVersion) {
            releasedVersions[path] = latestVersion;
        }
        return new Manifest(github, targetBranch, repositoryConfig, releasedVersions, {
            separatePullRequests: true,
            ...manifestOptions,
        });
    }
    /**
     * Build all candidate pull requests for this repository.
     *
     * Iterates through each path and builds a candidate pull request for component.
     * Applies any configured plugins.
     *
     * @returns {ReleasePullRequest[]} The candidate pull requests to open or update.
     */
    async buildPullRequests() {
        var _a;
        this.logger.info('Building pull requests');
        const pathsByComponent = await this.getPathsByComponent();
        const strategiesByPath = await this.getStrategiesByPath();
        // Collect all the SHAs of the latest release packages
        this.logger.info('Collecting release commit SHAs');
        let releasesFound = 0;
        const expectedReleases = Object.keys(strategiesByPath).length;
        // SHAs by path
        const releaseShasByPath = {};
        // Releases by path
        const releasesByPath = {};
        this.logger.debug(`release search depth: ${this.releaseSearchDepth}`);
        for await (const release of this.github.releaseIterator({
            maxResults: this.releaseSearchDepth,
        })) {
            const tagName = tag_name_1.TagName.parse(release.tagName);
            if (!tagName) {
                this.logger.warn(`Unable to parse release name: ${release.name}`);
                continue;
            }
            const component = tagName.component || exports.DEFAULT_COMPONENT_NAME;
            const path = pathsByComponent[component];
            if (!path) {
                this.logger.warn(`Found release tag with component '${component}', but not configured in manifest`);
                continue;
            }
            const expectedVersion = this.releasedVersions[path];
            if (!expectedVersion) {
                this.logger.warn(`Unable to find expected version for path '${path}' in manifest`);
                continue;
            }
            if (expectedVersion.toString() === tagName.version.toString()) {
                this.logger.debug(`Found release for path ${path}, ${release.tagName}`);
                releaseShasByPath[path] = release.sha;
                releasesByPath[path] = {
                    name: release.name,
                    tag: tagName,
                    sha: release.sha,
                    notes: release.notes || '',
                };
                releasesFound += 1;
            }
            if (releasesFound >= expectedReleases) {
                break;
            }
        }
        if (releasesFound < expectedReleases) {
            this.logger.warn(`Expected ${expectedReleases} releases, only found ${releasesFound}`);
            // Fall back to looking for missing releases using expected tags
            const missingPaths = Object.keys(strategiesByPath).filter(path => !releasesByPath[path]);
            this.logger.warn(`Missing ${missingPaths.length} paths: ${missingPaths}`);
            const missingReleases = await this.backfillReleasesFromTags(missingPaths, strategiesByPath);
            for (const path in missingReleases) {
                releaseShasByPath[path] = missingReleases[path].sha;
                releasesByPath[path] = missingReleases[path];
                releasesFound++;
            }
        }
        const needsBootstrap = releasesFound < expectedReleases;
        if (releasesFound < expectedReleases) {
            this.logger.warn(`Expected ${expectedReleases} releases, only found ${releasesFound}`);
        }
        for (const path in releasesByPath) {
            const release = releasesByPath[path];
            this.logger.debug(`release for path: ${path}, version: ${release.tag.version.toString()}, sha: ${release.sha}`);
        }
        // iterate through commits and collect commits until we have
        // seen all release commits
        this.logger.info('Collecting commits since all latest releases');
        const commits = [];
        this.logger.debug(`commit search depth: ${this.commitSearchDepth}`);
        const commitGenerator = this.github.mergeCommitIterator(this.targetBranch, {
            maxResults: this.commitSearchDepth,
            backfillFiles: true,
        });
        const releaseShas = new Set(Object.values(releaseShasByPath));
        this.logger.debug(releaseShas);
        const expectedShas = releaseShas.size;
        // sha => release pull request
        const releasePullRequestsBySha = {};
        let releaseCommitsFound = 0;
        for await (const commit of commitGenerator) {
            if (releaseShas.has(commit.sha)) {
                if (commit.pullRequest) {
                    releasePullRequestsBySha[commit.sha] = commit.pullRequest;
                }
                else {
                    this.logger.warn(`Release SHA ${commit.sha} did not have an associated pull request`);
                }
                releaseCommitsFound += 1;
            }
            if (this.lastReleaseSha && this.lastReleaseSha === commit.sha) {
                this.logger.info(`Using configured lastReleaseSha ${this.lastReleaseSha} as last commit.`);
                break;
            }
            else if (needsBootstrap && commit.sha === this.bootstrapSha) {
                this.logger.info(`Needed bootstrapping, found configured bootstrapSha ${this.bootstrapSha}`);
                break;
            }
            else if (!needsBootstrap && releaseCommitsFound >= expectedShas) {
                // found enough commits
                break;
            }
            commits.push({
                sha: commit.sha,
                message: commit.message,
                files: commit.files,
                pullRequest: commit.pullRequest,
            });
        }
        if (releaseCommitsFound < expectedShas) {
            this.logger.warn(`Expected ${expectedShas} commits, only found ${releaseCommitsFound}`);
        }
        // split commits by path
        this.logger.info(`Splitting ${commits.length} commits by path`);
        const cs = new commit_split_1.CommitSplit({
            includeEmpty: true,
            packagePaths: Object.keys(this.repositoryConfig),
        });
        const splitCommits = cs.split(commits);
        // limit paths to ones since the last release
        let commitsPerPath = {};
        for (const path in this.repositoryConfig) {
            commitsPerPath[path] = commitsAfterSha(path === exports.ROOT_PROJECT_PATH ? commits : splitCommits[path], releaseShasByPath[path]);
        }
        const commitExclude = new commit_exclude_1.CommitExclude(this.repositoryConfig);
        commitsPerPath = commitExclude.excludeCommits(commitsPerPath);
        // backfill latest release tags from manifest
        for (const path in this.repositoryConfig) {
            const latestRelease = releasesByPath[path];
            if (!latestRelease &&
                this.releasedVersions[path] &&
                this.releasedVersions[path].toString() !== '0.0.0') {
                const version = this.releasedVersions[path];
                const strategy = strategiesByPath[path];
                const component = await strategy.getComponent();
                this.logger.info(`No latest release found for path: ${path}, component: ${component}, but a previous version (${version.toString()}) was specified in the manifest.`);
                releasesByPath[path] = {
                    tag: new tag_name_1.TagName(version, component),
                    sha: '',
                    notes: '',
                };
            }
        }
        let strategies = strategiesByPath;
        for (const plugin of this.plugins) {
            strategies = await plugin.preconfigure(strategies, commitsPerPath, releasesByPath);
        }
        let newReleasePullRequests = [];
        for (const path in this.repositoryConfig) {
            const config = this.repositoryConfig[path];
            this.logger.info(`Building candidate release pull request for path: ${path}`);
            this.logger.debug(`type: ${config.releaseType}`);
            this.logger.debug(`targetBranch: ${this.targetBranch}`);
            let pathCommits = (0, commit_1.parseConventionalCommits)(commitsPerPath[path], this.logger);
            // The processCommits hook can be implemented by plugins to
            // post-process commits. This can be used to perform cleanup, e.g,, sentence
            // casing all commit messages:
            for (const plugin of this.plugins) {
                pathCommits = plugin.processCommits(pathCommits);
            }
            this.logger.debug(`commits: ${pathCommits.length}`);
            const latestReleasePullRequest = releasePullRequestsBySha[releaseShasByPath[path]];
            if (!latestReleasePullRequest) {
                this.logger.warn('No latest release pull request found.');
            }
            const strategy = strategies[path];
            const latestRelease = releasesByPath[path];
            const releasePullRequest = await strategy.buildReleasePullRequest(pathCommits, latestRelease, (_a = config.draftPullRequest) !== null && _a !== void 0 ? _a : this.draftPullRequest, this.labels);
            if (releasePullRequest) {
                // Update manifest, but only for valid release version - this will skip SNAPSHOT from java strategy
                if (releasePullRequest.version &&
                    isPublishedVersion(strategy, releasePullRequest.version)) {
                    const versionsMap = new Map();
                    versionsMap.set(path, releasePullRequest.version);
                    releasePullRequest.updates.push({
                        path: this.manifestPath,
                        createIfMissing: false,
                        updater: new release_please_manifest_1.ReleasePleaseManifest({
                            version: releasePullRequest.version,
                            versionsMap,
                        }),
                    });
                }
                newReleasePullRequests.push({
                    path,
                    config,
                    pullRequest: releasePullRequest,
                });
            }
        }
        // Combine pull requests into 1 unless configured for separate
        // pull requests
        if (!this.separatePullRequests) {
            this.plugins.push(new merge_1.Merge(this.github, this.targetBranch, this.repositoryConfig, {
                pullRequestTitlePattern: this.groupPullRequestTitlePattern,
            }));
        }
        for (const plugin of this.plugins) {
            this.logger.debug(`running plugin: ${plugin.constructor.name}`);
            newReleasePullRequests = await plugin.run(newReleasePullRequests);
        }
        return newReleasePullRequests.map(pullRequestWithConfig => pullRequestWithConfig.pullRequest);
    }
    async backfillReleasesFromTags(missingPaths, strategiesByPath) {
        const releasesByPath = {};
        const allTags = await this.getAllTags();
        for (const path of missingPaths) {
            const expectedVersion = this.releasedVersions[path];
            if (!expectedVersion) {
                this.logger.warn(`No version for path ${path}`);
                continue;
            }
            const component = await strategiesByPath[path].getComponent();
            const expectedTag = new tag_name_1.TagName(expectedVersion, component, this.repositoryConfig[path].tagSeparator, this.repositoryConfig[path].includeVInTag);
            this.logger.debug(`looking for tagName: ${expectedTag.toString()}`);
            const foundTag = allTags[expectedTag.toString()];
            if (foundTag) {
                this.logger.debug(`found: ${foundTag.name} ${foundTag.sha}`);
                releasesByPath[path] = {
                    name: foundTag.name,
                    tag: expectedTag,
                    sha: foundTag.sha,
                    notes: '',
                };
            }
        }
        return releasesByPath;
    }
    async getAllTags() {
        const allTags = {};
        for await (const tag of this.github.tagIterator()) {
            allTags[tag.name] = tag;
        }
        return allTags;
    }
    /**
     * Opens/updates all candidate release pull requests for this repository.
     *
     * @returns {PullRequest[]} Pull request numbers of release pull requests
     */
    async createPullRequests() {
        const candidatePullRequests = await this.buildPullRequests();
        if (candidatePullRequests.length === 0) {
            return [];
        }
        // if there are any merged, pending release pull requests, don't open
        // any new release PRs
        const mergedPullRequestsGenerator = this.findMergedReleasePullRequests();
        for await (const _ of mergedPullRequestsGenerator) {
            this.logger.warn('There are untagged, merged release PRs outstanding - aborting');
            return [];
        }
        // collect open and snoozed release pull requests
        const openPullRequests = await this.findOpenReleasePullRequests();
        const snoozedPullRequests = await this.findSnoozedReleasePullRequests();
        if (this.sequentialCalls) {
            const pullRequests = [];
            for (const pullRequest of candidatePullRequests) {
                const resultPullRequest = await this.createOrUpdatePullRequest(pullRequest, openPullRequests, snoozedPullRequests);
                if (resultPullRequest)
                    pullRequests.push(resultPullRequest);
            }
            return pullRequests;
        }
        else {
            const promises = [];
            for (const pullRequest of candidatePullRequests) {
                promises.push(this.createOrUpdatePullRequest(pullRequest, openPullRequests, snoozedPullRequests));
            }
            const pullNumbers = await Promise.all(promises);
            // reject any pull numbers that were not created or updated
            return pullNumbers.filter(number => !!number);
        }
    }
    async findOpenReleasePullRequests() {
        this.logger.info('Looking for open release pull requests');
        const openPullRequests = [];
        const generator = this.github.pullRequestIterator(this.targetBranch, 'OPEN', Number.MAX_SAFE_INTEGER, false);
        for await (const openPullRequest of generator) {
            if (hasAllLabels(this.labels, openPullRequest.labels) ||
                hasAllLabels(this.snapshotLabels, openPullRequest.labels)) {
                const body = await this.pullRequestOverflowHandler.parseOverflow(openPullRequest);
                if (body) {
                    // maybe replace with overflow body
                    openPullRequests.push({
                        ...openPullRequest,
                        body: body.toString(),
                    });
                }
            }
        }
        this.logger.info(`found ${openPullRequests.length} open release pull requests.`);
        return openPullRequests;
    }
    async findSnoozedReleasePullRequests() {
        this.logger.info('Looking for snoozed release pull requests');
        const snoozedPullRequests = [];
        const closedGenerator = this.github.pullRequestIterator(this.targetBranch, 'CLOSED', 200, false);
        for await (const closedPullRequest of closedGenerator) {
            if (hasAllLabels([exports.SNOOZE_LABEL], closedPullRequest.labels) &&
                branch_name_1.BranchName.parse(closedPullRequest.headBranchName, this.logger)) {
                const body = await this.pullRequestOverflowHandler.parseOverflow(closedPullRequest);
                if (body) {
                    // maybe replace with overflow body
                    snoozedPullRequests.push({
                        ...closedPullRequest,
                        body: body.toString(),
                    });
                }
            }
        }
        this.logger.info(`found ${snoozedPullRequests.length} snoozed release pull requests.`);
        return snoozedPullRequests;
    }
    async createOrUpdatePullRequest(pullRequest, openPullRequests, snoozedPullRequests) {
        // look for existing, open pull request
        const existing = openPullRequests.find(openPullRequest => openPullRequest.headBranchName === pullRequest.headRefName);
        if (existing) {
            return await this.maybeUpdateExistingPullRequest(existing, pullRequest);
        }
        // look for closed, snoozed pull request
        const snoozed = snoozedPullRequests.find(openPullRequest => openPullRequest.headBranchName === pullRequest.headRefName);
        if (snoozed) {
            return await this.maybeUpdateSnoozedPullRequest(snoozed, pullRequest);
        }
        const body = await this.pullRequestOverflowHandler.handleOverflow(pullRequest);
        const message = this.signoffUser
            ? (0, signoff_commit_message_1.signoffCommitMessage)(pullRequest.title.toString(), this.signoffUser)
            : pullRequest.title.toString();
        const newPullRequest = await this.github.createPullRequest({
            headBranchName: pullRequest.headRefName,
            baseBranchName: this.targetBranch,
            number: -1,
            title: pullRequest.title.toString(),
            body,
            labels: this.skipLabeling ? [] : pullRequest.labels,
            files: [],
        }, this.targetBranch, message, pullRequest.updates, {
            fork: this.fork,
            draft: pullRequest.draft,
            reviewers: this.reviewers,
        });
        return newPullRequest;
    }
    /// only update an existing pull request if it has release note changes
    async maybeUpdateExistingPullRequest(existing, pullRequest) {
        // If unchanged, no need to push updates
        if (existing.body === pullRequest.body.toString()) {
            this.logger.info(`PR https://github.com/${this.repository.owner}/${this.repository.repo}/pull/${existing.number} remained the same`);
            return undefined;
        }
        const updatedPullRequest = await this.github.updatePullRequest(existing.number, pullRequest, this.targetBranch, {
            fork: this.fork,
            signoffUser: this.signoffUser,
            pullRequestOverflowHandler: this.pullRequestOverflowHandler,
        });
        return updatedPullRequest;
    }
    /// only update an snoozed pull request if it has release note changes
    async maybeUpdateSnoozedPullRequest(snoozed, pullRequest) {
        // If unchanged, no need to push updates
        if (snoozed.body === pullRequest.body.toString()) {
            this.logger.info(`PR https://github.com/${this.repository.owner}/${this.repository.repo}/pull/${snoozed.number} remained the same`);
            return undefined;
        }
        const updatedPullRequest = await this.github.updatePullRequest(snoozed.number, pullRequest, this.targetBranch, {
            fork: this.fork,
            signoffUser: this.signoffUser,
            pullRequestOverflowHandler: this.pullRequestOverflowHandler,
        });
        // TODO: consider leaving the snooze label
        await this.github.removeIssueLabels([exports.SNOOZE_LABEL], snoozed.number);
        return updatedPullRequest;
    }
    async *findMergedReleasePullRequests() {
        // Find merged release pull requests
        const pullRequestGenerator = this.github.pullRequestIterator(this.targetBranch, 'MERGED', 200, false);
        for await (const pullRequest of pullRequestGenerator) {
            if (!hasAllLabels(this.labels, pullRequest.labels)) {
                continue;
            }
            this.logger.debug(`Found pull request #${pullRequest.number}: '${pullRequest.title}'`);
            // if the pull request body overflows, handle it
            const pullRequestBody = await this.pullRequestOverflowHandler.parseOverflow(pullRequest);
            if (!pullRequestBody) {
                this.logger.debug('could not parse pull request body as a release PR');
                continue;
            }
            // replace with the complete fetched body
            yield {
                ...pullRequest,
                body: pullRequestBody.toString(),
            };
        }
    }
    /**
     * Find merged, untagged releases and build candidate releases to tag.
     *
     * @returns {CandidateRelease[]} List of release candidates
     */
    async buildReleases() {
        var _a;
        this.logger.info('Building releases');
        const strategiesByPath = await this.getStrategiesByPath();
        // Find merged release pull requests
        const generator = await this.findMergedReleasePullRequests();
        const candidateReleases = [];
        for await (const pullRequest of generator) {
            for (const path in this.repositoryConfig) {
                const config = this.repositoryConfig[path];
                this.logger.info(`Building release for path: ${path}`);
                this.logger.debug(`type: ${config.releaseType}`);
                this.logger.debug(`targetBranch: ${this.targetBranch}`);
                const strategy = strategiesByPath[path];
                const releases = await strategy.buildReleases(pullRequest, {
                    groupPullRequestTitlePattern: this.groupPullRequestTitlePattern,
                });
                for (const release of releases) {
                    candidateReleases.push({
                        ...release,
                        path,
                        pullRequest,
                        draft: (_a = config.draft) !== null && _a !== void 0 ? _a : this.draft,
                        prerelease: config.prerelease &&
                            (!!release.tag.version.preRelease ||
                                release.tag.version.major === 0),
                    });
                }
            }
        }
        return candidateReleases;
    }
    /**
     * Find merged, untagged releases. For each release, create a GitHub release,
     * comment on the pull request used to generated it and update the pull request
     * labels.
     *
     * @returns {GitHubRelease[]} List of created GitHub releases
     */
    async createReleases() {
        const releasesByPullRequest = {};
        const pullRequestsByNumber = {};
        for (const release of await this.buildReleases()) {
            pullRequestsByNumber[release.pullRequest.number] = release.pullRequest;
            if (releasesByPullRequest[release.pullRequest.number]) {
                releasesByPullRequest[release.pullRequest.number].push(release);
            }
            else {
                releasesByPullRequest[release.pullRequest.number] = [release];
            }
        }
        if (this.sequentialCalls) {
            const resultReleases = [];
            for (const pullNumber in releasesByPullRequest) {
                const releases = await this.createReleasesForPullRequest(releasesByPullRequest[pullNumber], pullRequestsByNumber[pullNumber]);
                resultReleases.push(...releases);
            }
            return resultReleases;
        }
        else {
            const promises = [];
            for (const pullNumber in releasesByPullRequest) {
                promises.push(this.createReleasesForPullRequest(releasesByPullRequest[pullNumber], pullRequestsByNumber[pullNumber]));
            }
            const releases = await Promise.all(promises);
            return releases.reduce((collection, r) => collection.concat(r), []);
        }
    }
    async createReleasesForPullRequest(releases, pullRequest) {
        this.logger.info(`Creating ${releases.length} releases for pull #${pullRequest.number}`);
        const duplicateReleases = [];
        const githubReleases = [];
        for (const release of releases) {
            try {
                githubReleases.push(await this.createRelease(release));
            }
            catch (err) {
                if (err instanceof errors_1.DuplicateReleaseError) {
                    this.logger.warn(`Duplicate release tag: ${release.tag.toString()}`);
                    duplicateReleases.push(err);
                }
                else {
                    throw err;
                }
            }
        }
        if (duplicateReleases.length > 0) {
            if (duplicateReleases.length + githubReleases.length ===
                releases.length) {
                // we've either tagged all releases or they were duplicates:
                // adjust tags on pullRequest
                await Promise.all([
                    this.github.removeIssueLabels(this.labels, pullRequest.number),
                    this.github.addIssueLabels(this.releaseLabels, pullRequest.number),
                ]);
            }
            if (githubReleases.length === 0) {
                // If all releases were duplicate, throw a duplicate error
                throw duplicateReleases[0];
            }
        }
        else {
            // adjust tags on pullRequest
            await Promise.all([
                this.github.removeIssueLabels(this.labels, pullRequest.number),
                this.github.addIssueLabels(this.releaseLabels, pullRequest.number),
            ]);
        }
        return githubReleases;
    }
    async createRelease(release) {
        const githubRelease = await this.github.createRelease(release, {
            draft: release.draft,
            prerelease: release.prerelease,
        });
        // comment on pull request
        const comment = `:robot: Release is at ${githubRelease.url} :sunflower:`;
        await this.github.commentOnIssue(comment, release.pullRequest.number);
        return {
            ...githubRelease,
            path: release.path,
            version: release.tag.version.toString(),
            major: release.tag.version.major,
            minor: release.tag.version.minor,
            patch: release.tag.version.patch,
        };
    }
    async getStrategiesByPath() {
        if (!this._strategiesByPath) {
            this.logger.info('Building strategies by path');
            this._strategiesByPath = {};
            for (const path in this.repositoryConfig) {
                const config = this.repositoryConfig[path];
                this.logger.debug(`${path}: ${config.releaseType}`);
                const strategy = await (0, factory_1.buildStrategy)({
                    ...config,
                    github: this.github,
                    path,
                    targetBranch: this.targetBranch,
                });
                this._strategiesByPath[path] = strategy;
            }
        }
        return this._strategiesByPath;
    }
    async getPathsByComponent() {
        if (!this._pathsByComponent) {
            this._pathsByComponent = {};
            const strategiesByPath = await this.getStrategiesByPath();
            for (const path in this.repositoryConfig) {
                const strategy = strategiesByPath[path];
                const component = (await strategy.getComponent()) || '';
                if (this._pathsByComponent[component]) {
                    this.logger.warn(`Multiple paths for ${component}: ${this._pathsByComponent[component]}, ${path}`);
                }
                this._pathsByComponent[component] = path;
            }
        }
        return this._pathsByComponent;
    }
}
exports.Manifest = Manifest;
/**
 * Helper to convert parsed JSON releaser config into ReleaserConfig for
 * the Manifest.
 *
 * @param {ReleaserPackageConfig} config Parsed configuration from JSON file.
 * @returns {ReleaserConfig}
 */
function extractReleaserConfig(config) {
    var _a, _b, _c;
    return {
        releaseType: config['release-type'],
        bumpMinorPreMajor: config['bump-minor-pre-major'],
        bumpPatchForMinorPreMajor: config['bump-patch-for-minor-pre-major'],
        versioning: config['versioning'],
        changelogSections: config['changelog-sections'],
        changelogPath: config['changelog-path'],
        changelogHost: config['changelog-host'],
        releaseAs: config['release-as'],
        skipGithubRelease: config['skip-github-release'],
        draft: config.draft,
        prerelease: config.prerelease,
        draftPullRequest: config['draft-pull-request'],
        component: config['component'],
        packageName: config['package-name'],
        versionFile: config['version-file'],
        extraFiles: config['extra-files'],
        includeComponentInTag: config['include-component-in-tag'],
        includeVInTag: config['include-v-in-tag'],
        changelogType: config['changelog-type'],
        pullRequestTitlePattern: config['pull-request-title-pattern'],
        pullRequestHeader: config['pull-request-header'],
        tagSeparator: config['tag-separator'],
        separatePullRequests: config['separate-pull-requests'],
        labels: (_a = config['label']) === null || _a === void 0 ? void 0 : _a.split(','),
        releaseLabels: (_b = config['release-label']) === null || _b === void 0 ? void 0 : _b.split(','),
        extraLabels: (_c = config['extra-label']) === null || _c === void 0 ? void 0 : _c.split(','),
        skipSnapshot: config['skip-snapshot'],
        initialVersion: config['initial-version'],
        excludePaths: config['exclude-paths'],
    };
}
/**
 * Helper to convert fetch the manifest config from the repository and
 * parse into configuration for the Manifest.
 *
 * @param {GitHub} github GitHub client
 * @param {string} configFile Path in the repository to the manifest config
 * @param {string} branch Branch to fetch the config file from
 * @param {string} onlyPath Optional. Use only the given package
 * @param {string} releaseAs Optional. Override release-as and use the given version
 */
async function parseConfig(github, configFile, branch, onlyPath, releaseAs) {
    const config = await fetchManifestConfig(github, configFile, branch);
    const defaultConfig = extractReleaserConfig(config);
    const repositoryConfig = {};
    for (const path in config.packages) {
        if (onlyPath && onlyPath !== path)
            continue;
        repositoryConfig[path] = mergeReleaserConfig(defaultConfig, extractReleaserConfig(config.packages[path]));
        if (releaseAs) {
            repositoryConfig[path].releaseAs = releaseAs;
        }
    }
    const configLabel = config['label'];
    const configReleaseLabel = config['release-label'];
    const configSnapshotLabel = config['snapshot-label'];
    const configExtraLabel = config['extra-label'];
    const manifestOptions = {
        bootstrapSha: config['bootstrap-sha'],
        lastReleaseSha: config['last-release-sha'],
        alwaysLinkLocal: config['always-link-local'],
        separatePullRequests: config['separate-pull-requests'],
        groupPullRequestTitlePattern: config['group-pull-request-title-pattern'],
        plugins: config['plugins'],
        labels: configLabel === null || configLabel === void 0 ? void 0 : configLabel.split(','),
        releaseLabels: configReleaseLabel === null || configReleaseLabel === void 0 ? void 0 : configReleaseLabel.split(','),
        snapshotLabels: configSnapshotLabel === null || configSnapshotLabel === void 0 ? void 0 : configSnapshotLabel.split(','),
        extraLabels: configExtraLabel === null || configExtraLabel === void 0 ? void 0 : configExtraLabel.split(','),
        releaseSearchDepth: config['release-search-depth'],
        commitSearchDepth: config['commit-search-depth'],
        sequentialCalls: config['sequential-calls'],
    };
    return { config: repositoryConfig, options: manifestOptions };
}
/**
 * Helper to fetch manifest config
 *
 * @param {GitHub} github
 * @param {string} configFile
 * @param {string} branch
 * @returns {ManifestConfig}
 * @throws {ConfigurationError} if missing the manifest config file
 */
async function fetchManifestConfig(github, configFile, branch) {
    try {
        return await github.getFileJson(configFile, branch);
    }
    catch (e) {
        if (e instanceof errors_1.FileNotFoundError) {
            throw new errors_1.ConfigurationError(`Missing required manifest config: ${configFile}`, 'base', `${github.repository.owner}/${github.repository.repo}`);
        }
        else if (e instanceof SyntaxError) {
            throw new errors_1.ConfigurationError(`Failed to parse manifest config JSON: ${configFile}\n${e.message}`, 'base', `${github.repository.owner}/${github.repository.repo}`);
        }
        throw e;
    }
}
/**
 * Helper to parse the manifest versions file.
 *
 * @param {GitHub} github GitHub client
 * @param {string} manifestFile Path in the repository to the versions file
 * @param {string} branch Branch to fetch the versions file from
 * @returns {Record<string, string>}
 */
async function parseReleasedVersions(github, manifestFile, branch) {
    const manifestJson = await fetchReleasedVersions(github, manifestFile, branch);
    const releasedVersions = {};
    for (const path in manifestJson) {
        releasedVersions[path] = version_1.Version.parse(manifestJson[path]);
    }
    return releasedVersions;
}
/**
 * Helper to fetch manifest config
 *
 * @param {GitHub} github
 * @param {string} manifestFile
 * @param {string} branch
 * @throws {ConfigurationError} if missing the manifest config file
 */
async function fetchReleasedVersions(github, manifestFile, branch) {
    try {
        return await github.getFileJson(manifestFile, branch);
    }
    catch (e) {
        if (e instanceof errors_1.FileNotFoundError) {
            throw new errors_1.ConfigurationError(`Missing required manifest versions: ${manifestFile}`, 'base', `${github.repository.owner}/${github.repository.repo}`);
        }
        else if (e instanceof SyntaxError) {
            throw new errors_1.ConfigurationError(`Failed to parse manifest versions JSON: ${manifestFile}\n${e.message}`, 'base', `${github.repository.owner}/${github.repository.repo}`);
        }
        throw e;
    }
}
function isPublishedVersion(strategy, version) {
    return strategy.isPublishedVersion
        ? strategy.isPublishedVersion(version)
        : true;
}
/**
 * Find the most recent matching release tag on the branch we're
 * configured for.
 *
 * @param github GitHub client instance.
 * @param {string} targetBranch Name of the scanned branch.
 * @param releaseFilter Validator function for release version. Used to filter-out SNAPSHOT releases for Java strategy.
 * @param {string} prefix Limit the release to a specific component.
 * @param pullRequestTitlePattern Configured PR title pattern.
 */
async function latestReleaseVersion(github, targetBranch, releaseFilter, config, prefix, logger = logger_1.logger) {
    const branchPrefix = prefix
        ? prefix.endsWith('-')
            ? prefix.replace(/-$/, '')
            : prefix
        : undefined;
    logger.info(`Looking for latest release on branch: ${targetBranch} with prefix: ${prefix}`);
    // collect set of recent commit SHAs seen to verify that the release
    // is in the current branch
    const commitShas = new Set();
    const candidateReleaseVersions = [];
    // only look at the last 250 or so commits to find the latest tag - we
    // don't want to scan the entire repository history if this repo has never
    // been released
    const generator = github.mergeCommitIterator(targetBranch, {
        maxResults: 250,
    });
    for await (const commitWithPullRequest of generator) {
        commitShas.add(commitWithPullRequest.sha);
        const mergedPullRequest = commitWithPullRequest.pullRequest;
        if (!mergedPullRequest) {
            logger.trace(`skipping commit: ${commitWithPullRequest.sha} missing merged pull request`);
            continue;
        }
        const branchName = branch_name_1.BranchName.parse(mergedPullRequest.headBranchName, logger);
        if (!branchName) {
            logger.trace(`skipping commit: ${commitWithPullRequest.sha} unrecognized branch name: ${mergedPullRequest.headBranchName}`);
            continue;
        }
        // If branchPrefix is specified, ensure it is found in the branch name.
        // If branchPrefix is not specified, component should also be undefined.
        if (branchName.getComponent() !== branchPrefix) {
            logger.trace(`skipping commit: ${commitWithPullRequest.sha} branch component ${branchName.getComponent()} doesn't match expected prefix: ${branchPrefix}`);
            continue;
        }
        const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(mergedPullRequest.title, config.pullRequestTitlePattern, logger);
        if (!pullRequestTitle) {
            logger.trace(`skipping commit: ${commitWithPullRequest.sha} couldn't parse pull request title: ${mergedPullRequest.title}`);
            continue;
        }
        const version = pullRequestTitle.getVersion();
        if (version && releaseFilter(version)) {
            logger.debug(`Found latest release pull request: ${mergedPullRequest.number} version: ${version}`);
            candidateReleaseVersions.push(version);
            break;
        }
    }
    // If not found from recent pull requests, look at releases. Iterate
    // through releases finding valid tags, then cross reference
    const releaseGenerator = github.releaseIterator();
    for await (const release of releaseGenerator) {
        const tagName = tag_name_1.TagName.parse(release.tagName);
        if (!tagName) {
            continue;
        }
        if (tagMatchesConfig(tagName, branchPrefix, config.includeComponentInTag)) {
            logger.debug(`found release for ${prefix}`, tagName.version);
            if (!commitShas.has(release.sha)) {
                logger.debug(`SHA not found in recent commits to branch ${targetBranch}, skipping`);
                continue;
            }
            candidateReleaseVersions.push(tagName.version);
        }
    }
    logger.debug(`found ${candidateReleaseVersions.length} possible releases.`, candidateReleaseVersions);
    if (candidateReleaseVersions.length > 0) {
        // Find largest release number (sort descending then return first)
        return candidateReleaseVersions.sort((a, b) => b.compare(a))[0];
    }
    // If not found from recent pull requests or releases, look at tags. Iterate
    // through tags and cross reference against SHAs in this branch
    const tagGenerator = github.tagIterator();
    const candidateTagVersion = [];
    for await (const tag of tagGenerator) {
        const tagName = tag_name_1.TagName.parse(tag.name);
        if (!tagName) {
            continue;
        }
        if (tagMatchesConfig(tagName, branchPrefix, config.includeComponentInTag)) {
            if (!commitShas.has(tag.sha)) {
                logger.debug(`SHA not found in recent commits to branch ${targetBranch}, skipping`);
                continue;
            }
            candidateTagVersion.push(tagName.version);
        }
    }
    logger.debug(`found ${candidateTagVersion.length} possible tags.`, candidateTagVersion);
    // Find largest release number (sort descending then return first)
    return candidateTagVersion.sort((a, b) => b.compare(a))[0];
}
function mergeReleaserConfig(defaultConfig, pathConfig) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    return {
        releaseType: (_b = (_a = pathConfig.releaseType) !== null && _a !== void 0 ? _a : defaultConfig.releaseType) !== null && _b !== void 0 ? _b : 'node',
        bumpMinorPreMajor: (_c = pathConfig.bumpMinorPreMajor) !== null && _c !== void 0 ? _c : defaultConfig.bumpMinorPreMajor,
        bumpPatchForMinorPreMajor: (_d = pathConfig.bumpPatchForMinorPreMajor) !== null && _d !== void 0 ? _d : defaultConfig.bumpPatchForMinorPreMajor,
        versioning: (_e = pathConfig.versioning) !== null && _e !== void 0 ? _e : defaultConfig.versioning,
        changelogSections: (_f = pathConfig.changelogSections) !== null && _f !== void 0 ? _f : defaultConfig.changelogSections,
        changelogPath: (_g = pathConfig.changelogPath) !== null && _g !== void 0 ? _g : defaultConfig.changelogPath,
        changelogHost: (_h = pathConfig.changelogHost) !== null && _h !== void 0 ? _h : defaultConfig.changelogHost,
        changelogType: (_j = pathConfig.changelogType) !== null && _j !== void 0 ? _j : defaultConfig.changelogType,
        releaseAs: (_k = pathConfig.releaseAs) !== null && _k !== void 0 ? _k : defaultConfig.releaseAs,
        skipGithubRelease: (_l = pathConfig.skipGithubRelease) !== null && _l !== void 0 ? _l : defaultConfig.skipGithubRelease,
        draft: (_m = pathConfig.draft) !== null && _m !== void 0 ? _m : defaultConfig.draft,
        prerelease: (_o = pathConfig.prerelease) !== null && _o !== void 0 ? _o : defaultConfig.prerelease,
        component: (_p = pathConfig.component) !== null && _p !== void 0 ? _p : defaultConfig.component,
        packageName: (_q = pathConfig.packageName) !== null && _q !== void 0 ? _q : defaultConfig.packageName,
        versionFile: (_r = pathConfig.versionFile) !== null && _r !== void 0 ? _r : defaultConfig.versionFile,
        extraFiles: (_s = pathConfig.extraFiles) !== null && _s !== void 0 ? _s : defaultConfig.extraFiles,
        includeComponentInTag: (_t = pathConfig.includeComponentInTag) !== null && _t !== void 0 ? _t : defaultConfig.includeComponentInTag,
        includeVInTag: (_u = pathConfig.includeVInTag) !== null && _u !== void 0 ? _u : defaultConfig.includeVInTag,
        tagSeparator: (_v = pathConfig.tagSeparator) !== null && _v !== void 0 ? _v : defaultConfig.tagSeparator,
        pullRequestTitlePattern: (_w = pathConfig.pullRequestTitlePattern) !== null && _w !== void 0 ? _w : defaultConfig.pullRequestTitlePattern,
        pullRequestHeader: (_x = pathConfig.pullRequestHeader) !== null && _x !== void 0 ? _x : defaultConfig.pullRequestHeader,
        separatePullRequests: (_y = pathConfig.separatePullRequests) !== null && _y !== void 0 ? _y : defaultConfig.separatePullRequests,
        skipSnapshot: (_z = pathConfig.skipSnapshot) !== null && _z !== void 0 ? _z : defaultConfig.skipSnapshot,
        initialVersion: (_0 = pathConfig.initialVersion) !== null && _0 !== void 0 ? _0 : defaultConfig.initialVersion,
        extraLabels: (_1 = pathConfig.extraLabels) !== null && _1 !== void 0 ? _1 : defaultConfig.extraLabels,
        excludePaths: (_2 = pathConfig.excludePaths) !== null && _2 !== void 0 ? _2 : defaultConfig.excludePaths,
    };
}
/**
 * Helper to compare if a list of labels fully contains another list of labels
 * @param {string[]} expected List of labels expected to be contained
 * @param {string[]} existing List of existing labels to consider
 */
function hasAllLabels(expected, existing) {
    const existingSet = new Set(existing);
    for (const label of expected) {
        if (!existingSet.has(label)) {
            return false;
        }
    }
    return true;
}
function commitsAfterSha(commits, lastReleaseSha) {
    if (!commits) {
        return [];
    }
    const index = commits.findIndex(commit => commit.sha === lastReleaseSha);
    if (index === -1) {
        return commits;
    }
    return commits.slice(0, index);
}
/**
 * Returns true if the release tag matches the configured component. Returns
 * true if `includeComponentInTag` is false and there is no component in the
 * tag, OR if the tag's component matches the release component.
 */
function tagMatchesConfig(tag, branchComponent, includeComponentInTag) {
    return ((includeComponentInTag && tag.component === branchComponent) ||
        (!includeComponentInTag && !tag.component));
}
//# sourceMappingURL=manifest.js.map