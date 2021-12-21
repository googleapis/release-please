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

import {
  CandidateReleasePullRequest,
  RepositoryConfig,
  ROOT_PROJECT_PATH,
} from '../manifest';
import {logger} from '../util/logger';
import {
  WorkspacePlugin,
  DependencyGraph,
  DependencyNode,
  WorkspacePluginOptions,
} from './workspace';
import {
  CargoManifest,
  parseCargoManifest,
  CargoDependencies,
  CargoDependency,
} from '../updaters/rust/common';
import {VersionsMap, Version} from '../version';
import {GitHub} from '../github';
import {CargoToml} from '../updaters/rust/cargo-toml';
import {RawContent} from '../updaters/raw-content';
import {Changelog} from '../updaters/changelog';
import {ReleasePullRequest} from '../release-pull-request';
import {PullRequestTitle} from '../util/pull-request-title';
import {PullRequestBody} from '../util/pull-request-body';
import {BranchName} from '../util/branch-name';
import {PatchVersionUpdate} from '../versioning-strategy';

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
  constructor(
    github: GitHub,
    targetBranch: string,
    repositoryConfig: RepositoryConfig,
    options: WorkspacePluginOptions = {}
  ) {
    super(github, targetBranch, repositoryConfig, {
      ...options,
      updateAllPackages: true,
    });
  }
  protected async buildAllPackages(
    candidates: CandidateReleasePullRequest[]
  ): Promise<{
    allPackages: CrateInfo[];
    candidatesByPackage: Record<string, CandidateReleasePullRequest>;
  }> {
    const cargoManifestContent = await this.github.getFileContentsOnBranch(
      'Cargo.toml',
      this.targetBranch
    );
    const cargoManifest = parseCargoManifest(
      cargoManifestContent.parsedContent
    );
    if (!cargoManifest.workspace?.members) {
      logger.warn(
        "cargo-workspace plugin used, but top-level Cargo.toml isn't a cargo workspace"
      );
      return {allPackages: [], candidatesByPackage: {}};
    }

    const allCrates: CrateInfo[] = [];
    const candidatesByPackage: Record<string, CandidateReleasePullRequest> = {};
    for (const path of cargoManifest.workspace.members) {
      const manifestPath = addPath(path, 'Cargo.toml');
      logger.info(`looking for candidate with path: ${path}`);
      const candidate = candidates.find(c => c.path === path);
      // get original content of the crate
      const manifestContent =
        candidate?.pullRequest.updates.find(
          update => update.path === manifestPath
        )?.cachedFileContents ||
        (await this.github.getFileContentsOnBranch(
          manifestPath,
          this.targetBranch
        ));
      const manifest = parseCargoManifest(manifestContent.parsedContent);
      const packageName = manifest.package?.name;
      if (!packageName) {
        throw new Error(
          `package manifest at ${manifestPath} is missing [package.name]`
        );
      }
      if (candidate) {
        candidatesByPackage[packageName] = candidate;
      }

      const version = manifest.package?.version;
      if (!version) {
        throw new Error(
          `package manifest at ${manifestPath} is missing [package.version]`
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
        } else if (update.updater instanceof Changelog) {
          update.updater.changelogEntry = appendDependenciesSectionToChangelog(
            update.updater.changelogEntry,
            dependencyNotes
          );
        }
        return update;
      });

    // append dependency notes
    if (dependencyNotes) {
      if (existingCandidate.pullRequest.body.releaseData.length > 0) {
        existingCandidate.pullRequest.body.releaseData[0].notes =
          appendDependenciesSectionToChangelog(
            existingCandidate.pullRequest.body.releaseData[0].notes,
            dependencyNotes
          );
      } else {
        existingCandidate.pullRequest.body.releaseData.push({
          component: pkg.name,
          version: existingCandidate.pullRequest.version,
          notes: appendDependenciesSectionToChangelog('', dependencyNotes),
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
      title: PullRequestTitle.ofTargetBranch(this.targetBranch),
      body: new PullRequestBody([
        {
          component: pkg.name,
          version,
          notes: appendDependenciesSectionToChangelog('', dependencyNotes),
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
      headRefName: BranchName.ofTargetBranch(this.targetBranch).toString(),
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
      const workspaceDeps = allDeps.filter(dep => workspaceCrateNames.has(dep));
      graph.set(crateInfo.name, {
        deps: workspaceDeps,
        value: crateInfo,
      });
    }
    return graph;
  }

  protected inScope(candidate: CandidateReleasePullRequest): boolean {
    return (
      candidate.config.releaseType === 'rust' &&
      candidate.path !== ROOT_PROJECT_PATH
    );
  }

  protected packageNameFromPackage(pkg: CrateInfo): string {
    return pkg.name;
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

  if (depUpdateNotes) {
    return `* The following workspace dependencies were updated${depUpdateNotes}`;
  }
  return '';
}

const DEPENDENCY_HEADER = new RegExp('### Dependencies');
function appendDependenciesSectionToChangelog(
  changelog: string,
  notes: string
): string {
  if (!changelog) {
    return `### Dependencies\n\n${notes}`;
  }

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

function addPath(path: string, file: string): string {
  return path === ROOT_PROJECT_PATH ? file : `${path}/${file}`;
}
