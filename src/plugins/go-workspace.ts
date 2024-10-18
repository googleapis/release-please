
import { CandidateReleasePullRequest, ROOT_PROJECT_PATH } from '../manifest';
import {
  WorkspacePlugin,
  DependencyGraph,
  DependencyNode,
  addPath,
  appendDependenciesSectionToChangelog,
  AllPackages,
} from './workspace';
import {
  CargoManifest,
  parseCargoManifest,
  CargoDependencies,
  CargoDependency,
  TargetDependencies,
} from '../updaters/rust/common';
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
import { ConfigurationError } from '../errors';
import { Strategy } from '../strategy';
import { Commit } from '../commit';
import { Release } from '../release';

interface GoModInfo {
  /**
   * e.g. `libs/go-a`
   */
  path: string;

  /**
   * e.g. `go-a`
   */
  name: string;

  /**
   * e.g. `1.0.0`
   */
  version: string;

  /**
   * e.g. `libs/go-a/go.mod`
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
    updatedVersions: VersionsMap,
  ): CandidateReleasePullRequest {
    throw new Error('Method not implemented.');
  }

  protected newCandidate(
    pkg: GoModInfo,
    updatedVersions: VersionsMap,
  ): Promise<CandidateReleasePullRequest> {
    throw new Error('Method not implemented.');
  }

  protected buildAllPackages(
    candidates: CandidateReleasePullRequest[],
  ): Promise<AllPackages<GoModInfo>> {
    throw new Error('Method not implemented.');
  }

  protected buildGraph(
    allPackages: GoModInfo[],
  ): Promise<DependencyGraph<GoModInfo>> {
    throw new Error('Method not implemented.');
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
    updatedVersions: VersionsMap,
  ): CandidateReleasePullRequest[] {
    throw new Error('Method not implemented.');
  }
}
