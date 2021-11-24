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
import {Package as LernaPackage, PackageJson} from '@lerna/package';
import {GitHub} from '../github';
import {logger} from '../util/logger';
import {
  CandidateReleasePullRequest,
  RepositoryConfig,
  ROOT_PROJECT_PATH,
} from '../manifest';
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
} from './workspace';

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
    repositoryConfig: RepositoryConfig,
    options: NodeWorkspaceOptions = {}
  ) {
    super(github, targetBranch, repositoryConfig, options);
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
        logger.debug(
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
        logger.debug(
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
    version.patch += 1;
    return version;
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
    for (const [depName, resolved] of graphPackage.localDependencies) {
      const depVersion = updatedVersions.get(depName);
      if (depVersion && resolved.type !== 'directory') {
        updatedPackage.updateLocalDependency(
          resolved,
          depVersion.toString(),
          '^'
        );
        logger.info(
          `${pkg.name}.${depName} updated to ^${depVersion.toString()}`
        );
      }
    }
    const dependencyNotes = getChangelogDepsNotes(pkg, updatedPackage);
    existingCandidate.pullRequest.updates =
      existingCandidate.pullRequest.updates.map(update => {
        if (update.path === addPath(existingCandidate.path, 'package.json')) {
          update.updater = new RawContent(
            jsonStringify(updatedPackage.toJSON(), updatedPackage.rawContent)
          );
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
          component: updatedPackage.name,
          version: existingCandidate.pullRequest.version,
          notes: appendDependenciesSectionToChangelog('', dependencyNotes),
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
    for (const [depName, resolved] of graphPackage.localDependencies) {
      const depVersion = updatedVersions.get(depName);
      if (depVersion && resolved.type !== 'directory') {
        updatedPackage.updateLocalDependency(
          resolved,
          depVersion.toString(),
          '^'
        );
        logger.info(
          `${pkg.name}.${depName} updated to ^${depVersion.toString()}`
        );
      }
    }
    const dependencyNotes = getChangelogDepsNotes(pkg, updatedPackage);
    const packageJson = updatedPackage.toJSON() as PackageJson;
    const version = Version.parse(packageJson.version);
    const pullRequest: ReleasePullRequest = {
      title: PullRequestTitle.ofTargetBranch(this.targetBranch),
      body: new PullRequestBody([
        {
          component: updatedPackage.name,
          version,
          notes: appendDependenciesSectionToChangelog('', dependencyNotes),
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
      path: updatedPackage.location,
      pullRequest,
      config: {
        releaseType: 'node',
      },
    };
  }

  protected async buildGraph(
    allPackages: Package[]
  ): Promise<DependencyGraph<Package>> {
    const graph = new Map<string, DependencyNode<Package>>();
    const workspacePackageNames = new Set(
      allPackages.map(packageJson => packageJson.name)
    );
    for (const packageJson of allPackages) {
      const allDeps = Object.keys({
        ...(packageJson.dependencies ?? {}),
        ...(packageJson.devDependencies ?? {}),
        ...(packageJson.optionalDependencies ?? {}),
        ...(packageJson.peerDependencies ?? {}),
      });
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
    return (
      candidate.config.releaseType === 'node' &&
      candidate.path !== ROOT_PROJECT_PATH
    );
  }

  protected packageNameFromPackage(pkg: Package): string {
    return pkg.name;
  }
}

function getChangelogDepsNotes(original: Package, updated: Package): string {
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
