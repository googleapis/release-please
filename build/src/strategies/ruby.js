"use strict";
// Copyright 2019 Google LLC
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
exports.Ruby = void 0;
const indent_commit_1 = require("../util/indent-commit");
// Generic
const changelog_1 = require("../updaters/changelog");
// Ruby
const version_rb_1 = require("../updaters/ruby/version-rb");
const gemfile_lock_1 = require("../updaters/ruby/gemfile-lock");
const base_1 = require("./base");
class Ruby extends base_1.BaseStrategy {
    constructor(options) {
        var _a;
        super(options);
        this.versionFile = (_a = options.versionFile) !== null && _a !== void 0 ? _a : '';
        this.tagSeparator = '/';
    }
    async buildUpdates(options) {
        const updates = [];
        const version = options.newVersion;
        updates.push({
            path: this.addPath(this.changelogPath),
            createIfMissing: true,
            updater: new changelog_1.Changelog({
                version,
                changelogEntry: options.changelogEntry,
            }),
        });
        const versionFile = this.versionFile
            ? this.versionFile
            : `lib/${(this.component || '').replace(/-/g, '/')}/version.rb`;
        updates.push({
            path: this.addPath(versionFile),
            createIfMissing: false,
            updater: new version_rb_1.VersionRB({
                version,
            }),
        });
        updates.push({
            path: this.addPath('Gemfile.lock'),
            createIfMissing: false,
            updater: new gemfile_lock_1.GemfileLock({
                version,
                gemName: this.component || '',
            }),
        });
        return updates;
    }
    async postProcessCommits(commits) {
        commits.forEach(commit => {
            commit.message = (0, indent_commit_1.indentCommit)(commit);
        });
        return commits;
    }
}
exports.Ruby = Ruby;
//# sourceMappingURL=ruby.js.map