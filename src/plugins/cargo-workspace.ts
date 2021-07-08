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

import {FileData} from 'code-suggester/build/src/types';
import * as semver from 'semver';
import {ManifestPackageWithPRData} from '..';
import {GitHubFileContents} from '../github';
import {CargoLock} from '../updaters/rust/cargo-lock';
import {CargoToml} from '../updaters/rust/cargo-toml';
import {CargoManifest, parseCargoManifest} from '../updaters/rust/common';
import {VersionsMap} from '../updaters/update';
import {CheckpointType} from '../util/checkpoint';
import {ManifestPlugin} from './plugin';

interface CrateInfo {
  /**
   * e.g. `crates/crate-a`
   */
  path: string;

  /**
   * e.g. `crate-a`
   */
  name: string;

  /**
   * e.g. `1.0.0`
   */
  version: string;

  /**
   * e.g. `crates/crate-a/Cargo.toml`
   */
  manifestPath: string;

  /**
   * text content of the manifest, used for updates
   */
  manifestContent: string;

  /**
   * Parsed cargo manifest
   */
  manifest: CargoManifest;

  /**
   * Plug-in input, set if package was already bumped by release-please
   */
  manifestPkg?: ManifestPackageWithPRData;
}

export default class CargoWorkspaceDependencyUpdates extends ManifestPlugin {
  private async getWorkspaceManifest(): Promise<CargoManifest> {
    const content: GitHubFileContents = await this.gh.getFileContents(
      'Cargo.toml'
    );
    return parseCargoManifest(content.parsedContent);
  }

  async run(
    newManifestVersions: VersionsMap,
    pkgsWithPRData: ManifestPackageWithPRData[]
  ): Promise<[VersionsMap, ManifestPackageWithPRData[]]> {
    const workspaceManifest = await this.getWorkspaceManifest();

    if (!workspaceManifest.workspace) {
      throw new Error(
        "cargo-workspace plugin used, but top-level Cargo.toml isn't a cargo workspace"
      );
    }

    if (!workspaceManifest.workspace.members) {
      throw new Error(
        'cargo-workspace plugin used, but top-level Cargo.toml has no members'
      );
    }

    const crateInfos = await this.getAllCrateInfos(
      workspaceManifest.workspace.members,
      pkgsWithPRData
    );
    const crateInfoMap = new Map(crateInfos.map(crate => [crate.name, crate]));
    const crateGraph = buildCrateGraph(crateInfoMap);
    const order = postOrder(crateGraph);

    const orderedCrates = order.map(name => crateInfoMap.get(name)!);

    const versions = new Map();
    for (const data of pkgsWithPRData) {
      if (data.config.releaseType !== 'rust' || data.config.path === '.') {
        continue;
      }
      versions.set(data.config.packageName!, data.prData.version);
    }

    // Try to upgrade /all/ packages, even those release-please did not bump
    for (const crate of orderedCrates) {
      // This should update all the dependencies that have been bumped by release-please
      const dependencyUpdates = new CargoToml({
        path: crate.manifestPath,
        changelogEntry: 'updating dependencies',
        version: 'unused',
        versions,
        packageName: 'unused',
      });
      let newContent = dependencyUpdates.updateContent(crate.manifestContent);
      if (newContent === crate.manifestContent) {
        // guess that package didn't depend on any of the bumped packages
        continue;
      }

      let updatedManifest: FileData = {
        content: newContent,
        mode: '100644',
      };

      if (crate.manifestPkg) {
        // package was already bumped by release-please, just update the change
        // to also include dependency updates.
        crate.manifestPkg.prData.changes.set(
          crate.manifestPath,
          updatedManifest
        );
      } else {
        // package was not bumped by release-please, but let's bump it ourselves,
        // because one of its dependencies was upgraded.
        let version: string;
        const patch = semver.inc(crate.version, 'patch');
        if (patch === null) {
          this.log(
            `Don't know how to patch ${crate.path}'s version(${crate.version})`,
            CheckpointType.Failure
          );
          version = crate.version;
        } else {
          version = patch;
        }

        // we need to reprocess its Cargo manifest to bump its own version
        versions.set(crate.name, version);
        newContent = dependencyUpdates.updateContent(crate.manifestContent);
        updatedManifest = {
          content: newContent,
          mode: '100644',
        };

        const changes = new Map([[crate.manifestPath, updatedManifest]]);

        newManifestVersions.set(crate.path, version);
        pkgsWithPRData.push({
          config: {
            releaseType: 'rust',
            packageName: crate.name,
            path: crate.path,
          },
          prData: {
            changes,
            version,
          },
        });
      }
    }

    // Upgrade package.lock
    {
      const lockfilePath = 'Cargo.lock';
      const dependencyUpdates = new CargoLock({
        path: lockfilePath,
        changelogEntry: 'updating cargo lockfile',
        version: 'unused',
        versions,
        packageName: 'unused',
      });

      const oldContent = (await this.gh.getFileContents(lockfilePath))
        .parsedContent;
      const newContent = dependencyUpdates.updateContent(oldContent);
      if (newContent !== oldContent) {
        const changes: Map<string, FileData> = new Map([
          [
            lockfilePath,
            {
              content: newContent,
              mode: '100644',
            },
          ],
        ]);

        pkgsWithPRData.push({
          config: {
            path: '.',
            packageName: 'cargo workspace',
            releaseType: 'rust',
          },
          prData: {
            changes,
            version: 'lockfile maintenance',
          },
        });
      }
    }

    return [newManifestVersions, pkgsWithPRData];
  }

