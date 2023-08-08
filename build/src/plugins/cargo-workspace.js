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
exports.CargoWorkspace = void 0;
const manifest_1 = require("../manifest");
const workspace_1 = require("./workspace");
const common_1 = require("../updaters/rust/common");
const version_1 = require("../version");
const cargo_toml_1 = require("../updaters/rust/cargo-toml");
const raw_content_1 = require("../updaters/raw-content");
const changelog_1 = require("../updaters/changelog");
const pull_request_title_1 = require("../util/pull-request-title");
const pull_request_body_1 = require("../util/pull-request-body");
const branch_name_1 = require("../util/branch-name");
const versioning_strategy_1 = require("../versioning-strategy");
const cargo_lock_1 = require("../updaters/rust/cargo-lock");
const errors_1 = require("../errors");
/**
 * The plugin analyzed a cargo workspace and will bump dependencies
 * of managed packages if those dependencies are being updated.
 *
 * If multiple rust packages are being updated, it will merge them
 * into a single rust package.
 */
class CargoWorkspace extends workspace_1.WorkspacePlugin {
    async buildAllPackages(candidates) {
        var _a, _b, _c, _d;
        const cargoManifestContent = await this.github.getFileContentsOnBranch('Cargo.toml', this.targetBranch);
        const cargoManifest = (0, common_1.parseCargoManifest)(cargoManifestContent.parsedContent);
        if (!((_a = cargoManifest.workspace) === null || _a === void 0 ? void 0 : _a.members)) {
            this.logger.warn("cargo-workspace plugin used, but top-level Cargo.toml isn't a cargo workspace");
            return { allPackages: [], candidatesByPackage: {} };
        }
        const allCrates = [];
        const candidatesByPackage = {};
        const members = (await Promise.all(cargoManifest.workspace.members.map(member => this.github.findFilesByGlobAndRef(member, this.targetBranch)))).flat();
        members.push(manifest_1.ROOT_PROJECT_PATH);
        for (const path of members) {
            const manifestPath = (0, workspace_1.addPath)(path, 'Cargo.toml');
            this.logger.info(`looking for candidate with path: ${path}`);
            const candidate = candidates.find(c => c.path === path);
            // get original content of the crate
            const manifestContent = ((_b = candidate === null || candidate === void 0 ? void 0 : candidate.pullRequest.updates.find(update => update.path === manifestPath)) === null || _b === void 0 ? void 0 : _b.cachedFileContents) ||
                (await this.github.getFileContentsOnBranch(manifestPath, this.targetBranch));
            const manifest = (0, common_1.parseCargoManifest)(manifestContent.parsedContent);
            const packageName = (_c = manifest.package) === null || _c === void 0 ? void 0 : _c.name;
            if (!packageName) {
                this.logger.warn(`package manifest at ${manifestPath} is missing [package.name]`);
                continue;
            }
            if (candidate) {
                candidatesByPackage[packageName] = candidate;
            }
            const version = (_d = manifest.package) === null || _d === void 0 ? void 0 : _d.version;
            if (!version) {
                throw new errors_1.ConfigurationError(`package manifest at ${manifestPath} is missing [package.version]`, 'cargo-workspace', `${this.github.repository.owner}/${this.github.repository.repo}`);
            }
            else if (typeof version !== 'string') {
                throw new errors_1.ConfigurationError(`package manifest at ${manifestPath} has an invalid [package.version]`, 'cargo-workspace', `${this.github.repository.owner}/${this.github.repository.repo}`);
            }
            allCrates.push({
                path,
                name: packageName,
                version,
                manifest,
                manifestContent: manifestContent.parsedContent,
                manifestPath,
            });
        }
        return {
            allPackages: allCrates,
            candidatesByPackage,
        };
    }
    bumpVersion(pkg) {
        const version = version_1.Version.parse(pkg.version);
        return new versioning_strategy_1.PatchVersionUpdate().bump(version);
    }
    updateCandidate(existingCandidate, pkg, updatedVersions) {
        const version = updatedVersions.get(pkg.name);
        if (!version) {
            throw new Error(`Didn't find updated version for ${pkg.name}`);
        }
        const updater = new cargo_toml_1.CargoToml({
            version,
            versionsMap: updatedVersions,
        });
        const updatedContent = updater.updateContent(pkg.manifestContent);
        const originalManifest = (0, common_1.parseCargoManifest)(pkg.manifestContent);
        const updatedManifest = (0, common_1.parseCargoManifest)(updatedContent);
        const dependencyNotes = getChangelogDepsNotes(originalManifest, updatedManifest);
        existingCandidate.pullRequest.updates =
            existingCandidate.pullRequest.updates.map(update => {
                if (update.path === (0, workspace_1.addPath)(existingCandidate.path, 'Cargo.toml')) {
                    update.updater = new raw_content_1.RawContent(updatedContent);
                }
                else if (update.updater instanceof changelog_1.Changelog && dependencyNotes) {
                    update.updater.changelogEntry = (0, workspace_1.appendDependenciesSectionToChangelog)(update.updater.changelogEntry, dependencyNotes, this.logger);
                }
                else if (update.path === (0, workspace_1.addPath)(existingCandidate.path, 'Cargo.lock')) {
                    update.updater = new cargo_lock_1.CargoLock(updatedVersions);
                }
                return update;
            });
        // append dependency notes
        if (dependencyNotes) {
            if (existingCandidate.pullRequest.body.releaseData.length > 0) {
                existingCandidate.pullRequest.body.releaseData[0].notes =
                    (0, workspace_1.appendDependenciesSectionToChangelog)(existingCandidate.pullRequest.body.releaseData[0].notes, dependencyNotes, this.logger);
            }
            else {
                existingCandidate.pullRequest.body.releaseData.push({
                    component: pkg.name,
                    version: existingCandidate.pullRequest.version,
                    notes: (0, workspace_1.appendDependenciesSectionToChangelog)('', dependencyNotes, this.logger),
                });
            }
        }
        return existingCandidate;
    }
    newCandidate(pkg, updatedVersions) {
        const version = updatedVersions.get(pkg.name);
        if (!version) {
            throw new Error(`Didn't find updated version for ${pkg.name}`);
        }
        const updater = new cargo_toml_1.CargoToml({
            version,
            versionsMap: updatedVersions,
        });
        const updatedContent = updater.updateContent(pkg.manifestContent);
        const originalManifest = (0, common_1.parseCargoManifest)(pkg.manifestContent);
        const updatedManifest = (0, common_1.parseCargoManifest)(updatedContent);
        const dependencyNotes = getChangelogDepsNotes(originalManifest, updatedManifest);
        const pullRequest = {
            title: pull_request_title_1.PullRequestTitle.ofTargetBranch(this.targetBranch),
            body: new pull_request_body_1.PullRequestBody([
                {
                    component: pkg.name,
                    version,
                    notes: (0, workspace_1.appendDependenciesSectionToChangelog)('', dependencyNotes, this.logger),
                },
            ]),
            updates: [
                {
                    path: (0, workspace_1.addPath)(pkg.path, 'Cargo.toml'),
                    createIfMissing: false,
                    updater: new raw_content_1.RawContent(updatedContent),
                },
                {
                    path: (0, workspace_1.addPath)(pkg.path, 'CHANGELOG.md'),
                    createIfMissing: false,
                    updater: new changelog_1.Changelog({
                        version,
                        changelogEntry: dependencyNotes,
                    }),
                },
            ],
            labels: [],
            headRefName: branch_name_1.BranchName.ofTargetBranch(this.targetBranch).toString(),
            version,
            draft: false,
        };
        return {
            path: pkg.path,
            pullRequest,
            config: {
                releaseType: 'rust',
            },
        };
    }
    postProcessCandidates(candidates, updatedVersions) {
        let rootCandidate = candidates.find(c => c.path === manifest_1.ROOT_PROJECT_PATH);
        if (!rootCandidate) {
            this.logger.warn('Unable to find root candidate pull request');
            rootCandidate = candidates.find(c => c.config.releaseType === 'rust');
        }
        if (!rootCandidate) {
            this.logger.warn('Unable to find a rust candidate pull request');
            return candidates;
        }
        // Update the root Cargo.lock if it exists
        rootCandidate.pullRequest.updates.push({
            path: 'Cargo.lock',
            createIfMissing: false,
            updater: new cargo_lock_1.CargoLock(updatedVersions),
        });
        return candidates;
    }
    async buildGraph(allPackages) {
        var _a, _b, _c, _d, _e, _f;
        const workspaceCrateNames = new Set(allPackages.map(crateInfo => crateInfo.name));
        const graph = new Map();
        for (const crateInfo of allPackages) {
            const allDeps = Object.keys({
                ...((_a = crateInfo.manifest.dependencies) !== null && _a !== void 0 ? _a : {}),
                ...((_b = crateInfo.manifest['dev-dependencies']) !== null && _b !== void 0 ? _b : {}),
                ...((_c = crateInfo.manifest['build-dependencies']) !== null && _c !== void 0 ? _c : {}),
            });
            const targets = crateInfo.manifest.target;
            if (targets) {
                for (const targetName in targets) {
                    const target = targets[targetName];
                    allDeps.push(...Object.keys({
                        ...((_d = target.dependencies) !== null && _d !== void 0 ? _d : {}),
                        ...((_e = target['dev-dependencies']) !== null && _e !== void 0 ? _e : {}),
                        ...((_f = target['build-dependencies']) !== null && _f !== void 0 ? _f : {}),
                    }));
                }
            }
            const workspaceDeps = allDeps.filter(dep => workspaceCrateNames.has(dep));
            graph.set(crateInfo.name, {
                deps: workspaceDeps,
                value: crateInfo,
            });
        }
        return graph;
    }
    inScope(candidate) {
        return candidate.config.releaseType === 'rust';
    }
    packageNameFromPackage(pkg) {
        return pkg.name;
    }
    pathFromPackage(pkg) {
        return pkg.path;
    }
}
exports.CargoWorkspace = CargoWorkspace;
function getChangelogDepsNotes(originalManifest, updatedManifest) {
    let depUpdateNotes = '';
    const depTypes = [
        'dependencies',
        'dev-dependencies',
        'build-dependencies',
    ];
    const depVer = (s) => {
        if (s === undefined) {
            return undefined;
        }
        if (typeof s === 'string') {
            return s;
        }
        else {
            return s.version;
        }
    };
    const getDepMap = (cargoDeps) => {
        const result = {};
        for (const [key, val] of Object.entries(cargoDeps)) {
            const ver = depVer(val);
            if (ver) {
                result[key] = ver;
            }
        }
        return result;
    };
    const populateUpdates = (originalScope, updatedScope, updates) => {
        var _a;
        for (const depType of depTypes) {
            const depUpdates = [];
            const pkgDepTypes = updatedScope[depType];
            if (pkgDepTypes === undefined) {
                continue;
            }
            for (const [depName, currentDepVer] of Object.entries(getDepMap(pkgDepTypes))) {
                const origDepVer = depVer((_a = originalScope[depType]) === null || _a === void 0 ? void 0 : _a[depName]);
                if (currentDepVer !== origDepVer) {
                    depUpdates.push(`\n    * ${depName} bumped from ${origDepVer} to ${currentDepVer}`);
                }
            }
            if (depUpdates.length > 0) {
                const updatesForType = updates.get(depType) || new Set();
                depUpdates.forEach(update => updatesForType.add(update));
                updates.set(depType, updatesForType);
            }
        }
    };
    const updates = new Map();
    populateUpdates(originalManifest, updatedManifest, updates);
    if (updatedManifest.target && originalManifest.target) {
        for (const targetName in updatedManifest.target) {
            populateUpdates(originalManifest.target[targetName], updatedManifest.target[targetName], updates);
        }
    }
    for (const [dt, notes] of updates) {
        depUpdateNotes += `\n  * ${dt}`;
        for (const note of notes) {
            depUpdateNotes += note;
        }
    }
    if (depUpdateNotes) {
        return `* The following workspace dependencies were updated${depUpdateNotes}`;
    }
    return '';
}
//# sourceMappingURL=cargo-workspace.js.map