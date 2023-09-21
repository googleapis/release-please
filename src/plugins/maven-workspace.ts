// Copyright 2022 Google LLC
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
  WorkspacePlugin,
  AllPackages,
  DependencyGraph,
  DependencyNode,
  appendDependenciesSectionToChangelog,
  addPath,
  WorkspacePluginOptions,
} from './workspace';
import {Version, VersionsMap} from '../version';
import {CandidateReleasePullRequest, RepositoryConfig} from '../manifest';
import * as dom from '@xmldom/xmldom';
import * as xpath from 'xpath';
import {dirname} from 'path';
import {PomXml, parseDependencyNode} from '../updaters/java/pom-xml';
import {Changelog} from '../updaters/changelog';
import {ReleasePullRequest} from '../release-pull-request';
import {PullRequestTitle} from '../util/pull-request-title';
import {PullRequestBody} from '../util/pull-request-body';
import {BranchName} from '../util/branch-name';
import {logger as defaultLogger, Logger} from '../util/logger';
import {GitHub} from '../github';
import {JavaSnapshot} from '../versioning-strategies/java-snapshot';
import {AlwaysBumpPatch} from '../versioning-strategies/always-bump-patch';
import {ConventionalCommit} from '../commit';
import {CompositeUpdater} from '../updaters/composite';

interface Gav {
  groupId: string;
  artifactId: string;
  version: string;
}

interface MavenArtifact extends Gav {
  path: string;
  name: string;
  dependencies: Gav[];
  testDependencies: Gav[];
  managedDependencies: Gav[];
  pomContent: string;
}

interface MavenWorkspacePluginOptions extends WorkspacePluginOptions {
  considerAllArtifacts?: boolean;
}

const JAVA_RELEASE_TYPES = new Set([
  'java',
  'java-bom',
  'java-yoshi',
  'java-yoshi-mono-repo',
  'maven',
]);
const XPATH_PROJECT_GROUP =
  '/*[local-name()="project"]/*[local-name()="groupId"]';
const XPATH_PROJECT_ARTIFACT =
  '/*[local-name()="project"]/*[local-name()="artifactId"]';
const XPATH_PROJECT_VERSION =
  '/*[local-name()="project"]/*[local-name()="version"]';
const XPATH_PROJECT_DEPENDENCIES =
  '/*[local-name()="project"]/*[local-name()="dependencies"]/*[local-name()="dependency"]';
const XPATH_PROJECT_DEPENDENCY_MANAGEMENT_DEPENDENCIES =
  '/*[local-name()="project"]/*[local-name()="dependencyManagement"]/*[local-name()="dependencies"]/*[local-name()="dependency"]';

export class MavenWorkspace extends WorkspacePlugin<MavenArtifact> {
  readonly considerAllArtifacts: boolean;
  constructor(
    github: GitHub,
    targetBranch: string,
    manifestPath: string,
    repositoryConfig: RepositoryConfig,
    options: MavenWorkspacePluginOptions = {}
  ) {
    super(github, targetBranch, manifestPath, repositoryConfig, options);
    this.considerAllArtifacts = options.considerAllArtifacts ?? true;
  }
  private async fetchPom(path: string): Promise<MavenArtifact | undefined> {
    const content = await this.github.getFileContentsOnBranch(
      path,
      this.targetBranch
    );
    return parseMavenArtifact(content.parsedContent, path, this.logger);
  }

  protected async buildAllPackages(
    candidates: CandidateReleasePullRequest[]
  ): Promise<AllPackages<MavenArtifact>> {
    const allPackages: MavenArtifact[] = [];
    const candidatesByPackage: Record<string, CandidateReleasePullRequest> = {};
    // find all pom.xml files and build a dependency graph
    const pomFiles = await this.github.findFilesByFilenameAndRef(
      'pom.xml',
      this.targetBranch
    );
    for (const pomFile of pomFiles) {
      const path = dirname(pomFile);
      const config = this.repositoryConfig[path];
      if (!config) {
        if (!this.considerAllArtifacts) {
          this.logger.info(
            `path '${path}' not configured, ignoring '${pomFile}'`
          );
          continue;
        }
        this.logger.info(
          `path '${path}' not configured, but 'considerAllArtifacts' option enabled`
        );
      }
      const mavenArtifact = await this.fetchPom(pomFile);
      if (!mavenArtifact) {
        continue;
      }
      allPackages.push(mavenArtifact);
      const candidate = candidates.find(candidate => candidate.path === path);
      if (candidate) {
        candidatesByPackage[this.packageNameFromPackage(mavenArtifact)] =
          candidate;
      } else {
        this.logger.warn(
          `found ${pomFile} in path ${path}, but did not find an associated candidate PR`
        );
      }
    }
    return {
      allPackages,
      candidatesByPackage,
    };
  }

