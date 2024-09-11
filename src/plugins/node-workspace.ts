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

import {GitHub} from '../github';
import {CandidateReleasePullRequest, RepositoryConfig} from '../manifest';
import {PackageLockJson} from '../updaters/node/package-lock-json';
import {Version, VersionsMap} from '../version';
import {PullRequestTitle} from '../util/pull-request-title';
import {PullRequestBody} from '../util/pull-request-body';
import {ReleasePullRequest} from '../release-pull-request';
import {BranchName} from '../util/branch-name';
import {Changelog} from '../updaters/changelog';
import {
  WorkspacePlugin,
  DependencyGraph,
  DependencyNode,
  WorkspacePluginOptions,
  appendDependenciesSectionToChangelog,
  addPath,
} from './workspace';
import {Strategy} from '../strategy';
import {Commit} from '../commit';
import {Release} from '../release';
import {CompositeUpdater} from '../updaters/composite';
import {PackageJson, newVersionWithRange} from '../updaters/node/package-json';
import {Logger} from '../util/logger';
import {PatchVersionUpdate} from '../versioning-strategy';

interface ParsedPackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

interface Package {
  path: string;
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
  jsonContent: string;
}

interface NodeWorkspaceOptions extends WorkspacePluginOptions {
  alwaysLinkLocal?: boolean;
  updatePeerDependencies?: boolean;
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

  private strategiesByPath: Record<string, Strategy> = {};
  private releasesByPath: Record<string, Release> = {};

