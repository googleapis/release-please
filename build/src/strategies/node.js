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
exports.Node = void 0;
const base_1 = require("./base");
const changelog_json_1 = require("../updaters/changelog-json");
const package_lock_json_1 = require("../updaters/node/package-lock-json");
const samples_package_json_1 = require("../updaters/node/samples-package-json");
const changelog_1 = require("../updaters/changelog");
const package_json_1 = require("../updaters/node/package-json");
const errors_1 = require("../errors");
const filter_commits_1 = require("../util/filter-commits");
class Node extends base_1.BaseStrategy {
    async buildUpdates(options) {
        var _a;
        const updates = [];
        const version = options.newVersion;
        const packageName = (_a = (await this.getPackageName())) !== null && _a !== void 0 ? _a : '';
        const lockFiles = ['package-lock.json', 'npm-shrinkwrap.json'];
        lockFiles.forEach(lockFile => {
            updates.push({
                path: this.addPath(lockFile),
                createIfMissing: false,
                updater: new package_lock_json_1.PackageLockJson({
                    version,
                }),
            });
        });
        updates.push({
            path: this.addPath('samples/package.json'),
            createIfMissing: false,
            updater: new samples_package_json_1.SamplesPackageJson({
                version,
                packageName,
            }),
        });
        updates.push({
            path: this.addPath(this.changelogPath),
            createIfMissing: true,
            updater: new changelog_1.Changelog({
                version,
                changelogEntry: options.changelogEntry,
            }),
        });
        updates.push({
            path: this.addPath('package.json'),
            createIfMissing: false,
            cachedFileContents: this.pkgJsonContents,
            updater: new package_json_1.PackageJson({
                version,
            }),
        });
        // If a machine readable changelog.json exists update it:
        if (options.commits && packageName) {
            const commits = (0, filter_commits_1.filterCommits)(options.commits, this.changelogSections);
            updates.push({
                path: 'changelog.json',
                createIfMissing: false,
                updater: new changelog_json_1.ChangelogJson({
                    artifactName: packageName,
                    version,
                    commits,
                    language: 'JAVASCRIPT',
                }),
            });
        }
        return updates;
    }
    async getDefaultPackageName() {
        const pkgJsonContents = await this.getPkgJsonContents();
        const pkg = JSON.parse(pkgJsonContents.parsedContent);
        return pkg.name;
    }
    normalizeComponent(component) {
        if (!component) {
            return '';
        }
        return component.match(/^@[\w-]+\//) ? component.split('/')[1] : component;
    }
    async getPkgJsonContents() {
        if (!this.pkgJsonContents) {
            try {
                this.pkgJsonContents = await this.github.getFileContentsOnBranch(this.addPath('package.json'), this.targetBranch);
            }
            catch (e) {
                if (e instanceof errors_1.FileNotFoundError) {
                    throw new errors_1.MissingRequiredFileError(this.addPath('package.json'), 'node', `${this.repository.owner}/${this.repository.repo}`);
                }
                throw e;
            }
        }
        return this.pkgJsonContents;
    }
}
exports.Node = Node;
//# sourceMappingURL=node.js.map