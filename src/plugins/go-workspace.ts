// Copyright 2024 Google LLC
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
  DEFAULT_RELEASE_PLEASE_MANIFEST,
} from '../manifest';
import {
  WorkspacePlugin,
  WorkspacePluginOptions,
  DependencyGraph,
  DependencyNode,
  addPath,
  appendDependenciesSectionToChangelog,
} from './workspace';
import {parseGoWorkspace} from '../updaters/go/common';
import {VersionsMap, Version} from '../version';
import {GoMod} from '../updaters/go/go-mod';
import {RawContent} from '../updaters/raw-content';
import {Changelog} from '../updaters/changelog';
import {ReleasePullRequest} from '../release-pull-request';
import {PullRequestTitle} from '../util/pull-request-title';
import {PullRequestBody} from '../util/pull-request-body';
import {BranchName} from '../util/branch-name';
import {PatchVersionUpdate} from '../versioning-strategy';
import {Strategy} from '../strategy';
import {Release} from '../release';
import {GitHub} from '../github';
import {Commit} from '../commit';

interface GoModInfo {
  /**
   * e.g. `packages/goA`
   */
  path: string;

  /**
   * e.g. `example.com/packages/goA`
   */
  name: string;

  /**
   * e.g. `1.0.0`
   */
  version: string;

  /**
   * e.g. `packages/goA/go.mod`
   */
  modPath: string;

  /**
   * text content of the go.mod, used for updates
   */
  modContent: string;
}

interface GoWorkspaceOptions extends WorkspacePluginOptions {
  goWorkFile?: string;
}

/**
 * The plugin analyzes a go workspace and will bump dependencies
 * of managed packages if those dependencies are being updated.
 *
 * The plugin will also update the go.mod files with the new
 * dependencies.
 */
export class GoWorkspace extends WorkspacePlugin<GoModInfo> {
  private strategiesByPath: Record<string, Strategy> = {};
  private releasesByPath: Record<string, Release> = {};
  private readonly releaseManifestPath: string;
  private readonly goWorkPath: string;

  constructor(
    github: GitHub,
    targetBranch: string,
    repositoryConfig: RepositoryConfig,
    options: GoWorkspaceOptions = {}
  ) {
    super(github, targetBranch, repositoryConfig, options);
    this.releaseManifestPath =
      options.manifestPath ?? DEFAULT_RELEASE_PLEASE_MANIFEST;
    this.goWorkPath = options.goWorkFile || 'go.work';
  }

  protected bumpVersion(pkg: GoModInfo): Version {
    const version = Version.parse(pkg.version);
    const strategy = this.strategiesByPath[pkg.path];

    if (strategy) return strategy.versioningStrategy.bump(version, []);
    return new PatchVersionUpdate().bump(version);
  }