  private async getAllCrateInfos(
    members: string[],
    pkgsWithPRData: ManifestPackageWithPRData[]
  ): Promise<CrateInfo[]> {
    const manifests: CrateInfo[] = [];

    for (const pkgPath of members) {
      const manifestPath = `${pkgPath}/Cargo.toml`;
      const manifestPkg = pkgsWithPRData.find(
        pkg => pkg.config.path === pkgPath
      );

      // original contents of the manifest for the target package
      const manifestContent =
        manifestPkg?.prData.changes.get(manifestPath)?.content ??
        (await this.gh.getFileContents(manifestPath)).parsedContent;
      const manifest = await parseCargoManifest(manifestContent);

      const pkgName = manifest.package?.name;
      if (!pkgName) {
        throw new Error(
          `package manifest at ${manifestPath} is missing [package.name]`
        );
      }

      const version = manifest.package?.version;
      if (!version) {
        throw new Error(
          `package manifest at ${manifestPath} is missing [package.version]`
        );
      }

      manifests.push({
        path: pkgPath,
        name: pkgName,
        version,
        manifest,
        manifestContent,
        manifestPath,
        manifestPkg,
      });
    }
    return manifests;
  }
}

function buildCrateGraph(crateInfoMap: Map<string, CrateInfo>): Graph {
  const graph: Graph = new Map();

  for (const crate of crateInfoMap.values()) {
    const allDeps = Object.keys({
      ...(crate.manifest.dependencies ?? {}),
      ...(crate.manifest['dependencies'] ?? {}),
      ...(crate.manifest['build-dependencies'] ?? {}),
    });
    console.log({allDeps});
    const workspaceDeps = allDeps.filter(dep => crateInfoMap.has(dep));
    graph.set(crate.name, {
      name: crate.name,
      deps: workspaceDeps,
    });
  }

  return graph;
}

export interface GraphNode {
  name: string;
  deps: string[];
}

export type Graph = Map<string, GraphNode>;

/**
 * Given a list of graph nodes that form a DAG, returns the node names in
 * post-order (reverse depth-first), suitable for dependency updates and bumping.
 */
export function postOrder(graph: Graph): string[] {
  const result: string[] = [];
  const resultSet: Set<string> = new Set();

  // we're iterating the `Map` in insertion order (as per ECMA262), but
  // that does not reflect any particular traversal of the graph, so we
  // visit all nodes, opportunistically short-circuiting leafs when we've
  // already visited them.
  for (const node of graph.values()) {
    visitPostOrder(graph, node, result, resultSet, []);
  }

  return result;
}

function visitPostOrder(
  graph: Graph,
  node: GraphNode,
  result: string[],
  resultSet: Set<string>,
  path: string[]
) {
  if (resultSet.has(node.name)) {
    return;
  }

  if (path.indexOf(node.name) !== -1) {
    throw new Error(
      `found cycle in dependency graph: ${path.join(' -> ')} -> ${node.name}`
    );
  }

  {
    const nextPath = [...path, node.name];

    for (const depName of node.deps) {
      const dep = graph.get(depName);
      if (!dep) {
        throw new Error(`dependency not found in graph: ${depName}`);
      }

      visitPostOrder(graph, dep, result, resultSet, nextPath);
    }
  }

  if (!resultSet.has(node.name)) {
    resultSet.add(node.name);
    result.push(node.name);
  }
}
