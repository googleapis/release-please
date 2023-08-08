import { ManifestPlugin } from '../plugin';
import { CandidateReleasePullRequest, RepositoryConfig } from '../manifest';
import { Logger } from '../util/logger';
import { VersionsMap, Version } from '../version';
import { GitHub } from '../github';
export type DependencyGraph<T> = Map<string, DependencyNode<T>>;
export interface DependencyNode<T> {
    deps: string[];
    value: T;
}
export interface WorkspacePluginOptions {
    manifestPath?: string;
    updateAllPackages?: boolean;
    merge?: boolean;
    logger?: Logger;
}
export interface AllPackages<T> {
    allPackages: T[];
    candidatesByPackage: Record<string, CandidateReleasePullRequest>;
}
/**
 * The plugin generalizes the logic for handling a workspace and
 * will bump dependencies of managed packages if those dependencies
 * are being updated.
 *
 * If multiple in-scope packages are being updated, it will merge them
 * into a single package.
 *
 * This class is templatized with `T` which should be information about
 * the package including the name and current version.
 */
export declare abstract class WorkspacePlugin<T> extends ManifestPlugin {
    private updateAllPackages;
    private manifestPath;
    private merge;
    constructor(github: GitHub, targetBranch: string, repositoryConfig: RepositoryConfig, options?: WorkspacePluginOptions);
    run(candidates: CandidateReleasePullRequest[]): Promise<CandidateReleasePullRequest[]>;
    /**
     * Helper for finding a candidate release based on the package name.
     * By default, we assume that the package name matches the release
     * component.
     * @param {T} pkg The package being released
     * @param {Record<string, CandidateReleasePullRequest} candidatesByPackage
     *   The candidate pull requests indexed by the package name.
     * @returns {CandidateReleasePullRequest | undefined} The associated
     *   candidate release or undefined if there is no existing release yet
     */
    protected findCandidateForPackage(pkg: T, candidatesByPackage: Record<string, CandidateReleasePullRequest>): CandidateReleasePullRequest | undefined;
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
    protected packageNamesToUpdate(graph: DependencyGraph<T>, candidatesByPackage: Record<string, CandidateReleasePullRequest>): string[];
    /**
     * Helper to build up all the versions we are modifying in this
     * repository.
     * @param {DependencyGraph<T>} _graph All the packages in the repository
     * @param {T[]} orderedPackages A list of packages that are currently
     *   updated by the existing candidate pull requests
     * @param {Record<string, CandidateReleasePullRequest} candidatesByPackage
     *   The candidate pull requests indexed by the package name.
     * @returns A map of all updated versions (package name => Version) and a
     *   map of all updated versions (component path => Version).
     */
    protected buildUpdatedVersions(_graph: DependencyGraph<T>, orderedPackages: T[], candidatesByPackage: Record<string, CandidateReleasePullRequest>): Promise<{
        updatedVersions: VersionsMap;
        updatedPathVersions: VersionsMap;
    }>;
    /**
     * Given a release version, determine if we should bump the manifest
     * version as well.
     * @param {Version} _version The release version
     */
    protected isReleaseVersion(_version: Version): boolean;
    /**
     * Given a package, return the new bumped version after updating
     * the dependency.
     * @param {T} pkg The package being updated
     */
    protected abstract bumpVersion(pkg: T): Version;
    /**
     * Update an existing candidate pull request to append new
     * dependency updates into the versions and changelog.
     * @param {CandidateReleasePullRequest} existingCandidate The existing
     *   candidate pull request.
     * @param {T} pkg The package being updated
     * @param {VersionsMap} updatedVersions Map of package name => version to
     *   update.
     * @returns {CandidateReleasePullRequest} The updated pull request
     */
    protected abstract updateCandidate(existingCandidate: CandidateReleasePullRequest, pkg: T, updatedVersions: VersionsMap): CandidateReleasePullRequest;
    /**
     * Create a new candidate pull request to update dependencies and force
     * a version bump.
     * @param {T} pkg The package being updated
     * @param {VersionsMap} updatedVersions Map of package name => version to
     *   update.
     * @returns {CandidateReleasePullRequest} A new pull request
     */
    protected abstract newCandidate(pkg: T, updatedVersions: VersionsMap): CandidateReleasePullRequest;
    /**
     * Collect all packages being managed in this workspace.
     * @param {CanididateReleasePullRequest[]} candidates Existing candidate pull
     *   requests
     * @returns {AllPackages<T>} The list of packages and candidates grouped by package name
     */
    protected abstract buildAllPackages(candidates: CandidateReleasePullRequest[]): Promise<AllPackages<T>>;
    /**
     * Builds a graph of dependencies that have been touched
     * @param {T[]} allPackages All the packages in the workspace
     * @returns {DependencyGraph<T>} A map of package name to other workspace packages
     *   it depends on.
     */
    protected abstract buildGraph(allPackages: T[]): Promise<DependencyGraph<T>>;
    /**
     * Filter to determine whether or not the candidate pull request is
     * in scope of this workspace.
     * @param {CandidateReleasePullRequest} candidate The candidate pull request
     * @returns {boolean} Whether or not this candidate should be handled by this
     *   workspace.
     */
    protected abstract inScope(candidate: CandidateReleasePullRequest): boolean;
    /**
     * Given a package, return the package name of the package.
     * @param {T} pkg The package definition.
     * @returns {string} The package name.
     */
    protected abstract packageNameFromPackage(pkg: T): string;
    /**
     * Given a package, return the path in the repo to the package.
     * @param {T} pkg The package definition.
     * @returns {string} The package path.
     */
    protected abstract pathFromPackage(pkg: T): string;
    /**
     * Amend any or all in-scope candidates once all other processing has occured.
     *
     * This gives the workspace plugin once last chance to tweak the pull-requests
     * once all the underlying information has been collated.
     * @param {CandidateReleasePullRequest[]} candidates - The list of candidates
     *   once all other workspace processing has occured.
     * @param {VersionMap} updatedVersions - Map containing any component versions
     *   that have changed.
     * @returns {CandidateReleasePullRequest[]} potentially amended list of
     *   candidates.
     */
    protected abstract postProcessCandidates(candidates: CandidateReleasePullRequest[], updatedVersions: VersionsMap): CandidateReleasePullRequest[];
    /**
     * Helper to invert the graph from package => packages that it depends on
     * to package => packages that depend on it.
     * @param {DependencyGraph<T>} graph
     * @returns {DependencyGraph<T>}
     */
    private invertGraph;
    /**
     * Determine all the packages which need to be updated and sort them.
     * @param {DependencyGraph<T>} graph The graph of package => packages it depends on
     * @param {string} packageNamesToUpdate Names of the packages which are already
     *   being updated.
     */
    protected buildGraphOrder(graph: DependencyGraph<T>, packageNamesToUpdate: string[]): T[];
    private visitPostOrder;
}
export declare function appendDependenciesSectionToChangelog(changelog: string, notes: string, logger?: Logger): string;
export declare function addPath(path: string, file: string): string;
