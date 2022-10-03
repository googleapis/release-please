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
} from './workspace';
import {Version, VersionsMap} from '../version';
import {CandidateReleasePullRequest} from '../manifest';
import {PatchVersionUpdate} from '../versioning-strategy';
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
  pomContent: string;
}

const JAVA_RELEASE_TYPES = new Set(['java', 'java-bom', 'java-yoshi', 'maven']);
const XPATH_PROJECT_GROUP =
  '/*[local-name()="project"]/*[local-name()="groupId"]';
const XPATH_PROJECT_ARTIFACT =
  '/*[local-name()="project"]/*[local-name()="artifactId"]';
const XPATH_PROJECT_VERSION =
  '/*[local-name()="project"]/*[local-name()="version"]';
const XPATH_PROJECT_DEPENDENCIES =
  '/*[local-name()="project"]/*[local-name()="dependencies"]/*[local-name()="dependency"]';

export class MavenWorkspace extends WorkspacePlugin<MavenArtifact> {
  private async fetchPom(path: string): Promise<MavenArtifact | undefined> {
    const content = await this.github.getFileContentsOnBranch(
      path,
      this.targetBranch
    );
    const document = new dom.DOMParser().parseFromString(content.parsedContent);

    const groupNodes = xpath.select(XPATH_PROJECT_GROUP, document) as Node[];
    if (groupNodes.length === 0) {
      this.logger.warn(`Missing project.groupId in ${path}`);
      return;
    }
    const artifactNodes = xpath.select(
      XPATH_PROJECT_ARTIFACT,
      document
    ) as Node[];
    if (artifactNodes.length === 0) {
      this.logger.warn(`Missing project.artifactId in ${path}`);
      return;
    }
    const versionNodes = xpath.select(
      XPATH_PROJECT_VERSION,
      document
    ) as Node[];
    if (versionNodes.length === 0) {
      this.logger.warn(`Missing project.version in ${path}`);
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
    const groupId = groupNodes[0].firstChild!.textContent!;
    const artifactId = artifactNodes[0].firstChild!.textContent!;
    return {
      path,
      groupId,
      artifactId,
      name: `${groupId}:${artifactId}`,
      version: versionNodes[0].firstChild!.textContent!,
      dependencies,
      testDependencies,
      pomContent: content.parsedContent,
    };
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
        this.logger.info(
          `path '${path}' not configured, ignoring '${pomFile}'`
        );
        continue;
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

  protected async buildGraph(
    allPackages: MavenArtifact[]
  ): Promise<DependencyGraph<MavenArtifact>> {
    const artifactsByName = allPackages.reduce<Record<string, MavenArtifact>>(
      (collection, mavenArtifact) => {
        collection[mavenArtifact.name] = mavenArtifact;
        return collection;
      },
      {}
    );
    const graph = new Map<string, DependencyNode<MavenArtifact>>();
    for (const mavenArtifact of allPackages) {
      const allDeps = [
        ...mavenArtifact.dependencies,
        ...mavenArtifact.testDependencies,
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

  protected bumpVersion(artifact: MavenArtifact): Version {
    const version = Version.parse(artifact.version);
    return new PatchVersionUpdate().bump(version);
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
      title: PullRequestTitle.ofTargetBranch(this.targetBranch),
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
      headRefName: BranchName.ofTargetBranch(this.targetBranch).toString(),
      version,
      draft: false,
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
