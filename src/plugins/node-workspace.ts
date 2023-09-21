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

import {PackageGraph} from '@lerna/package-graph';
import {
  Package as LernaPackage,
  RawManifest as PackageJson,
} from '@lerna/package';
import {GitHub} from '../github';
import {CandidateReleasePullRequest, RepositoryConfig} from '../manifest';
import {Version, VersionsMap} from '../version';
import {RawContent} from '../updaters/raw-content';
import {PullRequestTitle} from '../util/pull-request-title';
import {PullRequestBody} from '../util/pull-request-body';
import {ReleasePullRequest} from '../release-pull-request';
import {BranchName} from '../util/branch-name';
import {jsonStringify} from '../util/json-stringify';
import {Changelog} from '../updaters/changelog';
import {
  WorkspacePlugin,
  DependencyGraph,
  DependencyNode,
  WorkspacePluginOptions,
  appendDependenciesSectionToChangelog,
  addPath,
} from './workspace';
import {PatchVersionUpdate} from '../versioning-strategy';

class Package extends LernaPackage {
  constructor(
    public readonly rawContent: string,
    location: string,
    pkg?: PackageJson
  ) {
    super(pkg ?? JSON.parse(rawContent), location);
  }

  clone() {
    return new Package(this.rawContent, this.location, this.toJSON());
  }
}

interface NodeWorkspaceOptions extends WorkspacePluginOptions {
  alwaysLinkLocal?: boolean;
}

/**
 * The plugin analyzed a cargo workspace and will bump dependencies
 * of managed packages if those dependencies are being updated.
 *
 * If multiple node packages are being updated, it will merge them
 * into a single node package.
 */
export class NodeWorkspace extends WorkspacePlugin<Package> {
  private alwaysLinkLocal: boolean;
  private packageGraph?: PackageGraph;
  constructor(
    github: GitHub,
    targetBranch: string,
    manifestPath: string,
    repositoryConfig: RepositoryConfig,
    options: NodeWorkspaceOptions = {}
  ) {
    super(github, targetBranch, manifestPath, repositoryConfig, options);
    this.alwaysLinkLocal = options.alwaysLinkLocal === false ? false : true;
  }
  protected async buildAllPackages(
    candidates: CandidateReleasePullRequest[]
  ): Promise<{
    allPackages: Package[];
    candidatesByPackage: Record<string, CandidateReleasePullRequest>;
  }> {
    const candidatesByPath = new Map<string, CandidateReleasePullRequest>();
    for (const candidate of candidates) {
      candidatesByPath.set(candidate.path, candidate);
    }
    const candidatesByPackage: Record<string, CandidateReleasePullRequest> = {};

    const packagesByPath = new Map<string, Package>();
    for (const path in this.repositoryConfig) {
      const config = this.repositoryConfig[path];
      if (config.releaseType !== 'node') {
        continue;
      }
      const candidate = candidatesByPath.get(path);
      if (candidate) {
        this.logger.debug(
          `Found candidate pull request for path: ${candidate.path}`
        );
        const packagePath = addPath(candidate.path, 'package.json');
        const packageUpdate = candidate.pullRequest.updates.find(
          update => update.path === packagePath
        );
        if (packageUpdate?.cachedFileContents) {
          const pkg = new Package(
            packageUpdate.cachedFileContents.parsedContent,
            candidate.path
          );
          packagesByPath.set(candidate.path, pkg);
          candidatesByPackage[pkg.name] = candidate;
        } else {
          const contents = await this.github.getFileContentsOnBranch(
            packagePath,
            this.targetBranch
          );
          const pkg = new Package(contents.parsedContent, candidate.path);
          packagesByPath.set(candidate.path, pkg);
          candidatesByPackage[pkg.name] = candidate;
        }
      } else {
        const packagePath = addPath(path, 'package.json');
        this.logger.debug(
          `No candidate pull request for path: ${path} - inspect package from ${packagePath}`
        );
        const contents = await this.github.getFileContentsOnBranch(
          packagePath,
          this.targetBranch
        );
        packagesByPath.set(path, new Package(contents.parsedContent, path));
      }
    }
    const allPackages = Array.from(packagesByPath.values());
    this.packageGraph = new PackageGraph(
      allPackages,
      'allDependencies',
      this.alwaysLinkLocal
    );

    return {
      allPackages,
      candidatesByPackage,
    };
  }

  protected bumpVersion(pkg: Package): Version {
    const version = Version.parse(pkg.version);
    return new PatchVersionUpdate().bump(version);
  }

