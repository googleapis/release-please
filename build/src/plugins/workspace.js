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
exports.addPath = exports.appendDependenciesSectionToChangelog = exports.WorkspacePlugin = void 0;
const plugin_1 = require("../plugin");
const manifest_1 = require("../manifest");
const logger_1 = require("../util/logger");
const merge_1 = require("./merge");
const release_please_manifest_1 = require("../updaters/release-please-manifest");
/**
 * The plugin generalizes the logic for handling a workspace and
 * will bump dependencies of managed packages if those dependencies
 * are being updated.
 *
 * If multiple in-scope packages are being updated, it will merge them
 * into a single package.
 *
 * This class is templatized with `T` which should be information about
 * the package including the name and current version.
 */
class WorkspacePlugin extends plugin_1.ManifestPlugin {
    constructor(github, targetBranch, repositoryConfig, options = {}) {
        var _a, _b, _c;
        super(github, targetBranch, repositoryConfig, options.logger);
        this.manifestPath = (_a = options.manifestPath) !== null && _a !== void 0 ? _a : manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST;
        this.updateAllPackages = (_b = options.updateAllPackages) !== null && _b !== void 0 ? _b : false;
        this.merge = (_c = options.merge) !== null && _c !== void 0 ? _c : true;
    }
    async run(candidates) {
        this.logger.info('Running workspace plugin');
        const [inScopeCandidates, outOfScopeCandidates] = candidates.reduce((collection, candidate) => {
            if (!candidate.pullRequest.version) {
                this.logger.warn('pull request missing version', candidate);
                return collection;
            }
            if (this.inScope(candidate)) {
                collection[0].push(candidate);
            }
            else {
                collection[1].push(candidate);
            }
            return collection;
        }, [[], []]);
        this.logger.info(`Found ${inScopeCandidates.length} in-scope releases`);
        if (inScopeCandidates.length === 0) {
            return outOfScopeCandidates;
        }
        this.logger.info('Building list of all packages');
        const { allPackages, candidatesByPackage } = await this.buildAllPackages(inScopeCandidates);
        this.logger.info(`Building dependency graph for ${allPackages.length} packages`);
        const graph = await this.buildGraph(allPackages);
        const packageNamesToUpdate = this.packageNamesToUpdate(graph, candidatesByPackage);
        const orderedPackages = this.buildGraphOrder(graph, packageNamesToUpdate);
        this.logger.info(`Updating ${orderedPackages.length} packages`);
        const { updatedVersions, updatedPathVersions } = await this.buildUpdatedVersions(graph, orderedPackages, candidatesByPackage);
        let newCandidates = [];
        // In some cases, there are multiple packages within a single candidate. We
        // only want to process each candidate package once.
        const newCandidatePaths = new Set();
        for (const pkg of orderedPackages) {
            const existingCandidate = this.findCandidateForPackage(pkg, candidatesByPackage);
            if (existingCandidate) {
                // if already has an pull request, update the changelog and update
                this.logger.info(`Updating exising candidate pull request for ${this.packageNameFromPackage(pkg)}, path: ${existingCandidate.path}`);
                if (newCandidatePaths.has(existingCandidate.path)) {
                    this.logger.info(`Already updated candidate for path: ${existingCandidate.path}`);
                }
                else {
                    const newCandidate = this.updateCandidate(existingCandidate, pkg, updatedVersions);
                    newCandidatePaths.add(newCandidate.path);
                    newCandidates.push(newCandidate);
                }
            }
            else {
                // otherwise, build a new pull request with changelog and entry update
                this.logger.info(`Creating new candidate pull request for ${this.packageNameFromPackage(pkg)}`);
                const newCandidate = this.newCandidate(pkg, updatedVersions);
                if (newCandidatePaths.has(newCandidate.path)) {
                    this.logger.info(`Already created new candidate for path: ${newCandidate.path}`);
                }
                else {
                    newCandidatePaths.add(newCandidate.path);
                    newCandidates.push(newCandidate);
                }
            }
        }
        if (this.merge) {
            this.logger.info(`Merging ${newCandidates.length} in-scope candidates`);
            const mergePlugin = new merge_1.Merge(this.github, this.targetBranch, this.repositoryConfig);
            newCandidates = await mergePlugin.run(newCandidates);
        }
        const newUpdates = newCandidates[0].pullRequest.updates;
        newUpdates.push({
            path: this.manifestPath,
            createIfMissing: false,
            updater: new release_please_manifest_1.ReleasePleaseManifest({
                version: newCandidates[0].pullRequest.version,
                versionsMap: updatedPathVersions,
            }),
        });
        this.logger.info(`Post-processing ${newCandidates.length} in-scope candidates`);
        newCandidates = this.postProcessCandidates(newCandidates, updatedVersions);
        return [...outOfScopeCandidates, ...newCandidates];
    }
    /**
     * Helper for finding a candidate release based on the package name.
     * By default, we assume that the package name matches the release
     * component.
     * @param {T} pkg The package being released
     * @param {Record<string, CandidateReleasePullRequest} candidatesByPackage
     *   The candidate pull requests indexed by the package name.
     * @returns {CandidateReleasePullRequest | undefined} The associated
     *   candidate release or undefined if there is no existing release yet
     */
    findCandidateForPackage(pkg, candidatesByPackage) {
        const packageName = this.packageNameFromPackage(pkg);
        return candidatesByPackage[packageName];
    }
    /**
     * Helper to determine which packages we will use to base our search
     * for touched packages upon. These are usually the packages that
     * have candidate pull requests open.
     *
     * If you configure `updateAllPackages`, we fill force update all
     * packages as if they had a release.
     * @param {DependencyGraph<T>} graph All the packages in the repository
     * @param {Record<string, CandidateReleasePullRequest} candidatesByPackage
     *   The candidate pull requests indexed by the package name.
     * @returns {string[]} Package names to
     */
    packageNamesToUpdate(graph, candidatesByPackage) {
        if (this.updateAllPackages) {
            return Array.from(graph.values()).map(({ value }) => this.packageNameFromPackage(value));
        }
        return Object.keys(candidatesByPackage);
    }
    /**
     * Helper to build up all the versions we are modifying in this
     * repository.
     * @param {DependencyGraph<T>} _graph All the packages in the repository
     * @param {T[]} orderedPackages A list of packages that are currently
     *   updated by the existing candidate pull requests
     * @param {Record<string, CandidateReleasePullRequest} candidatesByPackage
     *   The candidate pull requests indexed by the package name.
     * @returns A map of all updated versions (package name => Version) and a
     *   map of all updated versions (component path => Version).
     */
    async buildUpdatedVersions(_graph, orderedPackages, candidatesByPackage) {
        const updatedVersions = new Map();
        const updatedPathVersions = new Map();
        for (const pkg of orderedPackages) {
            const packageName = this.packageNameFromPackage(pkg);
            this.logger.debug(`package: ${packageName}`);
            const existingCandidate = candidatesByPackage[packageName];
            if (existingCandidate) {
                const version = existingCandidate.pullRequest.version;
                this.logger.debug(`version: ${version} from release-please`);
                updatedVersions.set(packageName, version);
            }
            else {
                const version = this.bumpVersion(pkg);
                this.logger.debug(`version: ${version} forced bump`);
                updatedVersions.set(packageName, version);
                if (this.isReleaseVersion(version)) {
                    updatedPathVersions.set(this.pathFromPackage(pkg), version);
                }
            }
        }
        return {
            updatedVersions,
            updatedPathVersions,
        };
    }
    /**
     * Given a release version, determine if we should bump the manifest
     * version as well.
     * @param {Version} _version The release version
     */
    isReleaseVersion(_version) {
        return true;
    }
    /**
     * Helper to invert the graph from package => packages that it depends on
     * to package => packages that depend on it.
     * @param {DependencyGraph<T>} graph
     * @returns {DependencyGraph<T>}
     */
    invertGraph(graph) {
        const dependentGraph = new Map();
        for (const [packageName, node] of graph) {
            dependentGraph.set(packageName, {
                deps: [],
                value: node.value,
            });
        }
        for (const [packageName, node] of graph) {
            for (const depName of node.deps) {
                if (dependentGraph.has(depName)) {
                    dependentGraph.get(depName).deps.push(packageName);
                }
            }
        }
        return dependentGraph;
    }
    /**
     * Determine all the packages which need to be updated and sort them.
     * @param {DependencyGraph<T>} graph The graph of package => packages it depends on
     * @param {string} packageNamesToUpdate Names of the packages which are already
     *   being updated.
     */
    buildGraphOrder(graph, packageNamesToUpdate) {
        this.logger.info(`building graph order, existing package names: ${packageNamesToUpdate}`);
        // invert the graph so it's dependency name => packages that depend on it
        const dependentGraph = this.invertGraph(graph);
        const visited = new Set();
        // we're iterating the `Map` in insertion order (as per ECMA262), but
        // that does not reflect any particular traversal of the graph, so we
        // visit all nodes, opportunistically short-circuiting leafs when we've
        // already visited them.
        for (const name of packageNamesToUpdate) {
            this.visitPostOrder(dependentGraph, name, visited, []);
        }
        return Array.from(visited).sort((a, b) => this.packageNameFromPackage(a).localeCompare(this.packageNameFromPackage(b)));
    }
    visitPostOrder(graph, name, visited, path) {
        this.logger.debug(`visiting ${name}, path: ${path}`);
        if (path.indexOf(name) !== -1) {
            throw new Error(`found cycle in dependency graph: ${path.join(' -> ')} -> ${name}`);
        }
        const node = graph.get(name);
        if (!node) {
            this.logger.warn(`Didn't find node: ${name} in graph`);
            return;
        }
        const nextPath = [...path, name];
        for (const depName of node.deps) {
            const dep = graph.get(depName);
            if (!dep) {
                this.logger.warn(`dependency not found in graph: ${depName}`);
                return;
            }
            this.logger.info(`visiting ${depName} next`);
            this.visitPostOrder(graph, depName, visited, nextPath);
        }
        if (!visited.has(node.value)) {
            this.logger.debug(`marking ${name} as visited and adding ${this.packageNameFromPackage(node.value)} to order`);
            visited.add(node.value);
        }
        else {
            this.logger.debug(`${node.value} already visited`);
        }
    }
}
exports.WorkspacePlugin = WorkspacePlugin;
const DEPENDENCY_HEADER = new RegExp('### Dependencies');
function appendDependenciesSectionToChangelog(changelog, notes, logger = logger_1.logger) {
    if (!changelog) {
        return `### Dependencies\n\n${notes}`;
    }
    logger.info('appending dependency notes to changelog');
    const newLines = [];
    let seenDependenciesSection = false;
    let seenDependencySectionSpacer = false;
    let injected = false;
    for (const line of changelog.split('\n')) {
        if (seenDependenciesSection) {
            const trimmedLine = line.trim();
            if (seenDependencySectionSpacer &&
                !injected &&
                !trimmedLine.startsWith('*')) {
                newLines.push(changelog);
                injected = true;
            }
            if (trimmedLine === '') {
                seenDependencySectionSpacer = true;
            }
        }
        if (line.match(DEPENDENCY_HEADER)) {
            seenDependenciesSection = true;
        }
        newLines.push(line);
    }
    if (injected) {
        return newLines.join('\n');
    }
    if (seenDependenciesSection) {
        return `${changelog}\n${notes}`;
    }
    return `${changelog}\n\n\n### Dependencies\n\n${notes}`;
}
exports.appendDependenciesSectionToChangelog = appendDependenciesSectionToChangelog;
function addPath(path, file) {
    return path === manifest_1.ROOT_PROJECT_PATH ? file : `${path}/${file}`;
}
exports.addPath = addPath;
//# sourceMappingURL=workspace.js.map