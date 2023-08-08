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
exports.Rust = void 0;
// Generic
const changelog_1 = require("../updaters/changelog");
// Cargo.toml support
const cargo_toml_1 = require("../updaters/rust/cargo-toml");
const cargo_lock_1 = require("../updaters/rust/cargo-lock");
const common_1 = require("../updaters/rust/common");
const base_1 = require("./base");
const version_1 = require("../version");
class Rust extends base_1.BaseStrategy {
    async buildUpdates(options) {
        var _a, _b, _c;
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
        const workspaceManifest = await this.getPackageManifest();
        const versionsMap = new Map();
        if ((_a = workspaceManifest === null || workspaceManifest === void 0 ? void 0 : workspaceManifest.workspace) === null || _a === void 0 ? void 0 : _a.members) {
            const members = workspaceManifest.workspace.members;
            if ((_b = workspaceManifest.package) === null || _b === void 0 ? void 0 : _b.name) {
                versionsMap.set(workspaceManifest.package.name, version);
            }
            else {
                this.logger.warn('No workspace manifest package name found');
            }
            this.logger.info(`found workspace with ${members.length} members, upgrading all`);
            // Collect submodule names to update
            const manifestsByPath = new Map();
            for (const member of members) {
                const manifestPath = `${member}/Cargo.toml`;
                const manifestContent = await this.getContent(manifestPath);
                if (!manifestContent) {
                    this.logger.warn(`member ${member} declared but did not find Cargo.toml`);
                    continue;
                }
                const manifest = (0, common_1.parseCargoManifest)(manifestContent.parsedContent);
                manifestsByPath.set(manifestPath, manifestContent);
                if (!((_c = manifest.package) === null || _c === void 0 ? void 0 : _c.name)) {
                    this.logger.warn(`member ${member} has no package name`);
                    continue;
                }
                versionsMap.set(manifest.package.name, version);
            }
            this.logger.info(`updating ${manifestsByPath.size} submodules`);
            this.logger.debug('versions map:', versionsMap);
            for (const [manifestPath, manifestContent] of manifestsByPath) {
                updates.push({
                    path: this.addPath(manifestPath),
                    createIfMissing: false,
                    cachedFileContents: manifestContent,
                    updater: new cargo_toml_1.CargoToml({
                        version,
                        versionsMap,
                    }),
                });
            }
            // Update root Cargo.toml
            updates.push({
                path: this.addPath('Cargo.toml'),
                createIfMissing: false,
                updater: new cargo_toml_1.CargoToml({
                    version,
                    versionsMap,
                }),
            });
        }
        else {
            this.logger.info('single crate found, updating Cargo.toml');
            const packageName = await this.getDefaultPackageName();
            if (packageName) {
                versionsMap.set(packageName, version);
            }
            else {
                this.logger.warn('No crate package name found');
            }
            updates.push({
                path: this.addPath('Cargo.toml'),
                createIfMissing: false,
                updater: new cargo_toml_1.CargoToml({
                    version,
                    versionsMap,
                }),
            });
        }
        updates.push({
            path: this.addPath('Cargo.lock'),
            createIfMissing: false,
            updater: new cargo_lock_1.CargoLock(versionsMap),
        });
        return updates;
    }
    initialReleaseVersion() {
        return version_1.Version.parse('0.1.0');
    }
    async getDefaultPackageName() {
        var _a;
        const packageManifest = await this.getPackageManifest();
        if (packageManifest) {
            return (_a = packageManifest.package) === null || _a === void 0 ? void 0 : _a.name;
        }
        return undefined;
    }
    /**
     * @returns the package's manifest, ie. `crates/foobar/Cargo.toml`
     */
    async getPackageManifest() {
        if (this.packageManifest === undefined) {
            this.packageManifest = await this.getManifest('Cargo.toml');
        }
        return this.packageManifest;
    }
    async getContent(path) {
        try {
            return await this.github.getFileContentsOnBranch(this.addPath(path), this.targetBranch);
        }
        catch (e) {
            return null;
        }
    }
    async getManifest(path) {
        const content = await this.getContent(path);
        return content ? (0, common_1.parseCargoManifest)(content.parsedContent) : null;
    }
}
exports.Rust = Rust;
//# sourceMappingURL=rust.js.map