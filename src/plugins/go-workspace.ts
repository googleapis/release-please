import { CandidateReleasePullRequest, ROOT_PROJECT_PATH } from '../manifest';
import {
  WorkspacePlugin,
  DependencyGraph,
  DependencyNode,
  addPath,
  appendDependenciesSectionToChangelog,
} from './workspace';
import { parseGoWorkspace } from '../updaters/go/common';
import { VersionsMap, Version } from '../version';
import { GoMod } from '../updaters/go/go-mod';
import { RawContent } from '../updaters/raw-content';
import { Changelog } from '../updaters/changelog';
import { ReleasePullRequest } from '../release-pull-request';
import { PullRequestTitle } from '../util/pull-request-title';
import { PullRequestBody } from '../util/pull-request-body';
import { BranchName } from '../util/branch-name';
import { PatchVersionUpdate } from '../versioning-strategy';
import { Strategy } from '../strategy';
import { Release } from '../release';

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

  protected bumpVersion(pkg: GoModInfo): Version {
    const version = Version.parse(pkg.version);
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
    )

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
    const version = updatedVersions.get(pkg.name);
    if (!version) {
      throw new Error(`Didn't find updated version for ${pkg.name}`);
    }
    const updater = new GoMod({
      version,
      versionsMap: updatedVersions,
    });
    const updatedContent = updater.updateContent(pkg.modContent);
    const dependencyNotes = getChangelogDepsNotes(pkg.modContent, updatedContent);

    const updatedPackage = {
      ...pkg,
      version: version.toString(),
    }

    const strategy = this.strategiesByPath[updatedPackage.path];
    const latestRelease = this.releasesByPath[updatedPackage.path];
    const basePullRequest = strategy
      ? await strategy.buildReleasePullRequest([], latestRelease, false, [], {
        newVersion: version,
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
          path: addPath(pkg.path, 'go.mod'),
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
    }
    return {
      path: pkg.path,
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
      'go.workspace',
      this.targetBranch
    );
    const goWorkspace = parseGoWorkspace(goWorkspaceContent.parsedContent);
    if (!goWorkspace?.members) {
      this.logger.warn(
        "go-workspace plugin used, but top-level go.workspace isn't a go workspace"
      );
      return { allPackages: [], candidatesByPackage: {} };
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
    // TODO not needed I think...
    // members.push(ROOT_PROJECT_PATH);

    for (const path of members) {
      const goModPath = addPath(path, 'go.mod');
      this.logger.info(`looking for candidate with path: ${path}`);
      const candidate = candidates.find(c => c.path === path);
      // get original content of the module
      const moduleContent =
        candidate?.pullRequest.updates.find(
          update => update.path === goModPath
        )?.cachedFileContents ||
        (await this.github.getFileContentsOnBranch(
          goModPath,
          this.targetBranch
        ));

      // Package name is defined by module in moduleContent
      // e.g. module example.com/application/appname
      const moduleMatch = moduleContent.parsedContent.match(/module (.+)/);
      if (!moduleMatch) {
        this.logger.warn(
          `package at ${path} is missing a module declaration`
        );
        continue;
      }
      const packageName = moduleMatch[1];

      const changelogPath = addPath(path, 'CHANGELOG.md');
      // Read the changelog content
      // Find the first version mentioned and use as the latest version
      const changelogContent = await this.github.getFileContentsOnBranch(
        changelogPath,
        this.targetBranch
      );
      // Use a regular regex matcher
      const versionMatch = changelogContent.parsedContent.match(
        /## \[([0-9]+\.[0-9]+\.[0-9]+)\]/
      );
      if (!versionMatch) {
        this.logger.warn(
          `package at ${path} is missing a version in the changelog`
        );
        continue;
      }
      const version = versionMatch[1];

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
      candidatesByPackage
    }
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
    const workspacePackageNames = new Set(
      allPackages.map(pkg => pkg.name)
    );
    const graph = new Map<string, DependencyNode<GoModInfo>>();
    for (const modInfo of allPackages) {
      const deps = modInfo.modContent.match(
        /(.+) v([0-9]+\.[0-9]+\.[0-9]+)/g
      );

      const workspaceDeps = deps?.filter(dep => {
        const [depName] = dep.split(' ');
        return workspacePackageNames.has(depName);
      });

      graph.set(modInfo.name, {
        deps: workspaceDeps || [],
        value: modInfo,
      });
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
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest[] {
    // Nothing to do at this time
    return candidates;
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
  const depRegex = /(\S+)\s+v?(\d+\.\d+\.\d+)/gm;

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
      notes.push(`* Added dependency ${name} v${updatedVersion}`);
    } else if (originalVersion !== updatedVersion) {
      notes.push(`* Updated dependency ${name} from v${originalVersion} to v${updatedVersion}`);
    }
  }

  // Find removed dependencies
  for (const name of originalDeps.keys()) {
    if (!updatedDeps.has(name)) {
      notes.push(`* Removed dependency ${name}`);
    }
  }

  if (notes.length > 0) {
    // TODO formatting
    return notes.join('\n');
  }

  return ""
}