  /**
   * Our maven components can have multiple artifacts if using
   * `considerAllArtifacts`. Find the candidate release for the component
   * that contains that maven artifact.
   * @param {MavenArtifact} pkg The artifact to search for
   * @param {Record<string, CandidateReleasePullRequest} candidatesByPackage
   *   The candidate pull requests indexed by the package name.
   * @returns {CandidateReleasePullRequest | undefined} The associated
   *   candidate release or undefined if there is no existing release yet
   */
  protected findCandidateForPackage(
    pkg: MavenArtifact,
    candidatesByPackage: Record<string, CandidateReleasePullRequest>
  ): CandidateReleasePullRequest | undefined {
    this.logger.debug(`Looking for existing candidate for ${pkg.name}`);
    const packageName = this.packageNameFromPackage(pkg);
    const existingCandidate = candidatesByPackage[packageName];
    if (existingCandidate) {
      return existingCandidate;
    }

    // fall back to finding the nearest candidate for that artifact
    return Object.values(candidatesByPackage).find(candidate =>
      pkg.path.startsWith(`${candidate.path}/`)
    );
  }

  /**
   * Helper to determine which packages we will use to base our search
   * for touched packages upon. These are usually the packages that
   * have candidate pull requests open.
   *
   * If you configure `updateAllPackages`, we fill force update all
   * packages as if they had a release.
   * @param {DependencyGraph<T>} graph All the packages in the repository
   * @param {Record<string, CandidateReleasePullRequest} candidatesByPackage
   *   The candidate pull requests indexed by the package name.
   * @returns {string[]} Package names to
   */
  protected packageNamesToUpdate(
    graph: DependencyGraph<MavenArtifact>,
    candidatesByPackage: Record<string, CandidateReleasePullRequest>
  ): string[] {
    if (this.considerAllArtifacts) {
      const candidatePaths = Object.values(candidatesByPackage).map(
        candidate => candidate.path
      );
      // Find artifacts that are in an existing candidate release
      return Array.from(graph.values())
        .filter(({value}) =>
          candidatePaths.find(
            path => value.path === path || value.path.startsWith(`${path}/`)
          )
        )
        .map(({value}) => this.packageNameFromPackage(value));
    }
    return super.packageNamesToUpdate(graph, candidatesByPackage);
  }

  /**
   * Helper to build up all the versions we are modifying in this
   * repository.
   * @param {DependencyGraph<T>} graph All the packages in the repository
   * @param {T[]} orderedPackages A list of packages that are currently
   *   updated by the existing candidate pull requests
   * @param {Record<string, CandidateReleasePullRequest} candidatesByPackage
   *   The candidate pull requests indexed by the package name.
   * @returns A map of all updated versions (package name => Version) and a
   *   map of all updated versions (component path => Version).
   */
  protected async buildUpdatedVersions(
    _graph: DependencyGraph<MavenArtifact>,
    orderedPackages: MavenArtifact[],
    candidatesByPackage: Record<string, CandidateReleasePullRequest>
  ): Promise<{updatedVersions: VersionsMap; updatedPathVersions: VersionsMap}> {
    const updatedVersions: VersionsMap = new Map();
    const updatedPathVersions: VersionsMap = new Map();

    // Look for updated pom.xml files
    for (const [_, candidate] of Object.entries(candidatesByPackage)) {
      const pomUpdates = candidate.pullRequest.updates.filter(update =>
        update.path.endsWith('pom.xml')
      );
      for (const pomUpdate of pomUpdates) {
        if (!pomUpdate.cachedFileContents) {
          pomUpdate.cachedFileContents =
            await this.github.getFileContentsOnBranch(
              pomUpdate.path,
              this.targetBranch
            );
        }
        if (pomUpdate.cachedFileContents) {
          // pre-run the version updater on this artifact and extract the
          // new version
          const updatedArtifact = parseMavenArtifact(
            pomUpdate.updater.updateContent(
              pomUpdate.cachedFileContents.parsedContent
            ),
            pomUpdate.path,
            this.logger
          );
          if (updatedArtifact) {
            this.logger.debug(
              `updating ${updatedArtifact.name} to ${updatedArtifact.version}`
            );
            updatedVersions.set(
              updatedArtifact.name,
              Version.parse(updatedArtifact.version)
            );
          }
        } else {
          this.logger.warn(`${pomUpdate.path} does not have cached contents`);
        }
      }
      if (
        candidate.pullRequest.version &&
        this.isReleaseVersion(candidate.pullRequest.version)
      ) {
        updatedPathVersions.set(candidate.path, candidate.pullRequest.version);
      }
    }

    for (const pkg of orderedPackages) {
      const packageName = this.packageNameFromPackage(pkg);
      this.logger.debug(`Looking for next version for: ${packageName}`);

      const existingCandidate = candidatesByPackage[packageName];
      if (existingCandidate) {
        const version = existingCandidate.pullRequest.version!;
        this.logger.debug(`version: ${version} from release-please`);
        updatedVersions.set(packageName, version);
      } else {
        const version = this.bumpVersion(pkg);
        if (updatedVersions.get(packageName)) {
          this.logger.debug('version already set');
        } else {
          this.logger.debug(`version: ${version} forced bump`);
          updatedVersions.set(packageName, version);
          if (this.isReleaseVersion(version)) {
            updatedPathVersions.set(this.pathFromPackage(pkg), version);
          }
        }
      }
    }

    return {
      updatedVersions,
      updatedPathVersions,
    };
  }

