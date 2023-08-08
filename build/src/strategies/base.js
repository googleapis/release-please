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
exports.BaseStrategy = void 0;
const manifest_1 = require("../manifest");
const default_1 = require("../versioning-strategies/default");
const default_2 = require("../changelog-notes/default");
const version_1 = require("../version");
const tag_name_1 = require("../util/tag-name");
const logger_1 = require("../util/logger");
const pull_request_title_1 = require("../util/pull-request-title");
const branch_name_1 = require("../util/branch-name");
const pull_request_body_1 = require("../util/pull-request-body");
const composite_1 = require("../updaters/composite");
const generic_1 = require("../updaters/generic");
const generic_json_1 = require("../updaters/generic-json");
const generic_xml_1 = require("../updaters/generic-xml");
const pom_xml_1 = require("../updaters/java/pom-xml");
const generic_yaml_1 = require("../updaters/generic-yaml");
const generic_toml_1 = require("../updaters/generic-toml");
const DEFAULT_CHANGELOG_PATH = 'CHANGELOG.md';
/**
 * A strategy is responsible for determining which files are
 * necessary to update in a release pull request.
 */
class BaseStrategy {
    constructor(options) {
        var _a, _b, _c;
        this.logger = (_a = options.logger) !== null && _a !== void 0 ? _a : logger_1.logger;
        this.path = options.path || manifest_1.ROOT_PROJECT_PATH;
        this.github = options.github;
        this.packageName = options.packageName;
        this.component =
            options.component || this.normalizeComponent(this.packageName);
        this.versioningStrategy =
            options.versioningStrategy ||
                new default_1.DefaultVersioningStrategy({ logger: this.logger });
        this.targetBranch = options.targetBranch;
        this.repository = options.github.repository;
        this.changelogPath = options.changelogPath || DEFAULT_CHANGELOG_PATH;
        this.changelogHost = options.changelogHost;
        this.changelogSections = options.changelogSections;
        this.tagSeparator = options.tagSeparator;
        this.skipGitHubRelease = options.skipGitHubRelease || false;
        this.releaseAs = options.releaseAs;
        this.changelogNotes =
            options.changelogNotes || new default_2.DefaultChangelogNotes(options);
        this.includeComponentInTag = (_b = options.includeComponentInTag) !== null && _b !== void 0 ? _b : true;
        this.includeVInTag = (_c = options.includeVInTag) !== null && _c !== void 0 ? _c : true;
        this.pullRequestTitlePattern = options.pullRequestTitlePattern;
        this.pullRequestHeader = options.pullRequestHeader;
        this.extraFiles = options.extraFiles || [];
        this.initialVersion = options.initialVersion;
        this.extraLabels = options.extraLabels || [];
    }
    /**
     * Return the component for this strategy. This may be a computed field.
     * @returns {string}
     */
    async getComponent() {
        if (!this.includeComponentInTag) {
            return '';
        }
        return this.component || (await this.getDefaultComponent());
    }
    async getDefaultComponent() {
        var _a;
        return this.normalizeComponent((_a = this.packageName) !== null && _a !== void 0 ? _a : (await this.getDefaultPackageName()));
    }
    async getBranchComponent() {
        return this.component || (await this.getDefaultComponent());
    }
    async getPackageName() {
        var _a;
        return (_a = this.packageName) !== null && _a !== void 0 ? _a : (await this.getDefaultPackageName());
    }
    async getDefaultPackageName() {
        var _a;
        return (_a = this.packageName) !== null && _a !== void 0 ? _a : '';
    }
    normalizeComponent(component) {
        if (!component) {
            return '';
        }
        return component;
    }
    /**
     * Override this method to post process commits
     * @param {ConventionalCommit[]} commits parsed commits
     * @returns {ConventionalCommit[]} modified commits
     */
    async postProcessCommits(commits) {
        return commits;
    }
    async buildReleaseNotes(conventionalCommits, newVersion, newVersionTag, latestRelease, commits) {
        var _a;
        return await this.changelogNotes.buildNotes(conventionalCommits, {
            host: this.changelogHost,
            owner: this.repository.owner,
            repository: this.repository.repo,
            version: newVersion.toString(),
            previousTag: (_a = latestRelease === null || latestRelease === void 0 ? void 0 : latestRelease.tag) === null || _a === void 0 ? void 0 : _a.toString(),
            currentTag: newVersionTag.toString(),
            targetBranch: this.targetBranch,
            changelogSections: this.changelogSections,
            commits: commits,
        });
    }
    async buildPullRequestBody(component, newVersion, releaseNotesBody, _conventionalCommits, _latestRelease, pullRequestHeader) {
        return new pull_request_body_1.PullRequestBody([
            {
                component,
                version: newVersion,
                notes: releaseNotesBody,
            },
        ], { header: pullRequestHeader });
    }
    /**
     * Builds a candidate release pull request
     * @param {Commit[]} commits Raw commits to consider for this release.
     * @param {Release} latestRelease Optional. The last release for this
     *   component if available.
     * @param {boolean} draft Optional. Whether or not to create the pull
     *   request as a draft. Defaults to `false`.
     * @returns {ReleasePullRequest | undefined} The release pull request to
     *   open for this path/component. Returns undefined if we should not
     *   open a pull request.
     */
    async buildReleasePullRequest(commits, latestRelease, draft, labels = []) {
        const conventionalCommits = await this.postProcessCommits(commits);
        this.logger.info(`Considering: ${conventionalCommits.length} commits`);
        if (conventionalCommits.length === 0) {
            this.logger.info(`No commits for path: ${this.path}, skipping`);
            return undefined;
        }
        const newVersion = await this.buildNewVersion(conventionalCommits, latestRelease);
        const versionsMap = await this.updateVersionsMap(await this.buildVersionsMap(conventionalCommits), conventionalCommits, newVersion);
        const component = await this.getComponent();
        this.logger.debug('component:', component);
        const newVersionTag = new tag_name_1.TagName(newVersion, this.includeComponentInTag ? component : undefined, this.tagSeparator, this.includeVInTag);
        this.logger.debug('pull request title pattern:', this.pullRequestTitlePattern);
        const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofComponentTargetBranchVersion(component || '', this.targetBranch, newVersion, this.pullRequestTitlePattern);
        const branchComponent = await this.getBranchComponent();
        const branchName = branchComponent
            ? branch_name_1.BranchName.ofComponentTargetBranch(branchComponent, this.targetBranch)
            : branch_name_1.BranchName.ofTargetBranch(this.targetBranch);
        const releaseNotesBody = await this.buildReleaseNotes(conventionalCommits, newVersion, newVersionTag, latestRelease, commits);
        if (this.changelogEmpty(releaseNotesBody)) {
            this.logger.info(`No user facing commits found since ${latestRelease ? latestRelease.sha : 'beginning of time'} - skipping`);
            return undefined;
        }
        const updates = await this.buildUpdates({
            changelogEntry: releaseNotesBody,
            newVersion,
            versionsMap,
            latestVersion: latestRelease === null || latestRelease === void 0 ? void 0 : latestRelease.tag.version,
            commits: conventionalCommits,
        });
        const updatesWithExtras = (0, composite_1.mergeUpdates)(updates.concat(...(await this.extraFileUpdates(newVersion, versionsMap))));
        const pullRequestBody = await this.buildPullRequestBody(component, newVersion, releaseNotesBody, conventionalCommits, latestRelease, this.pullRequestHeader);
        return {
            title: pullRequestTitle,
            body: pullRequestBody,
            updates: updatesWithExtras,
            labels: [...labels, ...this.extraLabels],
            headRefName: branchName.toString(),
            version: newVersion,
            draft: draft !== null && draft !== void 0 ? draft : false,
        };
    }
    // Helper to convert extra files with globs to the file paths to add
    async extraFilePaths(extraFile) {
        if (typeof extraFile !== 'object') {
            return [extraFile];
        }
        if (!extraFile.glob) {
            return [extraFile.path];
        }
        if (extraFile.path.startsWith('/')) {
            // glob is relative to root, strip the leading `/` for glob matching
            // and re-add the leading `/` to make the file relative to the root
            return (await this.github.findFilesByGlobAndRef(extraFile.path.slice(1), this.targetBranch)).map(file => `/${file}`);
        }
        else if (this.path === manifest_1.ROOT_PROJECT_PATH) {
            // root component, ignore path prefix
            return this.github.findFilesByGlobAndRef(extraFile.path, this.targetBranch);
        }
        else {
            // glob is relative to current path
            return this.github.findFilesByGlobAndRef(extraFile.path, this.targetBranch, this.path);
        }
    }
    async extraFileUpdates(version, versionsMap) {
        const extraFileUpdates = [];
        for (const extraFile of this.extraFiles) {
            if (typeof extraFile === 'object') {
                const paths = await this.extraFilePaths(extraFile);
                for (const path of paths) {
                    switch (extraFile.type) {
                        case 'json':
                            extraFileUpdates.push({
                                path: this.addPath(path),
                                createIfMissing: false,
                                updater: new generic_json_1.GenericJson(extraFile.jsonpath, version),
                            });
                            break;
                        case 'yaml':
                            extraFileUpdates.push({
                                path: this.addPath(path),
                                createIfMissing: false,
                                updater: new generic_yaml_1.GenericYaml(extraFile.jsonpath, version),
                            });
                            break;
                        case 'toml':
                            extraFileUpdates.push({
                                path: this.addPath(path),
                                createIfMissing: false,
                                updater: new generic_toml_1.GenericToml(extraFile.jsonpath, version),
                            });
                            break;
                        case 'xml':
                            extraFileUpdates.push({
                                path: this.addPath(path),
                                createIfMissing: false,
                                updater: new generic_xml_1.GenericXml(extraFile.xpath, version),
                            });
                            break;
                        case 'pom':
                            extraFileUpdates.push({
                                path: this.addPath(path),
                                createIfMissing: false,
                                updater: new pom_xml_1.PomXml(version),
                            });
                            break;
                        default:
                            throw new Error(`unsupported extraFile type: ${extraFile.type}`);
                    }
                }
            }
            else {
                extraFileUpdates.push({
                    path: this.addPath(extraFile),
                    createIfMissing: false,
                    updater: new generic_1.Generic({ version, versionsMap }),
                });
            }
        }
        return extraFileUpdates;
    }
    changelogEmpty(changelogEntry) {
        return changelogEntry.split('\n').length <= 1;
    }
    async updateVersionsMap(versionsMap, conventionalCommits, _newVersion) {
        for (const [component, version] of versionsMap.entries()) {
            versionsMap.set(component, await this.versioningStrategy.bump(version, conventionalCommits));
        }
        return versionsMap;
    }
    async buildNewVersion(conventionalCommits, latestRelease) {
        if (this.releaseAs) {
            this.logger.warn(`Setting version for ${this.path} from release-as configuration`);
            return version_1.Version.parse(this.releaseAs);
        }
        const releaseAsCommit = conventionalCommits.find(conventionalCommit => conventionalCommit.notes.find(note => note.title === 'RELEASE AS'));
        if (releaseAsCommit) {
            const note = releaseAsCommit.notes.find(note => note.title === 'RELEASE AS');
            if (note) {
                return version_1.Version.parse(note.text);
            }
        }
        if (latestRelease) {
            return await this.versioningStrategy.bump(latestRelease.tag.version, conventionalCommits);
        }
        return this.initialReleaseVersion();
    }
    async buildVersionsMap(_conventionalCommits) {
        return new Map();
    }
    async parsePullRequestBody(pullRequestBody) {
        return pull_request_body_1.PullRequestBody.parse(pullRequestBody, this.logger);
    }
    /**
     * Given a merged pull request, build the candidate release.
     * @param {PullRequest} mergedPullRequest The merged release pull request.
     * @returns {Release} The candidate release.
     * @deprecated Use buildReleases() instead.
     */
    async buildRelease(mergedPullRequest, options) {
        var _a;
        if (this.skipGitHubRelease) {
            this.logger.info('Release skipped from strategy config');
            return;
        }
        if (!mergedPullRequest.sha) {
            this.logger.error('Pull request should have been merged');
            return;
        }
        const mergedTitlePattern = (_a = options === null || options === void 0 ? void 0 : options.groupPullRequestTitlePattern) !== null && _a !== void 0 ? _a : manifest_1.MANIFEST_PULL_REQUEST_TITLE_PATTERN;
        const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(mergedPullRequest.title, this.pullRequestTitlePattern, this.logger) ||
            pull_request_title_1.PullRequestTitle.parse(mergedPullRequest.title, mergedTitlePattern, this.logger);
        if (!pullRequestTitle) {
            this.logger.error(`Bad pull request title: '${mergedPullRequest.title}'`);
            return;
        }
        const branchName = branch_name_1.BranchName.parse(mergedPullRequest.headBranchName, this.logger);
        if (!branchName) {
            this.logger.error(`Bad branch name: ${mergedPullRequest.headBranchName}`);
            return;
        }
        const pullRequestBody = await this.parsePullRequestBody(mergedPullRequest.body);
        if (!pullRequestBody) {
            this.logger.error('Could not parse pull request body as a release PR');
            return;
        }
        const component = await this.getComponent();
        let releaseData;
        if (pullRequestBody.releaseData.length === 1 &&
            !pullRequestBody.releaseData[0].component) {
            const branchComponent = await this.getBranchComponent();
            // standalone release PR, ensure the components match
            if (this.normalizeComponent(branchName.component) !==
                this.normalizeComponent(branchComponent)) {
                this.logger.warn(`PR component: ${branchName.component} does not match configured component: ${branchComponent}`);
                return;
            }
            releaseData = pullRequestBody.releaseData[0];
        }
        else {
            // manifest release with multiple components - find the release notes
            // for the component to see if it was included in this release (parsed
            // from the release pull request body)
            releaseData = pullRequestBody.releaseData.find(datum => {
                return (this.normalizeComponent(datum.component) ===
                    this.normalizeComponent(component));
            });
            if (!releaseData && pullRequestBody.releaseData.length > 0) {
                this.logger.info(`Pull request contains releases, but not for component: ${component}`);
                return;
            }
        }
        const notes = releaseData === null || releaseData === void 0 ? void 0 : releaseData.notes;
        if (notes === undefined) {
            this.logger.warn('Failed to find release notes');
        }
        const version = pullRequestTitle.getVersion() || (releaseData === null || releaseData === void 0 ? void 0 : releaseData.version);
        if (!version) {
            this.logger.error('Pull request should have included version');
            return;
        }
        if (!this.isPublishedVersion(version)) {
            this.logger.warn(`Skipping non-published version: ${version.toString()}`);
            return;
        }
        const tag = new tag_name_1.TagName(version, this.includeComponentInTag ? component : undefined, this.tagSeparator, this.includeVInTag);
        const releaseName = component && this.includeComponentInTag
            ? `${component}: v${version.toString()}`
            : `v${version.toString()}`;
        return {
            name: releaseName,
            tag,
            notes: notes || '',
            sha: mergedPullRequest.sha,
        };
    }
    /**
     * Given a merged pull request, build the candidate releases.
     * @param {PullRequest} mergedPullRequest The merged release pull request.
     * @returns {Release} The candidate release.
     */
    async buildReleases(mergedPullRequest, options) {
        const release = await this.buildRelease(mergedPullRequest, options);
        if (release) {
            return [release];
        }
        return [];
    }
    isPublishedVersion(_version) {
        return true;
    }
    /**
     * Override this to handle the initial version of a new library.
     */
    initialReleaseVersion() {
        if (this.initialVersion) {
            return version_1.Version.parse(this.initialVersion);
        }
        return version_1.Version.parse('1.0.0');
    }
    /**
     * Adds a given file path to the strategy path.
     * @param {string} file Desired file path.
     * @returns {string} The file relative to the strategy.
     * @throws {Error} If the file path contains relative pathing characters, i.e. ../, ~/
     */
    addPath(file) {
        // There is no strategy path to join, the strategy is at the root, or the
        // file is at the root (denoted by a leading slash or tilde)
        if (!this.path || this.path === manifest_1.ROOT_PROJECT_PATH || file.startsWith('/')) {
            file = file.replace(/^\/+/, '');
        }
        // Otherwise, the file is relative to the strategy path
        else {
            file = `${this.path.replace(/\/+$/, '')}/${file}`;
        }
        // Ensure the file path does not escape the workspace
        if (/((^|\/)\.{1,2}|^~|^\/*)+\//.test(file)) {
            throw new Error(`illegal pathing characters in path: ${file}`);
        }
        // Strip any trailing slashes and return
        return file.replace(/\/+$/, '');
    }
}
exports.BaseStrategy = BaseStrategy;
//# sourceMappingURL=base.js.map