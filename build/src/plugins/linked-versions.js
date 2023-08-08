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
exports.LinkedVersions = void 0;
const plugin_1 = require("../plugin");
const commit_1 = require("../commit");
const factory_1 = require("../factory");
const merge_1 = require("./merge");
const branch_name_1 = require("../util/branch-name");
/**
 * This plugin reconfigures strategies by linking multiple components
 * together.
 *
 * Release notes are broken up using `<summary>`/`<details>` blocks.
 */
class LinkedVersions extends plugin_1.ManifestPlugin {
    constructor(github, targetBranch, repositoryConfig, groupName, components, options = {}) {
        var _a;
        super(github, targetBranch, repositoryConfig, options.logger);
        this.groupName = groupName;
        this.components = new Set(components);
        this.merge = (_a = options.merge) !== null && _a !== void 0 ? _a : true;
    }
    /**
     * Pre-configure strategies.
     * @param {Record<string, Strategy>} strategiesByPath Strategies indexed by path
     * @returns {Record<string, Strategy>} Updated strategies indexed by path
     */
    async preconfigure(strategiesByPath, commitsByPath, releasesByPath) {
        // Find all strategies in the group
        const groupStrategies = {};
        for (const path in strategiesByPath) {
            const strategy = strategiesByPath[path];
            const component = await strategy.getComponent();
            if (!component) {
                continue;
            }
            if (this.components.has(component)) {
                groupStrategies[path] = strategy;
            }
        }
        this.logger.info(`Found ${Object.keys(groupStrategies).length} group components for ${this.groupName}`);
        const groupVersions = {};
        const missingReleasePaths = new Set();
        for (const path in groupStrategies) {
            const strategy = groupStrategies[path];
            const latestRelease = releasesByPath[path];
            const releasePullRequest = await strategy.buildReleasePullRequest((0, commit_1.parseConventionalCommits)(commitsByPath[path], this.logger), latestRelease);
            if (releasePullRequest === null || releasePullRequest === void 0 ? void 0 : releasePullRequest.version) {
                groupVersions[path] = releasePullRequest.version;
            }
            else {
                missingReleasePaths.add(path);
            }
        }
        const versions = Object.values(groupVersions);
        if (versions.length === 0) {
            return strategiesByPath;
        }
        const primaryVersion = versions.reduce((collector, version) => collector.compare(version) > 0 ? collector : version, versions[0]);
        const newStrategies = {};
        for (const path in strategiesByPath) {
            if (path in groupStrategies) {
                const component = await strategiesByPath[path].getComponent();
                this.logger.info(`Replacing strategy for path ${path} with forced version: ${primaryVersion}`);
                newStrategies[path] = await (0, factory_1.buildStrategy)({
                    ...this.repositoryConfig[path],
                    github: this.github,
                    path,
                    targetBranch: this.targetBranch,
                    releaseAs: primaryVersion.toString(),
                });
                if (missingReleasePaths.has(path)) {
                    this.logger.debug(`Appending fake commit for path: ${path}`);
                    commitsByPath[path].push({
                        sha: '',
                        message: `chore(${component}): Synchronize ${this.groupName} versions\n\nRelease-As: ${primaryVersion.toString()}`,
                    });
                }
            }
            else {
                newStrategies[path] = strategiesByPath[path];
            }
        }
        return newStrategies;
    }
    /**
     * Post-process candidate pull requests.
     * @param {CandidateReleasePullRequest[]} pullRequests Candidate pull requests
     * @returns {CandidateReleasePullRequest[]} Updated pull requests
     */
    async run(candidates) {
        if (!this.merge) {
            return candidates;
        }
        const [inScopeCandidates, outOfScopeCandidates] = candidates.reduce((collection, candidate) => {
            if (!candidate.pullRequest.version) {
                this.logger.warn('pull request missing version', candidate);
                collection[1].push(candidate);
                return collection;
            }
            if (this.components.has(candidate.config.component || '')) {
                collection[0].push(candidate);
            }
            else {
                collection[1].push(candidate);
            }
            return collection;
        }, [[], []]);
        this.logger.info(`found ${inScopeCandidates.length} linked-versions candidates`);
        // delegate to the merge plugin and add merged pull request
        if (inScopeCandidates.length > 0) {
            const merge = new merge_1.Merge(this.github, this.targetBranch, this.repositoryConfig, {
                pullRequestTitlePattern: `chore\${scope}: release ${this.groupName} libraries`,
                forceMerge: true,
                headBranchName: branch_name_1.BranchName.ofGroupTargetBranch(this.groupName, this.targetBranch).toString(),
            });
            const merged = await merge.run(inScopeCandidates);
            outOfScopeCandidates.push(...merged);
        }
        return outOfScopeCandidates;
    }
}
exports.LinkedVersions = LinkedVersions;
//# sourceMappingURL=linked-versions.js.map