  protected async buildGraph(
    allPackages: MavenArtifact[]
  ): Promise<DependencyGraph<MavenArtifact>> {
    this.logger.trace('building graph', allPackages);
    const artifactsByName = allPackages.reduce<Record<string, MavenArtifact>>(
      (collection, mavenArtifact) => {
        collection[mavenArtifact.name] = mavenArtifact;
        return collection;
      },
      {}
    );
    this.logger.trace('artifacts by name', artifactsByName);
    const graph = new Map<string, DependencyNode<MavenArtifact>>();
    for (const mavenArtifact of allPackages) {
      const allDeps = [
        ...mavenArtifact.dependencies,
        ...mavenArtifact.testDependencies,
        ...mavenArtifact.managedDependencies,
      ];
      const workspaceDeps = allDeps.filter(
        dep => artifactsByName[packageNameFromGav(dep)]
      );
      graph.set(mavenArtifact.name, {
        deps: workspaceDeps.map(dep => packageNameFromGav(dep)),
        value: mavenArtifact,
      });
    }
    return graph;
  }

  /**
   * Given a release version, determine if we should bump the manifest
   * version as well. For maven artifacts, SNAPSHOT versions are not
   * considered releases.
   * @param {Version} version The release version
   */
  protected isReleaseVersion(version: Version): boolean {
    return !version.preRelease?.includes('SNAPSHOT');
  }

  protected bumpVersion(artifact: MavenArtifact): Version {
    const strategy = new JavaSnapshot(new AlwaysBumpPatch());
    return strategy.bump(Version.parse(artifact.version), [FAKE_COMMIT]);
  }

