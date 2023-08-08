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
exports.ManifestPlugin = void 0;
const logger_1 = require("./util/logger");
/**
 * A plugin runs after a repository manifest has built candidate
 * pull requests and can make updates that span across multiple
 * components. A plugin *might* choose to merge pull requests or add
 * or update existing files.
 */
class ManifestPlugin {
    constructor(github, targetBranch, repositoryConfig, logger = logger_1.logger) {
        this.github = github;
        this.targetBranch = targetBranch;
        this.repositoryConfig = repositoryConfig;
        this.logger = logger;
    }
    /**
     * Perform post-processing on commits, e.g, sentence casing them.
     * @param {Commit[]} commits The set of commits that will feed into release pull request.
     * @returns {Commit[]} The modified commit objects.
     */
    processCommits(commits) {
        return commits;
    }
    /**
     * Post-process candidate pull requests.
     * @param {CandidateReleasePullRequest[]} pullRequests Candidate pull requests
     * @returns {CandidateReleasePullRequest[]} Updated pull requests
     */
    async run(pullRequests) {
        return pullRequests;
    }
    /**
     * Pre-configure strategies.
     * @param {Record<string, Strategy>} strategiesByPath Strategies indexed by path
     * @returns {Record<string, Strategy>} Updated strategies indexed by path
     */
    async preconfigure(strategiesByPath, _commitsByPath, _releasesByPath) {
        return strategiesByPath;
    }
}
exports.ManifestPlugin = ManifestPlugin;
//# sourceMappingURL=plugin.js.map