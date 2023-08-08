"use strict";
// Copyright 2023 Google LLC
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
exports.CommitExclude = void 0;
const manifest_1 = require("../manifest");
const commit_utils_1 = require("./commit-utils");
class CommitExclude {
    constructor(config) {
        this.excludePaths = {};
        Object.entries(config).forEach(([path, releaseConfig]) => {
            if (releaseConfig.excludePaths) {
                this.excludePaths[path] = (0, commit_utils_1.normalizePaths)(releaseConfig.excludePaths);
            }
        });
    }
    excludeCommits(commitsPerPath) {
        const filteredCommitsPerPath = {};
        Object.entries(commitsPerPath).forEach(([path, commits]) => {
            if (this.excludePaths[path]) {
                commits = commits.filter(commit => this.shouldInclude(commit, this.excludePaths[path], path));
            }
            filteredCommitsPerPath[path] = commits;
        });
        return filteredCommitsPerPath;
    }
    shouldInclude(commit, excludePaths, packagePath) {
        return (!commit.files ||
            !commit.files
                .filter(file => this.isRelevant(file, packagePath))
                .every(file => excludePaths.some(path => this.isRelevant(file, path))));
    }
    isRelevant(file, path) {
        return path === manifest_1.ROOT_PROJECT_PATH || file.indexOf(`${path}/`) === 0;
    }
}
exports.CommitExclude = CommitExclude;
//# sourceMappingURL=commit-exclude.js.map