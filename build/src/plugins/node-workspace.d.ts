import { Package as LernaPackage, RawManifest as PackageJson } from '@lerna/package';
import { GitHub } from '../github';
import { CandidateReleasePullRequest, RepositoryConfig } from '../manifest';
import { Version, VersionsMap } from '../version';
import { WorkspacePlugin, DependencyGraph, WorkspacePluginOptions } from './workspace';
declare class Package extends LernaPackage {
    readonly rawContent: string;
    constructor(rawContent: string, location: string, pkg?: PackageJson);
    clone(): Package;
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
export declare class NodeWorkspace extends WorkspacePlugin<Package> {
    private alwaysLinkLocal;
    private packageGraph?;
    constructor(github: GitHub, targetBranch: string, repositoryConfig: RepositoryConfig, options?: NodeWorkspaceOptions);
    protected buildAllPackages(candidates: CandidateReleasePullRequest[]): Promise<{
        allPackages: Package[];
        candidatesByPackage: Record<string, CandidateReleasePullRequest>;
    }>;
    protected bumpVersion(pkg: Package): Version;
    protected updateCandidate(existingCandidate: CandidateReleasePullRequest, pkg: Package, updatedVersions: VersionsMap): CandidateReleasePullRequest;
    protected newCandidate(pkg: Package, updatedVersions: VersionsMap): CandidateReleasePullRequest;
    protected postProcessCandidates(candidates: CandidateReleasePullRequest[], _updatedVersions: VersionsMap): CandidateReleasePullRequest[];
    protected buildGraph(allPackages: Package[]): Promise<DependencyGraph<Package>>;
    protected inScope(candidate: CandidateReleasePullRequest): boolean;
    protected packageNameFromPackage(pkg: Package): string;
    protected pathFromPackage(pkg: Package): string;
    private detectRangePrefix;
    private combineDeps;
}
export {};
