"use strict";
// Copyright 2022 Google LLC
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
exports.Java = void 0;
const base_1 = require("./base");
const changelog_1 = require("../updaters/changelog");
const java_snapshot_1 = require("../versioning-strategies/java-snapshot");
const pull_request_title_1 = require("../util/pull-request-title");
const branch_name_1 = require("../util/branch-name");
const pull_request_body_1 = require("../util/pull-request-body");
const default_1 = require("../versioning-strategies/default");
const java_add_snapshot_1 = require("../versioning-strategies/java-add-snapshot");
const manifest_1 = require("../manifest");
const java_released_1 = require("../updaters/java/java-released");
const composite_1 = require("../updaters/composite");
const logger_1 = require("../util/logger");
const CHANGELOG_SECTIONS = [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance Improvements' },
    { type: 'deps', section: 'Dependencies' },
    { type: 'revert', section: 'Reverts' },
    { type: 'docs', section: 'Documentation' },
    { type: 'style', section: 'Styles', hidden: true },
    { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
    { type: 'refactor', section: 'Code Refactoring', hidden: true },
    { type: 'test', section: 'Tests', hidden: true },
    { type: 'build', section: 'Build System', hidden: true },
    { type: 'ci', section: 'Continuous Integration', hidden: true },
];
/**
 * A strategy that generates SNAPSHOT version after each release, which is standard especially in Maven projects.
 *
 * This is universal strategy that does not update any files on its own. Use maven strategy for Maven projects.
 */
class Java extends base_1.BaseStrategy {
    constructor(options) {
        var _a, _b, _c;
        options.changelogSections = (_a = options.changelogSections) !== null && _a !== void 0 ? _a : CHANGELOG_SECTIONS;
        // wrap the configured versioning strategy with snapshotting
        const parentVersioningStrategy = options.versioningStrategy ||
            new default_1.DefaultVersioningStrategy({ logger: (_b = options.logger) !== null && _b !== void 0 ? _b : logger_1.logger });
        options.versioningStrategy = new java_snapshot_1.JavaSnapshot(parentVersioningStrategy);
        super(options);
        this.snapshotVersioning = new java_add_snapshot_1.JavaAddSnapshot(parentVersioningStrategy);
        this.snapshotLabels = options.snapshotLabels || manifest_1.DEFAULT_SNAPSHOT_LABELS;
        this.skipSnapshot = (_c = options.skipSnapshot) !== null && _c !== void 0 ? _c : false;
    }
    async buildReleasePullRequest(commits, latestRelease, draft, labels = []) {
        if (await this.needsSnapshot(commits, latestRelease)) {
            this.logger.info('Repository needs a snapshot bump.');
            return await this.buildSnapshotPullRequest(latestRelease, draft, this.snapshotLabels);
        }
        this.logger.info('No Java snapshot needed');
        return await super.buildReleasePullRequest(commits, latestRelease, draft, labels);
    }
    async buildSnapshotPullRequest(latestRelease, draft, labels = []) {
        const component = await this.getComponent();
        const newVersion = latestRelease
            ? await this.snapshotVersioning.bump(latestRelease.tag.version, [])
            : this.initialReleaseVersion();
        const versionsMap = await this.buildVersionsMap([]);
        for (const [component, version] of versionsMap.entries()) {
            versionsMap.set(component, await this.snapshotVersioning.bump(version, []));
        }
        const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofComponentTargetBranchVersion(component || '', this.targetBranch, newVersion);
        const branchName = component
            ? branch_name_1.BranchName.ofComponentTargetBranch(component, this.targetBranch)
            : branch_name_1.BranchName.ofTargetBranch(this.targetBranch);
        const notes = '### Updating meta-information for bleeding-edge SNAPSHOT release.';
        // TODO use pullrequest header here?
        const pullRequestBody = new pull_request_body_1.PullRequestBody([
            {
                component,
                version: newVersion,
                notes,
            },
        ]);
        const updates = await this.buildUpdates({
            newVersion,
            versionsMap,
            changelogEntry: notes,
            isSnapshot: true,
            commits: [],
        });
        const updatesWithExtras = (0, composite_1.mergeUpdates)(updates.concat(...(await this.extraFileUpdates(newVersion, versionsMap))));
        return {
            title: pullRequestTitle,
            body: pullRequestBody,
            updates: updatesWithExtras,
            labels: [...labels, ...this.extraLabels],
            headRefName: branchName.toString(),
            version: newVersion,
            draft: draft !== null && draft !== void 0 ? draft : false,
            group: 'snapshot',
        };
    }
    isPublishedVersion(version) {
        return !version.preRelease || version.preRelease.indexOf('SNAPSHOT') < 0;
    }
    async needsSnapshot(commits, latestRelease) {
        var _a;
        if (this.skipSnapshot) {
            return false;
        }
        const component = await this.getComponent();
        this.logger.debug('component:', component);
        const version = (_a = latestRelease === null || latestRelease === void 0 ? void 0 : latestRelease.tag) === null || _a === void 0 ? void 0 : _a.version;
        if (!version) {
            // Don't bump snapshots for the first release ever
            return false;
        }
        // Found snapshot as a release, this is unexpected, but use it
        if (!this.isPublishedVersion(version)) {
            return false;
        }
        // Search commits for snapshot bump
        const pullRequests = commits
            .map(commit => {
            var _a;
            return pull_request_title_1.PullRequestTitle.parse(((_a = commit.pullRequest) === null || _a === void 0 ? void 0 : _a.title) || commit.message, this.pullRequestTitlePattern, this.logger);
        })
            .filter(pullRequest => pullRequest);
        const snapshotCommits = pullRequests
            .filter(pullRequest => ((pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.component) || '') === component)
            .map(pullRequest => pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.getVersion())
            .filter(version => version && !this.isPublishedVersion(version));
        return snapshotCommits.length === 0;
    }
    async buildUpdates(options) {
        const version = options.newVersion;
        const versionsMap = options.versionsMap;
        const updates = [];
        if (!options.isSnapshot) {
            // Append java-specific updater for extraFiles
            this.extraFiles.forEach(extraFile => {
                if (typeof extraFile === 'string') {
                    updates.push({
                        path: this.addPath(extraFile),
                        createIfMissing: false,
                        updater: new java_released_1.JavaReleased({ version, versionsMap }),
                    });
                }
            });
            // Update changelog
            updates.push({
                path: this.addPath(this.changelogPath),
                createIfMissing: true,
                updater: new changelog_1.Changelog({
                    version,
                    changelogEntry: options.changelogEntry,
                }),
            });
        }
        return updates;
    }
}
exports.Java = Java;
//# sourceMappingURL=java.js.map