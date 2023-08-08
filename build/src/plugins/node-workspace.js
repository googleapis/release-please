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
exports.NodeWorkspace = void 0;
const package_graph_1 = require("@lerna/package-graph");
const package_1 = require("@lerna/package");
const version_1 = require("../version");
const raw_content_1 = require("../updaters/raw-content");
const pull_request_title_1 = require("../util/pull-request-title");
const pull_request_body_1 = require("../util/pull-request-body");
const branch_name_1 = require("../util/branch-name");
const json_stringify_1 = require("../util/json-stringify");
const changelog_1 = require("../updaters/changelog");
const workspace_1 = require("./workspace");
const versioning_strategy_1 = require("../versioning-strategy");
class Package extends package_1.Package {
    constructor(rawContent, location, pkg) {
        super(pkg !== null && pkg !== void 0 ? pkg : JSON.parse(rawContent), location);
        this.rawContent = rawContent;
    }
    clone() {
        return new Package(this.rawContent, this.location, this.toJSON());
    }
}
/**
 * The plugin analyzed a cargo workspace and will bump dependencies
 * of managed packages if those dependencies are being updated.
 *
 * If multiple node packages are being updated, it will merge them
 * into a single node package.
 */
class NodeWorkspace extends workspace_1.WorkspacePlugin {
    constructor(github, targetBranch, repositoryConfig, options = {}) {
        super(github, targetBranch, repositoryConfig, options);
        this.alwaysLinkLocal = options.alwaysLinkLocal === false ? false : true;
    }
    async buildAllPackages(candidates) {
        const candidatesByPath = new Map();
        for (const candidate of candidates) {
            candidatesByPath.set(candidate.path, candidate);
        }
        const candidatesByPackage = {};
        const packagesByPath = new Map();
        for (const path in this.repositoryConfig) {
            const config = this.repositoryConfig[path];
            if (config.releaseType !== 'node') {
                continue;
            }
            const candidate = candidatesByPath.get(path);
            if (candidate) {
                this.logger.debug(`Found candidate pull request for path: ${candidate.path}`);
                const packagePath = (0, workspace_1.addPath)(candidate.path, 'package.json');
                const packageUpdate = candidate.pullRequest.updates.find(update => update.path === packagePath);
                if (packageUpdate === null || packageUpdate === void 0 ? void 0 : packageUpdate.cachedFileContents) {
                    const pkg = new Package(packageUpdate.cachedFileContents.parsedContent, candidate.path);
                    packagesByPath.set(candidate.path, pkg);
                    candidatesByPackage[pkg.name] = candidate;
                }
                else {
                    const contents = await this.github.getFileContentsOnBranch(packagePath, this.targetBranch);
                    const pkg = new Package(contents.parsedContent, candidate.path);
                    packagesByPath.set(candidate.path, pkg);
                    candidatesByPackage[pkg.name] = candidate;
                }
            }
            else {
                const packagePath = (0, workspace_1.addPath)(path, 'package.json');
                this.logger.debug(`No candidate pull request for path: ${path} - inspect package from ${packagePath}`);
                const contents = await this.github.getFileContentsOnBranch(packagePath, this.targetBranch);
                packagesByPath.set(path, new Package(contents.parsedContent, path));
            }
        }
        const allPackages = Array.from(packagesByPath.values());
        this.packageGraph = new package_graph_1.PackageGraph(allPackages, 'allDependencies', this.alwaysLinkLocal);
        return {
            allPackages,
            candidatesByPackage,
        };
    }
    bumpVersion(pkg) {
        const version = version_1.Version.parse(pkg.version);
        return new versioning_strategy_1.PatchVersionUpdate().bump(version);
    }
    updateCandidate(existingCandidate, pkg, updatedVersions) {
        var _a, _b;
        const graphPackage = (_a = this.packageGraph) === null || _a === void 0 ? void 0 : _a.get(pkg.name);
        if (!graphPackage) {
            throw new Error(`Could not find graph package for ${pkg.name}`);
        }
        const updatedPackage = pkg.clone();
        // Update version of the package
        const newVersion = updatedVersions.get(updatedPackage.name);
        if (newVersion) {
            this.logger.info(`Updating ${updatedPackage.name} to ${newVersion}`);
            updatedPackage.version = newVersion.toString();
        }
        // Update dependency versions
        for (const [depName, resolved] of graphPackage.localDependencies) {
            const depVersion = updatedVersions.get(depName);
            if (depVersion && resolved.type !== 'directory') {
                const currentVersion = (_b = this.combineDeps(pkg)) === null || _b === void 0 ? void 0 : _b[depName];
                const prefix = currentVersion
                    ? this.detectRangePrefix(currentVersion)
                    : '';
                updatedPackage.updateLocalDependency(resolved, depVersion.toString(), prefix);
                this.logger.info(`${pkg.name}.${depName} updated to ${prefix}${depVersion.toString()}`);
            }
        }
        const dependencyNotes = getChangelogDepsNotes(pkg, updatedPackage, updatedVersions);
        existingCandidate.pullRequest.updates =
            existingCandidate.pullRequest.updates.map(update => {
                if (update.path === (0, workspace_1.addPath)(existingCandidate.path, 'package.json')) {
                    update.updater = new raw_content_1.RawContent((0, json_stringify_1.jsonStringify)(updatedPackage.toJSON(), updatedPackage.rawContent));
                }
                else if (update.updater instanceof changelog_1.Changelog) {
                    if (dependencyNotes) {
                        update.updater.changelogEntry =
                            (0, workspace_1.appendDependenciesSectionToChangelog)(update.updater.changelogEntry, dependencyNotes, this.logger);
                    }
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
                    component: updatedPackage.name,
                    version: existingCandidate.pullRequest.version,
                    notes: (0, workspace_1.appendDependenciesSectionToChangelog)('', dependencyNotes, this.logger),
                });
            }
        }
        return existingCandidate;
    }
    newCandidate(pkg, updatedVersions) {
        var _a, _b;
        const graphPackage = (_a = this.packageGraph) === null || _a === void 0 ? void 0 : _a.get(pkg.name);
        if (!graphPackage) {
            throw new Error(`Could not find graph package for ${pkg.name}`);
        }
        const updatedPackage = pkg.clone();
        // Update version of the package
        const newVersion = updatedVersions.get(updatedPackage.name);
        if (newVersion) {
            this.logger.info(`Updating ${updatedPackage.name} to ${newVersion}`);
            updatedPackage.version = newVersion.toString();
        }
        for (const [depName, resolved] of graphPackage.localDependencies) {
            const depVersion = updatedVersions.get(depName);
            if (depVersion && resolved.type !== 'directory') {
                const currentVersion = (_b = this.combineDeps(pkg)) === null || _b === void 0 ? void 0 : _b[depName];
                const prefix = currentVersion
                    ? this.detectRangePrefix(currentVersion)
                    : '';
                updatedPackage.updateLocalDependency(resolved, depVersion.toString(), prefix);
                this.logger.info(`${pkg.name}.${depName} updated to ${prefix}${depVersion.toString()}`);
            }
        }
        const dependencyNotes = getChangelogDepsNotes(pkg, updatedPackage, updatedVersions);
        const packageJson = updatedPackage.toJSON();
        const version = version_1.Version.parse(packageJson.version);
        const pullRequest = {
            title: pull_request_title_1.PullRequestTitle.ofTargetBranch(this.targetBranch),
            body: new pull_request_body_1.PullRequestBody([
                {
                    component: updatedPackage.name,
                    version,
                    notes: (0, workspace_1.appendDependenciesSectionToChangelog)('', dependencyNotes, this.logger),
                },
            ]),
            updates: [
                {
                    path: (0, workspace_1.addPath)(updatedPackage.location, 'package.json'),
                    createIfMissing: false,
                    updater: new raw_content_1.RawContent((0, json_stringify_1.jsonStringify)(packageJson, updatedPackage.rawContent)),
                },
                {
                    path: (0, workspace_1.addPath)(updatedPackage.location, 'CHANGELOG.md'),
                    createIfMissing: false,
                    updater: new changelog_1.Changelog({
                        version,
                        changelogEntry: (0, workspace_1.appendDependenciesSectionToChangelog)('', dependencyNotes, this.logger),
                    }),
                },
            ],
            labels: [],
            headRefName: branch_name_1.BranchName.ofTargetBranch(this.targetBranch).toString(),
            version,
            draft: false,
        };
        return {
            path: updatedPackage.location,
            pullRequest,
            config: {
                releaseType: 'node',
            },
        };
    }
    postProcessCandidates(candidates, _updatedVersions) {
        // NOP for node workspaces
        return candidates;
    }
    async buildGraph(allPackages) {
        const graph = new Map();
        const workspacePackageNames = new Set(allPackages.map(packageJson => packageJson.name));
        for (const packageJson of allPackages) {
            const allDeps = Object.keys(this.combineDeps(packageJson));
            const workspaceDeps = allDeps.filter(dep => workspacePackageNames.has(dep));
            graph.set(packageJson.name, {
                deps: workspaceDeps,
                value: packageJson,
            });
        }
        return graph;
    }
    inScope(candidate) {
        return candidate.config.releaseType === 'node';
    }
    packageNameFromPackage(pkg) {
        return pkg.name;
    }
    pathFromPackage(pkg) {
        return pkg.location;
    }
    detectRangePrefix(version) {
        return (Object.values(SUPPORTED_RANGE_PREFIXES).find(supportedRangePrefix => version.startsWith(supportedRangePrefix)) || '');
    }
    combineDeps(packageJson) {
        var _a, _b, _c;
        return {
            ...((_a = packageJson.dependencies) !== null && _a !== void 0 ? _a : {}),
            ...((_b = packageJson.devDependencies) !== null && _b !== void 0 ? _b : {}),
            ...((_c = packageJson.optionalDependencies) !== null && _c !== void 0 ? _c : {}),
        };
    }
}
exports.NodeWorkspace = NodeWorkspace;
var SUPPORTED_RANGE_PREFIXES;
(function (SUPPORTED_RANGE_PREFIXES) {
    SUPPORTED_RANGE_PREFIXES["CARET"] = "^";
    SUPPORTED_RANGE_PREFIXES["TILDE"] = "~";
    SUPPORTED_RANGE_PREFIXES["GREATER_THAN"] = ">";
    SUPPORTED_RANGE_PREFIXES["LESS_THAN"] = "<";
    SUPPORTED_RANGE_PREFIXES["EQUAL_OR_GREATER_THAN"] = ">=";
    SUPPORTED_RANGE_PREFIXES["EQUAL_OR_LESS_THAN"] = "<=";
})(SUPPORTED_RANGE_PREFIXES || (SUPPORTED_RANGE_PREFIXES = {}));
function getChangelogDepsNotes(original, updated, updateVersions) {
    var _a, _b;
    let depUpdateNotes = '';
    const depTypes = [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
    ];
    const updates = new Map();
    for (const depType of depTypes) {
        const depUpdates = [];
        const pkgDepTypes = updated[depType];
        if (pkgDepTypes === undefined) {
            continue;
        }
        for (const [depName, currentDepVer] of Object.entries(pkgDepTypes)) {
            const origDepVer = (_a = original[depType]) === null || _a === void 0 ? void 0 : _a[depName];
            if (currentDepVer !== origDepVer) {
                depUpdates.push(`\n    * ${depName} bumped from ${origDepVer} to ${currentDepVer}`);
                //handle case when "workspace:" version is used
            }
            else if (currentDepVer.startsWith('workspace:') &&
                updateVersions.get(depName) !== undefined) {
                depUpdates.push(`\n    * ${depName} bumped to ${(_b = updateVersions
                    .get(depName)) === null || _b === void 0 ? void 0 : _b.toString()}`);
            }
        }
        if (depUpdates.length > 0) {
            updates.set(depType, depUpdates);
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
//# sourceMappingURL=node-workspace.js.map