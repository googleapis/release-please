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

import {Changes, FileData} from 'code-suggester/build/src/types';
import * as semver from 'semver';
import {ManifestPackage, ManifestPackageWithPRData} from '..';
import {ConventionalCommits} from '../conventional-commits';
import {GitHubFileContents} from '../github';
import {Changelog} from '../updaters/changelog';
import {CargoLock} from '../updaters/rust/cargo-lock';
import {CargoToml} from '../updaters/rust/cargo-toml';
import {
  CargoDependencies,
  CargoDependency,
  CargoManifest,
  parseCargoManifest,
} from '../updaters/rust/common';
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

        await this.setChangelogEntry(
          crate.manifestPkg.config,
          crate.manifestPkg.prData.changes,
          crate.manifestContent,
          updatedManifest.content! // bug if undefined
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
        const manifestPkg: ManifestPackageWithPRData = {
          config: {
            releaseType: 'rust',
            packageName: crate.name,
            path: crate.path,
          },
          prData: {
            changes,
            version,
          },
        };
        pkgsWithPRData.push(manifestPkg);

        await this.setChangelogEntry(
          manifestPkg.config,
          manifestPkg.prData.changes,
          crate.manifestContent,
          updatedManifest.content! // bug if undefined
        );
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

  private async setChangelogEntry(
    config: ManifestPackage,
    changes: Changes,
    originalManifestContent: string,
    updatedManifestContent: string
  ) {
    const originalManifest = parseCargoManifest(originalManifestContent);
    const updatedManifest = parseCargoManifest(updatedManifestContent);

    const depUpdateNotes = this.getChangelogDepsNotes(
      originalManifest,
      updatedManifest
    );
    if (!depUpdateNotes) {
      return;
    }

    const cc = new ConventionalCommits({
      changelogSections: [{type: 'deps', section: 'Dependencies'}],
      commits: [
        {
          sha: '',
          message: 'deps: The following workspace dependencies were updated',
          files: [],
        },
      ],
      owner: this.gh.owner,
      repository: this.gh.repo,
      bumpMinorPreMajor: config.bumpMinorPreMajor,
    });
    let tagPrefix = config.packageName;
    tagPrefix += '-v';
    const originalVersion = originalManifest.package?.version ?? '?';
    const updatedVersion = updatedManifest.package?.version ?? '?';
    let changelogEntry = await cc.generateChangelogEntry({
      version: originalVersion,
      currentTag: tagPrefix + originalVersion,
      previousTag: tagPrefix + updatedVersion,
    });
    changelogEntry += depUpdateNotes;

    let updatedChangelog;
    let changelogPath = config.changelogPath ?? 'CHANGELOG.md';

    if (config.path !== '.') {
      changelogPath = `${config.path}/${changelogPath}`;
    }
    const exChangelog = changes.get(changelogPath)?.content;
    if (exChangelog) {
      updatedChangelog = this.updateChangelogEntry(
        exChangelog,
        changelogEntry,
        updatedManifest
      );
    } else {
      updatedChangelog = await this.newChangelogEntry(
        changelogEntry,
        changelogPath,
        updatedManifest
      );
    }
    if (updatedChangelog) {
      changes.set(changelogPath, {
        content: updatedChangelog,
        mode: '100644',
      });
    }
  }

  private getChangelogDepsNotes(
    originalManifest: CargoManifest,
    updatedManifest: CargoManifest
  ): string {
    let depUpdateNotes = '';
    type DT = 'dependencies' | 'dev-dependencies' | 'build-dependencies';
    const depTypes: DT[] = [
      'dependencies',
      'dev-dependencies',
      'build-dependencies',
    ];
    const depVer = (
      s: string | CargoDependency | undefined
    ): string | undefined => {
      if (s === undefined) {
        return undefined;
      }
      if (typeof s === 'string') {
        return s;
      } else {
        return s.version;
      }
    };
    type DepMap = {[key: string]: string};
    const getDepMap = (cargoDeps: CargoDependencies): DepMap => {
      const result: DepMap = {};
      for (const [key, val] of Object.entries(cargoDeps)) {
        const ver = depVer(val);
        if (ver) {
          result[key] = ver;
        }
      }
      return result;
    };

    const updates: Map<DT, string[]> = new Map();
    for (const depType of depTypes) {
      const depUpdates = [];
      const pkgDepTypes = updatedManifest[depType];
      if (pkgDepTypes === undefined) {
        continue;
      }
      for (const [depName, currentDepVer] of Object.entries(
        getDepMap(pkgDepTypes)
      )) {
        const origDepVer = depVer(originalManifest[depType]?.[depName]);
        if (currentDepVer !== origDepVer) {
          depUpdates.push(
            `\n    * ${depName} bumped from ${origDepVer} to ${currentDepVer}`
          );
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
    return depUpdateNotes;
  }

  private updateChangelogEntry(
    exChangelog: string,
    changelogEntry: string,
    updatedManifest: CargoManifest
  ): string {
    const pkgVersion = updatedManifest.package?.version ?? '?';
    const pkgName = updatedManifest.package?.name ?? '?';

    changelogEntry = changelogEntry.replace(
      new RegExp(`^###? \\[${pkgVersion}\\].*### Dependencies`, 's'),
      '### Dependencies'
    );
    const match = exChangelog.match(
      new RegExp(
        `(?<before>^.*?###? \\[${pkgVersion}\\].*?\n)(?<after>###? [0-9[].*)`,
        's'
      )
    );
    if (!match) {
      this.log(
        `Appending update notes to end of changelog for ${pkgName}`,
        CheckpointType.Failure
      );
      changelogEntry = `${exChangelog}\n\n\n${changelogEntry}`;
    } else {
      const {before, after} = match.groups!;
      changelogEntry = `${before.trim()}\n\n\n${changelogEntry}\n\n${after.trim()}`;
    }
    return changelogEntry;
  }

  private async newChangelogEntry(
    changelogEntry: string,
    changelogPath: string,
    updatedManifest: CargoManifest
  ): Promise<string> {
    let changelog;
    try {
      changelog = (await this.gh.getFileContents(changelogPath)).parsedContent;
    } catch (e) {
      if (e.status !== 404) {
        this.log(
          `Failed to retrieve ${changelogPath}: ${e}`,
          CheckpointType.Failure
        );
        return '';
      } else {
        this.log(
          `Creating a new changelog at ${changelogPath}`,
          CheckpointType.Success
        );
      }
    }
    const changelogUpdater = new Changelog({
      path: changelogPath,
      changelogEntry,
      version: updatedManifest.package?.version ?? '?',
      packageName: updatedManifest.package?.name ?? '?',
    });
    return changelogUpdater.updateContent(changelog);
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
