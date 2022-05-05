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

import {ManifestPlugin} from '../plugin';
import {CandidateReleasePullRequest, RepositoryConfig} from '../manifest';
import {logger} from '../util/logger';
import {VersionsMap, Version} from '../version';
import {Merge} from './merge';
import {GitHub} from '../github';

export type DependencyGraph<T> = Map<string, DependencyNode<T>>;
export interface DependencyNode<T> {
  deps: string[];
  value: T;
}

export interface WorkspacePluginOptions {
  updateAllPackages?: boolean;
}

interface AllPackages<T> {
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
  constructor(
    github: GitHub,
    targetBranch: string,
    repositoryConfig: RepositoryConfig,
    options: WorkspacePluginOptions = {}
  ) {
    super(github, targetBranch, repositoryConfig);
    this.updateAllPackages = options.updateAllPackages ?? false;
  }
  async run(
    candidates: CandidateReleasePullRequest[]
  ): Promise<CandidateReleasePullRequest[]> {
    logger.info('Running workspace plugin');

    const [inScopeCandidates, outOfScopeCandidates] = candidates.reduce(
      (collection, candidate) => {
        if (!candidate.pullRequest.version) {
          logger.warn('pull request missing version', candidate);
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

    logger.info(`Found ${inScopeCandidates.length} in-scope releases`);
    if (inScopeCandidates.length === 0) {
      return outOfScopeCandidates;
    }

    logger.info('Building list of all packages');
    const {allPackages, candidatesByPackage} = await this.buildAllPackages(
      inScopeCandidates
    );
    logger.info(`Building dependency graph for ${allPackages.length} packages`);
    const graph = await this.buildGraph(allPackages);

    const packageNamesToUpdate = this.updateAllPackages
      ? allPackages.map(this.packageNameFromPackage)
      : Object.keys(candidatesByPackage);
    const orderedPackages = this.buildGraphOrder(graph, packageNamesToUpdate);
    logger.info(`Updating ${orderedPackages.length} packages`);

    const updatedVersions: VersionsMap = new Map();
    for (const pkg of orderedPackages) {
      const packageName = this.packageNameFromPackage(pkg);
      logger.debug(`package: ${packageName}`);
      const existingCandidate = candidatesByPackage[packageName];
      if (existingCandidate) {
        const version = existingCandidate.pullRequest.version!;
        logger.debug(`version: ${version} from release-please`);
        updatedVersions.set(packageName, version);
      } else {
        const version = this.bumpVersion(pkg);
        logger.debug(`version: ${version} forced bump`);
        updatedVersions.set(packageName, version);
      }
    }

    let newCandidates: CandidateReleasePullRequest[] = [];
    for (const pkg of orderedPackages) {
      const packageName = this.packageNameFromPackage(pkg);
      const existingCandidate = candidatesByPackage[packageName];
      if (existingCandidate) {
        // if already has an pull request, update the changelog and update
        logger.info(
          `Updating exising candidate pull request for ${this.packageNameFromPackage(
            pkg
          )}`
        );
        const newCandidate = this.updateCandidate(
          existingCandidate,
          pkg,
          updatedVersions
        );
        newCandidates.push(newCandidate);
      } else {
        // otherwise, build a new pull request with changelog and entry update
        logger.info(
          `Creating new candidate pull request for ${this.packageNameFromPackage(
            pkg
          )}`
        );
        const newCandidate = this.newCandidate(pkg, updatedVersions);
        newCandidates.push(newCandidate);
      }
    }

    logger.info(`Merging ${newCandidates.length} in-scope candidates`);
    const mergePlugin = new Merge(
      this.github,
      this.targetBranch,
      this.repositoryConfig
    );
    newCandidates = await mergePlugin.run(newCandidates);

    logger.info(`Post-processing ${newCandidates.length} in-scope candidates`);
    newCandidates = this.postProcessCandidates(newCandidates, updatedVersions);

    return [...outOfScopeCandidates, ...newCandidates];
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
    logger.info(
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
    if (path.indexOf(name) !== -1) {
      throw new Error(
        `found cycle in dependency graph: ${path.join(' -> ')} -> ${name}`
      );
    }
    const node = graph.get(name);
    if (!node) {
      logger.warn(`Didn't find node: ${name} in graph`);
      return;
    }

    const nextPath = [...path, name];

    for (const depName of node.deps) {
      const dep = graph.get(depName);
      if (!dep) {
        logger.warn(`dependency not found in graph: ${depName}`);
        return;
      }

      this.visitPostOrder(graph, depName, visited, nextPath);
    }

    if (!visited.has(node.value)) {
      logger.debug(
        `marking ${name} as visited and adding ${this.packageNameFromPackage(
          node.value
        )} to order`
      );
      visited.add(node.value);
    }
  }
}
