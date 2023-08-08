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
exports.PHP = void 0;
// Generic
const changelog_1 = require("../updaters/changelog");
// PHP Specific.
const root_composer_update_packages_1 = require("../updaters/php/root-composer-update-packages");
const base_1 = require("./base");
const CHANGELOG_SECTIONS = [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance Improvements' },
    { type: 'revert', section: 'Reverts' },
    { type: 'chore', section: 'Miscellaneous Chores' },
    { type: 'docs', section: 'Documentation', hidden: true },
    { type: 'style', section: 'Styles', hidden: true },
    { type: 'refactor', section: 'Code Refactoring', hidden: true },
    { type: 'test', section: 'Tests', hidden: true },
    { type: 'build', section: 'Build System', hidden: true },
    { type: 'ci', section: 'Continuous Integration', hidden: true },
];
class PHP extends base_1.BaseStrategy {
    constructor(options) {
        var _a;
        options.changelogSections = (_a = options.changelogSections) !== null && _a !== void 0 ? _a : CHANGELOG_SECTIONS;
        super(options);
    }
    async buildUpdates(options) {
        const updates = [];
        const version = options.newVersion;
        const versionsMap = new Map();
        versionsMap.set('version', version);
        updates.push({
            path: this.addPath(this.changelogPath),
            createIfMissing: true,
            updater: new changelog_1.Changelog({
                version,
                changelogEntry: options.changelogEntry,
            }),
        });
        // update composer.json
        updates.push({
            path: this.addPath('composer.json'),
            createIfMissing: false,
            updater: new root_composer_update_packages_1.RootComposerUpdatePackages({
                version,
                versionsMap,
            }),
        });
        return updates;
    }
}
exports.PHP = PHP;
//# sourceMappingURL=php.js.map