  protected updateCandidate(
    existingCandidate: CandidateReleasePullRequest,
    pkg: Package,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest {
    const graphPackage = this.packageGraph?.get(pkg.name);
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
        const currentVersion = this.combineDeps(pkg)?.[depName];
        const prefix = currentVersion
          ? this.detectRangePrefix(currentVersion)
          : '';
        updatedPackage.updateLocalDependency(
          resolved,
          depVersion.toString(),
          prefix
        );
        this.logger.info(
          `${pkg.name}.${depName} updated to ${prefix}${depVersion.toString()}`
        );
      }
    }
    const dependencyNotes = getChangelogDepsNotes(
      pkg,
      updatedPackage,
      updatedVersions
    );
    existingCandidate.pullRequest.updates =
      existingCandidate.pullRequest.updates.map(update => {
        if (update.path === addPath(existingCandidate.path, 'package.json')) {
          update.updater = new RawContent(
            jsonStringify(updatedPackage.toJSON(), updatedPackage.rawContent)
          );
        } else if (update.updater instanceof Changelog) {
          if (dependencyNotes) {
            update.updater.changelogEntry =
              appendDependenciesSectionToChangelog(
                update.updater.changelogEntry,
                dependencyNotes,
                this.logger
              );
          }
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
          component: updatedPackage.name,
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
    pkg: Package,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest {
    const graphPackage = this.packageGraph?.get(pkg.name);
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
        const currentVersion = this.combineDeps(pkg)?.[depName];
        const prefix = currentVersion
          ? this.detectRangePrefix(currentVersion)
          : '';
        updatedPackage.updateLocalDependency(
          resolved,
          depVersion.toString(),
          prefix
        );
        this.logger.info(
          `${pkg.name}.${depName} updated to ${prefix}${depVersion.toString()}`
        );
      }
    }
    const dependencyNotes = getChangelogDepsNotes(
      pkg,
      updatedPackage,
      updatedVersions
    );
    const packageJson = updatedPackage.toJSON() as PackageJson;
    const version = Version.parse(packageJson.version);
    const pullRequest: ReleasePullRequest = {
      title: PullRequestTitle.ofTargetBranch(
        this.targetBranch,
        this.changesBranch
      ),
      body: new PullRequestBody([
        {
          component: updatedPackage.name,
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
          path: addPath(updatedPackage.location, 'package.json'),
          createIfMissing: false,
          updater: new RawContent(
            jsonStringify(packageJson, updatedPackage.rawContent)
          ),
        },
        {
          path: addPath(updatedPackage.location, 'CHANGELOG.md'),
          createIfMissing: false,
          updater: new Changelog({
            version,
            changelogEntry: appendDependenciesSectionToChangelog(
              '',
              dependencyNotes,
              this.logger
            ),
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
      path: updatedPackage.location,
      pullRequest,
      config: {
        releaseType: 'node',
      },
    };
  }

  protected postProcessCandidates(
    candidates: CandidateReleasePullRequest[],
    _updatedVersions: VersionsMap
  ): CandidateReleasePullRequest[] {
    // NOP for node workspaces
    return candidates;
  }

  protected async buildGraph(
    allPackages: Package[]
  ): Promise<DependencyGraph<Package>> {
    const graph = new Map<string, DependencyNode<Package>>();
    const workspacePackageNames = new Set(
      allPackages.map(packageJson => packageJson.name)
    );
    for (const packageJson of allPackages) {
      const allDeps = Object.keys(this.combineDeps(packageJson));
      const workspaceDeps = allDeps.filter(dep =>
        workspacePackageNames.has(dep)
      );
      graph.set(packageJson.name, {
        deps: workspaceDeps,
        value: packageJson,
      });
    }

    return graph;
  }

  protected inScope(candidate: CandidateReleasePullRequest): boolean {
    return candidate.config.releaseType === 'node';
  }

  protected packageNameFromPackage(pkg: Package): string {
    return pkg.name;
  }

  protected pathFromPackage(pkg: Package): string {
    return pkg.location;
  }

  private detectRangePrefix(version: string): string {
    return (
      Object.values(SUPPORTED_RANGE_PREFIXES).find(supportedRangePrefix =>
        version.startsWith(supportedRangePrefix)
      ) || ''
    );
  }

  private combineDeps(packageJson: Package): Record<string, string> {
    return {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
      ...(packageJson.optionalDependencies ?? {}),
    };
  }
}

enum SUPPORTED_RANGE_PREFIXES {
  CARET = '^',
  TILDE = '~',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  EQUAL_OR_GREATER_THAN = '>=',
  EQUAL_OR_LESS_THAN = '<=',
}

function getChangelogDepsNotes(
  original: Package,
  updated: Package,
  updateVersions: VersionsMap
): string {
  let depUpdateNotes = '';
  type DT =
    | 'dependencies'
    | 'devDependencies'
    | 'peerDependencies'
    | 'optionalDependencies';
  const depTypes: DT[] = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ];
  const updates: Map<DT, string[]> = new Map();
  for (const depType of depTypes) {
    const depUpdates = [];
    const pkgDepTypes = updated[depType];
    if (pkgDepTypes === undefined) {
      continue;
    }
    for (const [depName, currentDepVer] of Object.entries(pkgDepTypes)) {
      const origDepVer = original[depType]?.[depName];
      if (currentDepVer !== origDepVer) {
        depUpdates.push(
          `\n    * ${depName} bumped from ${origDepVer} to ${currentDepVer}`
        );
        //handle case when "workspace:" version is used
      } else if (
        currentDepVer.startsWith('workspace:') &&
        updateVersions.get(depName) !== undefined
      ) {
        depUpdates.push(
          `\n    * ${depName} bumped to ${updateVersions
            .get(depName)
            ?.toString()}`
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