  protected updateCandidate(
    existingCandidate: CandidateReleasePullRequest,
    artifact: MavenArtifact,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest {
    const version = updatedVersions.get(artifact.name);
    if (!version) {
      throw new Error(`Didn't find updated version for ${artifact.name}`);
    }

    const updater = new PomXml(version, updatedVersions);
    const dependencyNotes = getChangelogDepsNotes(
      artifact,
      updater,
      updatedVersions,
      this.logger
    );

    existingCandidate.pullRequest.updates =
      existingCandidate.pullRequest.updates.map(update => {
        if (update.path === addPath(existingCandidate.path, 'pom.xml')) {
          update.updater = new CompositeUpdater(update.updater, updater);
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
          component: artifact.name,
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
    artifact: MavenArtifact,
    updatedVersions: VersionsMap
  ): CandidateReleasePullRequest {
    const version = updatedVersions.get(artifact.name);
    if (!version) {
      throw new Error(`Didn't find updated version for ${artifact.name}`);
    }
    const updater = new PomXml(version, updatedVersions);
    const dependencyNotes = getChangelogDepsNotes(
      artifact,
      updater,
      updatedVersions,
      this.logger
    );
    const pullRequest: ReleasePullRequest = {
      title: PullRequestTitle.ofTargetBranch(
        this.targetBranch,
        this.changesBranch
      ),
      body: new PullRequestBody([
        {
          component: artifact.name,
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
          path: addPath(artifact.path, 'pom.xml'),
          createIfMissing: false,
          updater,
        },
        {
          path: addPath(artifact.path, 'CHANGELOG.md'),
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
      path: artifact.path,
      pullRequest,
      config: {
        releaseType: 'maven',
      },
    };
  }
  protected inScope(candidate: CandidateReleasePullRequest): boolean {
    return JAVA_RELEASE_TYPES.has(candidate.config.releaseType);
  }
  protected packageNameFromPackage(artifact: MavenArtifact): string {
    return artifact.name;
  }
  protected pathFromPackage(artifact: MavenArtifact): string {
    return artifact.path;
  }
  protected postProcessCandidates(
    candidates: CandidateReleasePullRequest[],
    _updatedVersions: VersionsMap
  ): CandidateReleasePullRequest[] {
    // NOP for maven workspaces
    return candidates;
  }
}

function packageNameFromGav(gav: Gav): string {
  return `${gav.groupId}:${gav.artifactId}`;
}

function getChangelogDepsNotes(
  artifact: MavenArtifact,
  updater: PomXml,
  updatedVersions: VersionsMap,
  logger: Logger = defaultLogger
): string {
  const document = new dom.DOMParser().parseFromString(artifact.pomContent);
  const dependencyUpdates = updater.dependencyUpdates(
    document,
    updatedVersions
  );
  const depUpdateNotes = [];
  for (const dependencyUpdate of dependencyUpdates) {
    depUpdateNotes.push(
      `\n    * ${dependencyUpdate.name} bumped to ${dependencyUpdate.version}`
    );
    logger.info(
      `bumped ${dependencyUpdate.name} to ${dependencyUpdate.version}`
    );
  }
  if (depUpdateNotes.length > 0) {
    return `* The following workspace dependencies were updated${depUpdateNotes.join()}`;
  }
  return '';
}

/**
 * Helper to parse a pom.xml file and extract important fields
 * @param {string} pomContent The XML contents as a string
 * @param {string} path The path to the file in the repository including the filename.
 * @param {Logger} logger Context logger
 * @returns {MavenArtifact | undefined} Returns undefined if we are missing key
 *   attributes. We log a warning in these cases.
 */
function parseMavenArtifact(
  pomContent: string,
  path: string,
  logger: Logger
): MavenArtifact | undefined {
  const document = new dom.DOMParser().parseFromString(pomContent);

  const groupNodes = xpath.select(XPATH_PROJECT_GROUP, document) as Node[];
  if (groupNodes.length === 0) {
    logger.warn(`Missing project.groupId in ${path}`);
    return;
  }
  const artifactNodes = xpath.select(
    XPATH_PROJECT_ARTIFACT,
    document
  ) as Node[];
  if (artifactNodes.length === 0) {
    logger.warn(`Missing project.artifactId in ${path}`);
    return;
  }
  const versionNodes = xpath.select(XPATH_PROJECT_VERSION, document) as Node[];
  if (versionNodes.length === 0) {
    logger.warn(`Missing project.version in ${path}`);
    return;
  }
  const dependencies: Gav[] = [];
  const testDependencies: Gav[] = [];
  for (const dependencyNode of xpath.select(
    XPATH_PROJECT_DEPENDENCIES,
    document
  ) as Node[]) {
    const parsedNode = parseDependencyNode(dependencyNode);
    if (!parsedNode.version) {
      continue;
    }
    if (parsedNode.scope === 'test') {
      testDependencies.push({
        groupId: parsedNode.groupId,
        artifactId: parsedNode.artifactId,
        version: parsedNode.version,
      });
    } else {
      dependencies.push({
        groupId: parsedNode.groupId,
        artifactId: parsedNode.artifactId,
        version: parsedNode.version,
      });
    }
  }
  const managedDependencies: Gav[] = [];
  for (const dependencyNode of xpath.select(
    XPATH_PROJECT_DEPENDENCY_MANAGEMENT_DEPENDENCIES,
    document
  ) as Node[]) {
    const parsedNode = parseDependencyNode(dependencyNode);
    if (!parsedNode.version) {
      continue;
    }
    managedDependencies.push({
      groupId: parsedNode.groupId,
      artifactId: parsedNode.artifactId,
      version: parsedNode.version,
    });
  }
  const groupId = groupNodes[0].firstChild!.textContent!;
  const artifactId = artifactNodes[0].firstChild!.textContent!;
  return {
    path: dirname(path),
    groupId,
    artifactId,
    name: `${groupId}:${artifactId}`,
    version: versionNodes[0].firstChild!.textContent!,
    dependencies,
    testDependencies,
    managedDependencies,
    pomContent,
  };
}

// We use a fake commit to leverage the Java versioning strategy
// (it should be a patch version bump and potentially remove the
// -SNAPSHOT portion of the version)
const FAKE_COMMIT: ConventionalCommit = {
  message: 'fix: fake fix',
  type: 'fix',
  scope: null,
  notes: [],
  references: [],
  bareMessage: 'fake fix',
  breaking: false,
  sha: 'abc123',
  files: [],
};