  readonly updatePeerDependencies: boolean;
  constructor(
    github: GitHub,
    targetBranch: string,
    repositoryConfig: RepositoryConfig,
    options: NodeWorkspaceOptions = {}
  ) {
    super(github, targetBranch, repositoryConfig, options);

    this.alwaysLinkLocal = options.alwaysLinkLocal === false ? false : true;
    this.updatePeerDependencies = options.updatePeerDependencies === true;
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
        const contents =
          packageUpdate?.cachedFileContents ??
          (await this.github.getFileContentsOnBranch(
            packagePath,
            this.targetBranch
          ));
        const packageJson: ParsedPackageJson = JSON.parse(
          contents.parsedContent
        );
        const pkg: Package = {
          name: packageJson.name,
          path,
          version: packageJson.version,
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {},
          peerDependencies: packageJson.peerDependencies || {},
          optionalDependencies: packageJson.optionalDependencies || {},
          jsonContent: contents.parsedContent,
        };
        packagesByPath.set(candidate.path, pkg);
        candidatesByPackage[pkg.name] = candidate;
        // }
      } else {
        const packagePath = addPath(path, 'package.json');
        this.logger.debug(
          `No candidate pull request for path: ${path} - inspect package from ${packagePath}`
        );
        const contents = await this.github.getFileContentsOnBranch(
          packagePath,
          this.targetBranch
        );
        const packageJson: ParsedPackageJson = JSON.parse(
          contents.parsedContent
        );
        const pkg: Package = {
          name: packageJson.name,
          path,
          version: packageJson.version,
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {},
          peerDependencies: packageJson.peerDependencies || {},
          optionalDependencies: packageJson.optionalDependencies || {},
          jsonContent: contents.parsedContent,
        };
        packagesByPath.set(path, pkg);
      }
    }
    const allPackages = Array.from(packagesByPath.values());
    return {
      allPackages,
      candidatesByPackage,
    };
  }

  protected bumpVersion(pkg: Package): Version {
    const version = Version.parse(pkg.version);
    const strategy = this.strategiesByPath[pkg.path];

    if (strategy) return strategy.versioningStrategy.bump(version, []);
    return new PatchVersionUpdate().bump(version);
  }

  protected updateCandidate(
    existingCandidate: CandidateReleasePullRequest,
    pkg: Package,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest {
    // Update version of the package
    const newVersion = updatedVersions.get(pkg.name);
    if (!newVersion) {
      throw new Error(`Didn't find updated version for ${pkg.name}`);
    }
    const updatedPackage = {
      ...pkg,
      version: newVersion.toString(),
    };

    const updater = new PackageJson({
      version: newVersion,
      versionsMap: updatedVersions,
      updatePeerDependencies: this.updatePeerDependencies,
    });
    const dependencyNotes = getChangelogDepsNotes(
      pkg,
      updatedPackage,
      updatedVersions,
      this.logger
    );

    existingCandidate.pullRequest.updates =
      existingCandidate.pullRequest.updates.map(update => {
        if (update.path === addPath(existingCandidate.path, 'package.json')) {
          update.updater = new CompositeUpdater(update.updater, updater);
        } else if (
          update.path === addPath(existingCandidate.path, 'package-lock.json')
        ) {
          update.updater = new PackageLockJson({
            version: newVersion,
            versionsMap: updatedVersions,
          });
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
  protected async newCandidate(
    pkg: Package,
    updatedVersions: VersionsMap
  ): Promise<CandidateReleasePullRequest> {
    // Update version of the package
    const newVersion = updatedVersions.get(pkg.name);
    if (!newVersion) {
      throw new Error(`Didn't find updated version for ${pkg.name}`);
    }
    const updatedPackage = {
      ...pkg,
      version: newVersion.toString(),
    };

    const dependencyNotes = getChangelogDepsNotes(
      pkg,
      updatedPackage,
      updatedVersions,
      this.logger
    );

    const strategy = this.strategiesByPath[updatedPackage.path];
    const latestRelease = this.releasesByPath[updatedPackage.path];

    const basePullRequest = strategy
      ? await strategy.buildReleasePullRequest([], latestRelease, false, [], {
          newVersion,
        })
      : undefined;

    if (basePullRequest) {
      return this.updateCandidate(
        {
          path: pkg.path,
          pullRequest: basePullRequest,
          config: {
            releaseType: 'node',
          },
        },
        pkg,
        updatedVersions
      );
    }

    const pullRequest: ReleasePullRequest = {
      title: PullRequestTitle.ofTargetBranch(this.targetBranch),
      body: new PullRequestBody([
        {
          component: updatedPackage.name,
          version: newVersion,
          notes: appendDependenciesSectionToChangelog(
            '',
            dependencyNotes,
            this.logger
          ),
        },
      ]),
      updates: [
        {
          path: addPath(updatedPackage.path, 'package.json'),
          createIfMissing: false,
          updater: new PackageJson({
            version: newVersion,
            versionsMap: updatedVersions,
            updatePeerDependencies: this.updatePeerDependencies,
          }),
        },
        {
          path: addPath(updatedPackage.path, 'package-lock.json'),
          createIfMissing: false,
          updater: new PackageJson({
            version: newVersion,
            versionsMap: updatedVersions,
            updatePeerDependencies: this.updatePeerDependencies,
          }),
        },
        {
          path: addPath(updatedPackage.path, 'CHANGELOG.md'),
          createIfMissing: false,
          updater: new Changelog({
            version: newVersion,
            changelogEntry: appendDependenciesSectionToChangelog(
              '',
              dependencyNotes,
              this.logger
            ),
          }),
        },
      ],
      labels: [],
      headRefName: BranchName.ofTargetBranch(this.targetBranch).toString(),
      version: newVersion,
      draft: false,
    };
    return {
      path: updatedPackage.path,
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
    if (candidates.length === 0) {
      return candidates;
    }

    const [candidate] = candidates;

    // check for root lock file in pull request
    let hasRootLockFile: boolean | undefined;
    for (let i = 0; i < candidate.pullRequest.updates.length; i++) {
      if (
        candidate.pullRequest.updates[i].path === '.package-lock.json' ||
        candidate.pullRequest.updates[i].path === './package-lock.json' ||
        candidate.pullRequest.updates[i].path === 'package-lock.json' ||
        candidate.pullRequest.updates[i].path === '/package-lock.json'
      ) {
        hasRootLockFile = true;
        break;
      }
    }

    // if there is a root lock file, then there is no additional pull request update necessary.
    if (hasRootLockFile) {
      return candidates;
    }

    candidate.pullRequest.updates.push({
      path: 'package-lock.json',
      createIfMissing: false,
      updater: new PackageLockJson({
        versionsMap: _updatedVersions,
      }),
    });

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
    return pkg.path;
  }

  private combineDeps(packageJson: Package): Record<string, string> {
    return {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
      ...(packageJson.optionalDependencies ?? {}),
      ...(this.updatePeerDependencies
        ? packageJson.peerDependencies ?? {}
        : {}),
    };
  }

  async preconfigure(
    strategiesByPath: Record<string, Strategy>,
    _commitsByPath: Record<string, Commit[]>,
    _releasesByPath: Record<string, Release>
  ): Promise<Record<string, Strategy>> {
    // Using preconfigure to siphon releases and strategies.
    this.strategiesByPath = strategiesByPath;
    this.releasesByPath = _releasesByPath;

    return strategiesByPath;
  }
}

function getChangelogDepsNotes(
  original: Package,
  updated: Package,
  updateVersions: VersionsMap,
  logger: Logger
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
      const newVersion = updateVersions.get(depName);
      if (!newVersion) {
        logger.debug(`${depName} was not bumped, ignoring`);
        continue;
      }
      const origDepVer = original[depType]?.[depName];
      const newVersionString = newVersionWithRange(origDepVer, newVersion);
      if (currentDepVer.startsWith('workspace:')) {
        depUpdates.push(`\n    * ${depName} bumped to ${newVersionString}`);
      } else if (newVersionString !== origDepVer) {
        depUpdates.push(
          `\n    * ${depName} bumped from ${origDepVer} to ${newVersionString}`
        );
        //handle case when "workspace:" version is used
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
