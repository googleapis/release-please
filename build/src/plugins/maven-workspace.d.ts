import { WorkspacePlugin, AllPackages, DependencyGraph, WorkspacePluginOptions } from './workspace';
import { Version, VersionsMap } from '../version';
import { CandidateReleasePullRequest, RepositoryConfig } from '../manifest';
import { GitHub } from '../github';
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
export declare class MavenWorkspace extends WorkspacePlugin<MavenArtifact> {
    readonly considerAllArtifacts: boolean;
    constructor(github: GitHub, targetBranch: string, repositoryConfig: RepositoryConfig, options?: MavenWorkspacePluginOptions);
    private fetchPom;
    protected buildAllPackages(candidates: CandidateReleasePullRequest[]): Promise<AllPackages<MavenArtifact>>;
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
    protected findCandidateForPackage(pkg: MavenArtifact, candidatesByPackage: Record<string, CandidateReleasePullRequest>): CandidateReleasePullRequest | undefined;
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
    protected packageNamesToUpdate(graph: DependencyGraph<MavenArtifact>, candidatesByPackage: Record<string, CandidateReleasePullRequest>): string[];
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
    protected buildUpdatedVersions(_graph: DependencyGraph<MavenArtifact>, orderedPackages: MavenArtifact[], candidatesByPackage: Record<string, CandidateReleasePullRequest>): Promise<{
        updatedVersions: VersionsMap;
        updatedPathVersions: VersionsMap;
    }>;
    protected buildGraph(allPackages: MavenArtifact[]): Promise<DependencyGraph<MavenArtifact>>;
    /**
     * Given a release version, determine if we should bump the manifest
     * version as well. For maven artifacts, SNAPSHOT versions are not
     * considered releases.
     * @param {Version} version The release version
     */
    protected isReleaseVersion(version: Version): boolean;
    protected bumpVersion(artifact: MavenArtifact): Version;
    protected updateCandidate(existingCandidate: CandidateReleasePullRequest, artifact: MavenArtifact, updatedVersions: VersionsMap): CandidateReleasePullRequest;
    protected newCandidate(artifact: MavenArtifact, updatedVersions: VersionsMap): CandidateReleasePullRequest;
    protected inScope(candidate: CandidateReleasePullRequest): boolean;
    protected packageNameFromPackage(artifact: MavenArtifact): string;
    protected pathFromPackage(artifact: MavenArtifact): string;
    protected postProcessCandidates(candidates: CandidateReleasePullRequest[], _updatedVersions: VersionsMap): CandidateReleasePullRequest[];
}
export {};
