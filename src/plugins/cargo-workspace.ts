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

import {CandidateReleasePullRequest, ROOT_PROJECT_PATH} from '../manifest';
import {
  WorkspacePlugin,
  DependencyGraph,
  DependencyNode,
  addPath,
  appendDependenciesSectionToChangelog,
} from './workspace';
import {
  CargoManifest,
  parseCargoManifest,
  CargoDependencies,
  CargoDependency,
  TargetDependencies,
} from '../updaters/rust/common';
import {VersionsMap, Version} from '../version';
import {CargoToml} from '../updaters/rust/cargo-toml';
import {RawContent} from '../updaters/raw-content';
import {Changelog} from '../updaters/changelog';
import {ReleasePullRequest} from '../release-pull-request';
import {PullRequestTitle} from '../util/pull-request-title';
import {PullRequestBody} from '../util/pull-request-body';
import {BranchName} from '../util/branch-name';
import {PatchVersionUpdate} from '../versioning-strategy';
import {CargoLock} from '../updaters/rust/cargo-lock';
import {ConfigurationError} from '../errors';

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
}

/**
 * The plugin analyzed a cargo workspace and will bump dependencies
 * of managed packages if those dependencies are being updated.
 *
 * If multiple rust packages are being updated, it will merge them
 * into a single rust package.
 */
