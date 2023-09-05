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

import {ManifestPlugin, ManifestPluginOptions} from '../plugin';
import {
  CandidateReleasePullRequest,
  RepositoryConfig,
  ROOT_PROJECT_PATH,
} from '../manifest';
import {logger as defaultLogger, Logger} from '../util/logger';
import {VersionsMap, Version} from '../version';
import {Merge} from './merge';
import {GitHub} from '../github';
import {ReleasePleaseManifest} from '../updaters/release-please-manifest';

export type DependencyGraph<T> = Map<string, DependencyNode<T>>;
export interface DependencyNode<T> {
  deps: string[];
  value: T;
}

export interface WorkspacePluginOptions extends ManifestPluginOptions {
  manifestPath?: string;
  updateAllPackages?: boolean;
  merge?: boolean;
}

export interface AllPackages<T> {
  allPackages: T[];
  candidatesByPackage: Record<string, CandidateReleasePullRequest>;
}

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
export abstract class WorkspacePlugin<T> extends ManifestPlugin {
  private updateAllPackages: boolean;
  private merge: boolean;
  constructor(
    github: GitHub,
    targetBranch: string,
    manifestPath: string,
    repositoryConfig: RepositoryConfig,
    options: WorkspacePluginOptions = {}
  ) {
    super(github, targetBranch, manifestPath, repositoryConfig, options);
    this.updateAllPackages = options.updateAllPackages ?? false;
    this.merge = options.merge ?? true;
  }
  async run(
    candidates: CandidateReleasePullRequest[]
  ): Promise<CandidateReleasePullRequest[]> {
    this.logger.info('Running workspace plugin');

    const [inScopeCandidates, outOfScopeCandidates] = candidates.reduce(
      (collection, candidate) => {
        if (!candidate.pullRequest.version) {
          this.logger.warn('pull request missing version', candidate);
          return collection;
        }
        if (this.inScope(candidate)) {
          collection[0].push(candidate);
        } else {
          collection[1].push(candidate);
        }
        return collection;
      },
      [[], []] as CandidateReleasePullRequest[][]
    );

    this.logger.info(`Found ${inScopeCandidates.length} in-scope releases`);
    if (inScopeCandidates.length === 0) {
      return outOfScopeCandidates;
    }

    this.logger.info('Building list of all packages');
    const {allPackages, candidatesByPackage} = await this.buildAllPackages(
      inScopeCandidates
    );
    this.logger.info(
      `Building dependency graph for ${allPackages.length} packages`
    );
    const graph = await this.buildGraph(allPackages);

    const packageNamesToUpdate = this.packageNamesToUpdate(
      graph,
      candidatesByPackage
    );
    const orderedPackages = this.buildGraphOrder(graph, packageNamesToUpdate);
    this.logger.info(`Updating ${orderedPackages.length} packages`);

    const {updatedVersions, updatedPathVersions} =
      await this.buildUpdatedVersions(
        graph,
        orderedPackages,
        candidatesByPackage
      );

    let newCandidates: CandidateReleasePullRequest[] = [];
    // In some cases, there are multiple packages within a single candidate. We
    // only want to process each candidate package once.
    const newCandidatePaths = new Set<string>();
    for (const pkg of orderedPackages) {
      const existingCandidate = this.findCandidateForPackage(
        pkg,
        candidatesByPackage
      );
      if (existingCandidate) {
        // if already has an pull request, update the changelog and update
        this.logger.info(
          `Updating exising candidate pull request for ${this.packageNameFromPackage(
            pkg
          )}, path: ${existingCandidate.path}`
        );
        if (newCandidatePaths.has(existingCandidate.path)) {
          this.logger.info(
            `Already updated candidate for path: ${existingCandidate.path}`
          );
        } else {
          const newCandidate = this.updateCandidate(
            existingCandidate,
            pkg,
            updatedVersions
          );
          newCandidatePaths.add(newCandidate.path);
          newCandidates.push(newCandidate);
        }
      } else {
        // otherwise, build a new pull request with changelog and entry update
        this.logger.info(
          `Creating new candidate pull request for ${this.packageNameFromPackage(
            pkg
          )}`
        );
        const newCandidate = this.newCandidate(pkg, updatedVersions);
        if (newCandidatePaths.has(newCandidate.path)) {
          this.logger.info(
            `Already created new candidate for path: ${newCandidate.path}`
          );
        } else {
          newCandidatePaths.add(newCandidate.path);
          newCandidates.push(newCandidate);
        }
      }
    }

    if (this.merge) {
      this.logger.info(`Merging ${newCandidates.length} in-scope candidates`);
      const mergePlugin = new Merge(
        this.github,
        this.targetBranch,
        this.manifestPath,
        this.repositoryConfig
      );
      newCandidates = await mergePlugin.run(newCandidates);
    }

    const newUpdates = newCandidates[0].pullRequest.updates;
    newUpdates.push({
      path: this.manifestPath,
      createIfMissing: false,
      updater: new ReleasePleaseManifest({
        version: newCandidates[0].pullRequest.version!,
        versionsMap: updatedPathVersions,
      }),
    });

    this.logger.info(
      `Post-processing ${newCandidates.length} in-scope candidates`
    );
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
  protected findCandidateForPackage(
    pkg: T,
    candidatesByPackage: Record<string, CandidateReleasePullRequest>
  ): CandidateReleasePullRequest | undefined {
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
  protected packageNamesToUpdate(
    graph: DependencyGraph<T>,
    candidatesByPackage: Record<string, CandidateReleasePullRequest>
  ): string[] {
    if (this.updateAllPackages) {
      return Array.from(graph.values()).map(({value}) =>
        this.packageNameFromPackage(value)
      );
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
  protected async buildUpdatedVersions(
    _graph: DependencyGraph<T>,
    orderedPackages: T[],
    candidatesByPackage: Record<string, CandidateReleasePullRequest>
  ): Promise<{updatedVersions: VersionsMap; updatedPathVersions: VersionsMap}> {
    const updatedVersions: VersionsMap = new Map();
    const updatedPathVersions: VersionsMap = new Map();
    for (const pkg of orderedPackages) {
      const packageName = this.packageNameFromPackage(pkg);
      this.logger.debug(`package: ${packageName}`);
      const existingCandidate = candidatesByPackage[packageName];
      if (existingCandidate) {
        const version = existingCandidate.pullRequest.version!;
        this.logger.debug(`version: ${version} from release-please`);
        updatedVersions.set(packageName, version);
      } else {
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
  protected isReleaseVersion(_version: Version): boolean {
    return true;
  }

  /**
   * Given a package, return the new bumped version after updating
   * the dependency.
   * @param {T} pkg The package being updated
   */
  protected abstract bumpVersion(pkg: T): Version;

  /**
   * Update an existing candidate pull request to append new
   * dependency updates into the versions and changelog.
   * @param {CandidateReleasePullRequest} existingCandidate The existing
   *   candidate pull request.
   * @param {T} pkg The package being updated
   * @param {VersionsMap} updatedVersions Map of package name => version to
   *   update.
   * @returns {CandidateReleasePullRequest} The updated pull request
   */
  protected abstract updateCandidate(
    existingCandidate: CandidateReleasePullRequest,
    pkg: T,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest;

  /**
   * Create a new candidate pull request to update dependencies and force
   * a version bump.
   * @param {T} pkg The package being updated
   * @param {VersionsMap} updatedVersions Map of package name => version to
   *   update.
   * @returns {CandidateReleasePullRequest} A new pull request
   */
  protected abstract newCandidate(
    pkg: T,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest;

  /**
   * Collect all packages being managed in this workspace.
   * @param {CanididateReleasePullRequest[]} candidates Existing candidate pull
   *   requests
   * @returns {AllPackages<T>} The list of packages and candidates grouped by package name
   */
  protected abstract buildAllPackages(
    candidates: CandidateReleasePullRequest[]
  ): Promise<AllPackages<T>>;

  /**
   * Builds a graph of dependencies that have been touched
   * @param {T[]} allPackages All the packages in the workspace
   * @returns {DependencyGraph<T>} A map of package name to other workspace packages
   *   it depends on.
   */
  protected abstract buildGraph(allPackages: T[]): Promise<DependencyGraph<T>>;

  /**
   * Filter to determine whether or not the candidate pull request is
   * in scope of this workspace.
   * @param {CandidateReleasePullRequest} candidate The candidate pull request
   * @returns {boolean} Whether or not this candidate should be handled by this
   *   workspace.
   */
  protected abstract inScope(candidate: CandidateReleasePullRequest): boolean;

  /**
   * Given a package, return the package name of the package.
   * @param {T} pkg The package definition.
   * @returns {string} The package name.
   */
  protected abstract packageNameFromPackage(pkg: T): string;

  /**
   * Given a package, return the path in the repo to the package.
   * @param {T} pkg The package definition.
   * @returns {string} The package path.
   */
  protected abstract pathFromPackage(pkg: T): string;

  /**
   * Amend any or all in-scope candidates once all other processing has occured.
   *
   * This gives the workspace plugin once last chance to tweak the pull-requests
   * once all the underlying information has been collated.
   * @param {CandidateReleasePullRequest[]} candidates - The list of candidates
   *   once all other workspace processing has occured.
   * @param {VersionMap} updatedVersions - Map containing any component versions
   *   that have changed.
   * @returns {CandidateReleasePullRequest[]} potentially amended list of
   *   candidates.
   */
  protected abstract postProcessCandidates(
    candidates: CandidateReleasePullRequest[],
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest[];

  /**
   * Helper to invert the graph from package => packages that it depends on
   * to package => packages that depend on it.
   * @param {DependencyGraph<T>} graph
   * @returns {DependencyGraph<T>}
   */
  private invertGraph(graph: DependencyGraph<T>): DependencyGraph<T> {
    const dependentGraph: DependencyGraph<T> = new Map();
    for (const [packageName, node] of graph) {
      dependentGraph.set(packageName, {
        deps: [],
        value: node.value,
      });
    }

    for (const [packageName, node] of graph) {
      for (const depName of node.deps) {
        if (dependentGraph.has(depName)) {
          dependentGraph.get(depName)!.deps.push(packageName);
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
  protected buildGraphOrder(
    graph: DependencyGraph<T>,
    packageNamesToUpdate: string[]
  ): T[] {
    this.logger.info(
      `building graph order, existing package names: ${packageNamesToUpdate}`
    );

    // invert the graph so it's dependency name => packages that depend on it
    const dependentGraph = this.invertGraph(graph);
    const visited: Set<T> = new Set();

    // we're iterating the `Map` in insertion order (as per ECMA262), but
    // that does not reflect any particular traversal of the graph, so we
    // visit all nodes, opportunistically short-circuiting leafs when we've
    // already visited them.
    for (const name of packageNamesToUpdate) {
      this.visitPostOrder(dependentGraph, name, visited, []);
    }

    return Array.from(visited).sort((a, b) =>
      this.packageNameFromPackage(a).localeCompare(
        this.packageNameFromPackage(b)
      )
    );
  }

  private visitPostOrder(
    graph: DependencyGraph<T>,
    name: string,
    visited: Set<T>,
    path: string[]
  ) {
    this.logger.debug(`visiting ${name}, path: ${path}`);
    if (path.indexOf(name) !== -1) {
      throw new Error(
        `found cycle in dependency graph: ${path.join(' -> ')} -> ${name}`
      );
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
      this.logger.debug(
        `marking ${name} as visited and adding ${this.packageNameFromPackage(
          node.value
        )} to order`
      );
      visited.add(node.value);
    } else {
      this.logger.debug(`${node.value} already visited`);
    }
  }
}

const DEPENDENCY_HEADER = new RegExp('### Dependencies');
export function appendDependenciesSectionToChangelog(
  changelog: string,
  notes: string,
  logger: Logger = defaultLogger
): string {
  if (!changelog) {
    return `### Dependencies\n\n${notes}`;
  }
  logger.info('appending dependency notes to changelog');

  const newLines: string[] = [];
  let seenDependenciesSection = false;
  let seenDependencySectionSpacer = false;
  let injected = false;
  for (const line of changelog.split('\n')) {
    if (seenDependenciesSection) {
      const trimmedLine = line.trim();
      if (
        seenDependencySectionSpacer &&
        !injected &&
        !trimmedLine.startsWith('*')
      ) {
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

export function addPath(path: string, file: string): string {
  return path === ROOT_PROJECT_PATH ? file : `${path}/${file}`;
}
