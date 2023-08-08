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
exports.GitHubChangelogNotes = void 0;
class GitHubChangelogNotes {
    constructor(github) {
        this.github = github;
    }
    async buildNotes(_commits, options) {
        const body = await this.github.generateReleaseNotes(options.currentTag, options.targetBranch, options.previousTag);
        const date = new Date().toLocaleDateString('en-CA');
        const header = `## ${options.version} (${date})`;
        return `${header}\n\n${body}`;
    }
}
exports.GitHubChangelogNotes = GitHubChangelogNotes;
//# sourceMappingURL=github.js.map