export class CargoWorkspace extends WorkspacePlugin<CrateInfo> {
  protected async buildAllPackages(
    candidates: CandidateReleasePullRequest[]
  ): Promise<{
    allPackages: CrateInfo[];
    candidatesByPackage: Record<string, CandidateReleasePullRequest>;
  }> {
    const cargoManifestContent = await this.github.getFileContentsOnBranch(
      'Cargo.toml',
      this.changesBranch
    );
    const cargoManifest = parseCargoManifest(
      cargoManifestContent.parsedContent
    );
    if (!cargoManifest.workspace?.members) {
      this.logger.warn(
        "cargo-workspace plugin used, but top-level Cargo.toml isn't a cargo workspace"
      );
      return {allPackages: [], candidatesByPackage: {}};
    }

    const allCrates: CrateInfo[] = [];
    const candidatesByPackage: Record<string, CandidateReleasePullRequest> = {};

    const members = (
      await Promise.all(
        cargoManifest.workspace.members.map(member =>
          this.github.findFilesByGlobAndRef(member, this.changesBranch)
        )
      )
    ).flat();
    members.push(ROOT_PROJECT_PATH);

    for (const path of members) {
      const manifestPath = addPath(path, 'Cargo.toml');
      this.logger.info(`looking for candidate with path: ${path}`);
      const candidate = candidates.find(c => c.path === path);
      // get original content of the crate
      const manifestContent =
        candidate?.pullRequest.updates.find(
          update => update.path === manifestPath
        )?.cachedFileContents ||
        (await this.github.getFileContentsOnBranch(
          manifestPath,
          this.changesBranch
        ));
      const manifest = parseCargoManifest(manifestContent.parsedContent);
      const packageName = manifest.package?.name;
      if (!packageName) {
        this.logger.warn(
          `package manifest at ${manifestPath} is missing [package.name]`
        );
        continue;
      }
      if (candidate) {
        candidatesByPackage[packageName] = candidate;
      }

      const version = manifest.package?.version;
      if (!version) {
        throw new ConfigurationError(
          `package manifest at ${manifestPath} is missing [package.version]`,
          'cargo-workspace',
          `${this.github.repository.owner}/${this.github.repository.repo}`
        );
      } else if (typeof version !== 'string') {
        throw new ConfigurationError(
          `package manifest at ${manifestPath} has an invalid [package.version]`,
          'cargo-workspace',
          `${this.github.repository.owner}/${this.github.repository.repo}`
        );
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

  protected bumpVersion(pkg: CrateInfo): Version {
    const version = Version.parse(pkg.version);
    return new PatchVersionUpdate().bump(version);
  }

  protected updateCandidate(
    existingCandidate: CandidateReleasePullRequest,
    pkg: CrateInfo,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest {
    const version = updatedVersions.get(pkg.name);
    if (!version) {
      throw new Error(`Didn't find updated version for ${pkg.name}`);
    }
    const updater = new CargoToml({
      version,
      versionsMap: updatedVersions,
    });
    const updatedContent = updater.updateContent(pkg.manifestContent);
    const originalManifest = parseCargoManifest(pkg.manifestContent);
    const updatedManifest = parseCargoManifest(updatedContent);
    const dependencyNotes = getChangelogDepsNotes(
      originalManifest,
      updatedManifest
    );

    existingCandidate.pullRequest.updates =
      existingCandidate.pullRequest.updates.map(update => {
        if (update.path === addPath(existingCandidate.path, 'Cargo.toml')) {
          update.updater = new RawContent(updatedContent);
        } else if (update.updater instanceof Changelog && dependencyNotes) {
          update.updater.changelogEntry = appendDependenciesSectionToChangelog(
            update.updater.changelogEntry,
            dependencyNotes,
            this.logger
          );
        } else if (
          update.path === addPath(existingCandidate.path, 'Cargo.lock')
        ) {
          update.updater = new CargoLock(updatedVersions);
        }
        return update;
      });

    // append dependency notes
    if (dependencyNotes) {
      if (existingCandidate.pullRequest.body.releaseData.length > 0) {
        existingCandidate.pullRequest.body.releaseData[0].notes =
          appendDependenciesSectionToChangelog(
            existingCandidate.pullRequest.body.releaseData[0].notes,
            dependencyNotes,
            this.logger
          );
      } else {
        existingCandidate.pullRequest.body.releaseData.push({
          component: pkg.name,
          version: existingCandidate.pullRequest.version,
          notes: appendDependenciesSectionToChangelog(
            '',
            dependencyNotes,
            this.logger
          ),
        });
      }
    }
    return existingCandidate;
  }

  protected newCandidate(
    pkg: CrateInfo,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest {
    const version = updatedVersions.get(pkg.name);
    if (!version) {
      throw new Error(`Didn't find updated version for ${pkg.name}`);
    }
    const updater = new CargoToml({
      version,
      versionsMap: updatedVersions,
    });
    const updatedContent = updater.updateContent(pkg.manifestContent);
    const originalManifest = parseCargoManifest(pkg.manifestContent);
    const updatedManifest = parseCargoManifest(updatedContent);
    const dependencyNotes = getChangelogDepsNotes(
      originalManifest,
      updatedManifest
    );
    const pullRequest: ReleasePullRequest = {
      title: PullRequestTitle.ofTargetBranch(
        this.targetBranch,
        this.changesBranch
      ),
      body: new PullRequestBody([
        {
          component: pkg.name,
          version,
          notes: appendDependenciesSectionToChangelog(
            '',
            dependencyNotes,
            this.logger
          ),
        },
      ]),
      updates: [
        {
          path: addPath(pkg.path, 'Cargo.toml'),
          createIfMissing: false,
          updater: new RawContent(updatedContent),
        },
        {
          path: addPath(pkg.path, 'CHANGELOG.md'),
          createIfMissing: false,
          updater: new Changelog({
            version,
            changelogEntry: dependencyNotes,
          }),
        },
      ],
      labels: [],
      headRefName: BranchName.ofTargetBranch(
        this.targetBranch,
        this.changesBranch
      ).toString(),
      version,
      draft: false,
      conventionalCommits: [],
    };
    return {
      path: pkg.path,
      pullRequest,
      config: {
        releaseType: 'rust',
      },
    };
  }

  protected postProcessCandidates(
    candidates: CandidateReleasePullRequest[],
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest[] {
    let rootCandidate = candidates.find(c => c.path === ROOT_PROJECT_PATH);
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
      updater: new CargoLock(updatedVersions),
    });

    return candidates;
  }

  protected async buildGraph(
    allPackages: CrateInfo[]
  ): Promise<DependencyGraph<CrateInfo>> {
    const workspaceCrateNames = new Set(
      allPackages.map(crateInfo => crateInfo.name)
    );
    const graph = new Map<string, DependencyNode<CrateInfo>>();
    for (const crateInfo of allPackages) {
      const allDeps = Object.keys({
        ...(crateInfo.manifest.dependencies ?? {}),
        ...(crateInfo.manifest['dev-dependencies'] ?? {}),
        ...(crateInfo.manifest['build-dependencies'] ?? {}),
      });

      const targets = crateInfo.manifest.target;
      if (targets) {
        for (const targetName in targets) {
          const target = targets[targetName];

          allDeps.push(
            ...Object.keys({
              ...(target.dependencies ?? {}),
              ...(target['dev-dependencies'] ?? {}),
              ...(target['build-dependencies'] ?? {}),
            })
          );
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

  protected inScope(candidate: CandidateReleasePullRequest): boolean {
    return candidate.config.releaseType === 'rust';
  }

  protected packageNameFromPackage(pkg: CrateInfo): string {
    return pkg.name;
  }

  protected pathFromPackage(pkg: CrateInfo): string {
    return pkg.path;
  }
}

function getChangelogDepsNotes(
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
  type DepMap = Record<string, string>;
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

  type DepUpdates = Map<DT, Set<string>>;

  const populateUpdates = (
    originalScope: CargoManifest | TargetDependencies[string],
    updatedScope: CargoManifest | TargetDependencies[string],
    updates: DepUpdates
  ) => {
    for (const depType of depTypes) {
      const depUpdates = [];
      const pkgDepTypes = updatedScope[depType];

      if (pkgDepTypes === undefined) {
        continue;
      }
      for (const [depName, currentDepVer] of Object.entries(
        getDepMap(pkgDepTypes)
      )) {
        const origDepVer = depVer(originalScope[depType]?.[depName]);
        if (currentDepVer !== origDepVer) {
          depUpdates.push(
            `\n    * ${depName} bumped from ${origDepVer} to ${currentDepVer}`
          );
        }
      }
      if (depUpdates.length > 0) {
        const updatesForType = updates.get(depType) || new Set();
        depUpdates.forEach(update => updatesForType.add(update));
        updates.set(depType, updatesForType);
      }
    }
  };

  const updates: DepUpdates = new Map();

  populateUpdates(originalManifest, updatedManifest, updates);

  if (updatedManifest.target && originalManifest.target) {
    for (const targetName in updatedManifest.target) {
      populateUpdates(
        originalManifest.target[targetName],
        updatedManifest.target[targetName],
        updates
      );
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