  protected updateCandidate(
    existingCandidate: CandidateReleasePullRequest,
    pkg: GoModInfo,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest {
    const version = updatedVersions.get(pkg.name);
    if (!version) {
      throw new Error("Didn't find updated version for ${pkg.name}");
    }
    const updater = new GoMod({
      version,
      versionsMap: updatedVersions,
    });
    const updatedContent = updater.updateContent(pkg.modContent);
    const dependencyNotes = getChangelogDepsNotes(
      pkg.modContent,
      updatedContent
    );

    existingCandidate.pullRequest.updates =
      existingCandidate.pullRequest.updates.map(update => {
        if (update.path === addPath(existingCandidate.path, 'go.mod')) {
          update.updater = new RawContent(updatedContent);
        } else if (update.updater instanceof Changelog && dependencyNotes) {
          update.updater.changelogEntry = appendDependenciesSectionToChangelog(
            update.updater.changelogEntry,
            dependencyNotes,
            this.logger
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

  protected async newCandidate(
    pkg: GoModInfo,
    updatedVersions: VersionsMap
  ): Promise<CandidateReleasePullRequest> {
    const newVersion = updatedVersions.get(pkg.name);
    if (!newVersion) {
      throw new Error(`Didn't find updated version for ${pkg.name}`);
    }
    const goModUpdater = new GoMod({
      version: newVersion,
      versionsMap: updatedVersions,
    });
    const updatedGoModContent = goModUpdater.updateContent(pkg.modContent);
    const dependencyNotes = getChangelogDepsNotes(
      pkg.modContent,
      updatedGoModContent
    );

    const updatedPackage = {
      ...pkg,
      version: newVersion.toString(),
    };

    const strategy = this.strategiesByPath[updatedPackage.path];
    const latestRelease = this.releasesByPath[updatedPackage.path];

    const basePullRequest = strategy
      ? await strategy.buildReleasePullRequest([], latestRelease, false, [], {
          newVersion: newVersion,
        })
      : undefined;

    if (basePullRequest) {
      return this.updateCandidate(
        {
          path: pkg.path,
          pullRequest: basePullRequest,
          config: {
            releaseType: 'go',
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
          path: addPath(updatedPackage.path, 'go.mod'),
          createIfMissing: false,
          updater: new RawContent(updatedGoModContent),
        },
        {
          path: addPath(updatedPackage.path, 'CHANGELOG.md'),
          createIfMissing: false,
          updater: new Changelog({
            version: newVersion,
            changelogEntry: dependencyNotes,
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
        releaseType: 'go',
      },
    };
  }

  /**
   * Collect all packages being managed in this workspace.
   * @param {CanididateReleasePullRequest[]} candidates Existing candidate pull
   *   requests
   * @returns {AllPackages<T>} The list of packages and candidates grouped by package name
   */
  protected async buildAllPackages(
    candidates: CandidateReleasePullRequest[]
  ): Promise<{
    allPackages: GoModInfo[];
    candidatesByPackage: Record<string, CandidateReleasePullRequest>;
  }> {
    const goWorkspaceContent = await this.github.getFileContentsOnBranch(
      this.goWorkPath,
      this.targetBranch
    );
    const goWorkspace = parseGoWorkspace(goWorkspaceContent.parsedContent);
    if (!goWorkspace?.members) {
      this.logger.warn('go-workspace plugin used, but found no use directives');
      return {allPackages: [], candidatesByPackage: {}};
    }

    const allPackages: GoModInfo[] = [];
    const candidatesByPackage: Record<string, CandidateReleasePullRequest> = {};

    const members = (
      await Promise.all(
        goWorkspace.members.map(member =>
          this.github.findFilesByGlobAndRef(member, this.targetBranch)
        )
      )
    ).flat();

    // Read the json file at releaseManifestPath
    const manifestContent = await this.github.getFileContentsOnBranch(
      this.releaseManifestPath,
      this.targetBranch
    );
    const manifest = JSON.parse(manifestContent.parsedContent);

    for (const path of members) {
      const goModPath = addPath(path, 'go.mod');
      this.logger.info(`looking for candidate with path: ${path}`);
      const candidate = candidates.find(c => c.path === path);
      // get original content of the module
      const moduleContent =
        candidate?.pullRequest.updates.find(update => update.path === goModPath)
          ?.cachedFileContents ||
        (await this.github.getFileContentsOnBranch(
          goModPath,
          this.targetBranch
        ));

      // Get path from the manifest
      const version = manifest[path];
      if (!version) {
        this.logger.warn(
          `package at ${path} not found in manifest at ${this.releaseManifestPath}`
        );
        continue;
      }

      // Package name is defined by module in moduleContent
      // e.g. module example.com/application/appname
      const modulePattern = /module (.+)/;
      const moduleMatch = modulePattern.exec(moduleContent.parsedContent);
      if (!moduleMatch) {
        this.logger.warn(`package at ${path} is missing a module declaration`);
        continue;
      }
      const packageName = moduleMatch[1];

      if (candidate) {
        candidatesByPackage[packageName] = candidate;
      }

      allPackages.push({
        path,
        name: packageName,
        version,
        modPath: goModPath,
        modContent: moduleContent.parsedContent,
      });
    }

    return {
      allPackages,
      candidatesByPackage,
    };
  }

  /**
   * Builds a graph of dependencies that have been touched
   * @param {T[]} allPackages All the packages in the workspace
   * @returns {DependencyGraph<T>} A map of package name to other workspace packages
   *   it depends on.
   */
  protected async buildGraph(
    allPackages: GoModInfo[]
  ): Promise<DependencyGraph<GoModInfo>> {
    const workspacePackageNames = new Set(allPackages.map(pkg => pkg.name));
    const graph = new Map<string, DependencyNode<GoModInfo>>();

    // Parses a go.mod file and returns a list of dependencies
    const parseDependencies = (content: string): string[] => {
      const depRegex = /(\S+)\s+v(\d+\.\d+\.\d+\S*)/gm;
      const deps: string[] = [];
      let match;
      while ((match = depRegex.exec(content)) !== null) {
        const [_, name] = match;
        deps.push(name);
      }
      return deps;
    };

    const addDependencies = (pkgName: string, modInfo: GoModInfo) => {
      const deps = parseDependencies(modInfo.modContent);
      // Direct dependencies that are also in the workspace
      const workspaceDeps = deps.filter(dep => workspacePackageNames.has(dep));
      graph.set(pkgName, {
        deps: workspaceDeps,
        value: modInfo,
      });

      for (const dep of workspaceDeps) {
        // If the dependency is not already in the graph, add it and its dependencies
        if (!graph.has(dep)) {
          const depInfo = allPackages.find(pkg => pkg.name === dep);
          if (depInfo) {
            addDependencies(dep, depInfo);
          }
        }
      }
    };

    for (const modInfo of allPackages) {
      if (!graph.has(modInfo.name)) {
        addDependencies(modInfo.name, modInfo);
      }
    }

    return graph;
  }

  protected inScope(candidate: CandidateReleasePullRequest): boolean {
    return candidate.config.releaseType === 'go';
  }

  protected packageNameFromPackage(pkg: GoModInfo): string {
    return pkg.name;
  }

  protected pathFromPackage(pkg: GoModInfo): string {
    return pkg.path;
  }

  protected postProcessCandidates(
    candidates: CandidateReleasePullRequest[],
    _: VersionsMap
  ): CandidateReleasePullRequest[] {
    // Nothing to do at this time
    return candidates;
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
  originalContent: string,
  updatedContent: string
): string {
  // Find dependency lines in the files
  // They contain like example.com/foo/bar v1.0.0
  // Iterate over the lines and build a list of dependencies
  // Do the same for the updated content
  const depRegex = /(\S+)\s+v?(\d+\.\d+\.\d+\S*)/gm;

  const parseDependencies = (content: string): Map<string, string> => {
    const deps = new Map<string, string>();
    let match;
    while ((match = depRegex.exec(content)) !== null) {
      const [_, name, version] = match;
      deps.set(name, version);
    }
    return deps;
  };

  const originalDeps = parseDependencies(originalContent);
  const updatedDeps = parseDependencies(updatedContent);

  const notes: string[] = [];

  // Find changed and new dependencies
  for (const [name, updatedVersion] of updatedDeps.entries()) {
    const originalVersion = originalDeps.get(name);
    if (!originalVersion) {
      notes.push(`* ${name} added ${updatedVersion}`);
    } else if (originalVersion !== updatedVersion) {
      notes.push(
        `* ${name} bumped from ${originalVersion} to ${updatedVersion}`
      );
    }
  }

  // Find removed dependencies
  for (const name of originalDeps.keys()) {
    if (!updatedDeps.has(name)) {
      notes.push(`* ${name} removed`);
    }
  }

  let depUpdateNotes = '';

  if (notes.length > 0) {
    for (const note of notes) {
      depUpdateNotes += `\n  ${note}`;
    }

    return `* The following workspace dependencies were updated${depUpdateNotes}`;
  }

  return '';
}
