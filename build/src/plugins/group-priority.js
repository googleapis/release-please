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
exports.GroupPriority = void 0;
const plugin_1 = require("../plugin");
/**
 * This plugin allows configuring a priority of release groups. For example, you could
 * prioritize Java snapshot pull requests over other releases.
 */
class GroupPriority extends plugin_1.ManifestPlugin {
    /**
     * Instantiate a new GroupPriority plugin.
     *
     * @param {GitHub} github GitHub client
     * @param {string} targetBranch Release branch
     * @param {RepositoryConfig} repositoryConfig Parsed configuration for the entire
     *   repository. This allows plugins to know how components interact.
     * @param {string[]} groups List of group names ordered with highest priority first
     */
    constructor(github, targetBranch, repositoryConfig, groups) {
        super(github, targetBranch, repositoryConfig);
        this.groups = groups;
    }
    /**
     * Group candidate release PRs by grouping and check our list of preferred
     * groups in order. If a preferred group is found, only return pull requests for
     * that group.
     * @param {CandidateReleasePullRequest[]} pullRequests Candidate pull requests
     * @returns {CandidateReleasePullRequest[]} Possibly a subset of the candidate
     *   pull requests if a preferred group is found.
     */
    async run(pullRequests) {
        this.logger.debug(`Group priority plugin running with groups: ${this.groups}`);
        const groupedCandidates = groupCandidatesByType(pullRequests);
        for (const group of this.groups) {
            this.logger.debug(`Considering group: ${group}`);
            const groupCandidates = groupedCandidates.get(group);
            if (groupCandidates) {
                this.logger.debug(`Found preferred group: ${group} with ${groupCandidates.length} candidate pull requests`);
                return groupCandidates;
            }
        }
        // fallback to returning all candidates
        this.logger.debug('No preferred group found, returning full set.');
        return pullRequests;
    }
}
exports.GroupPriority = GroupPriority;
/**
 * Helper to group candidates by their `type` field.
 * @param {CandidateReleasePullRequest[]} inScopeCandidates The candidates to group.
 * @returns {Map<string|undefined, CandidateReleasePullRequest[]>} The grouped
 *   pull requests.
 */
function groupCandidatesByType(inScopeCandidates) {
    const groupedCandidates = new Map();
    for (const candidatePullRequest of inScopeCandidates) {
        const candidates = groupedCandidates.get(candidatePullRequest.pullRequest.group);
        if (candidates) {
            candidates.push(candidatePullRequest);
        }
        else {
            groupedCandidates.set(candidatePullRequest.pullRequest.group, [
                candidatePullRequest,
            ]);
        }
    }
    return groupedCandidates;
}
//# sourceMappingURL=group-priority.js.map