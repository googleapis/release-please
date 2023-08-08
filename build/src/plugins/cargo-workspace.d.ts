import { CandidateReleasePullRequest } from '../manifest';
import { WorkspacePlugin, DependencyGraph } from './workspace';
import { CargoManifest } from '../updaters/rust/common';
import { VersionsMap, Version } from '../version';
interface CrateInfo {
    /**
     * e.g. `crates/crate-a`
     */
    path: string;
    /**
     * e.g. `crate-a`
     */
    name: string;
    /**
     * e.g. `1.0.0`
     */
    version: string;
    /**
     * e.g. `crates/crate-a/Cargo.toml`
     */
    manifestPath: string;
    /**
     * text content of the manifest, used for updates
     */
    manifestContent: string;
    /**
     * Parsed cargo manifest
     */
    manifest: CargoManifest;
}
/**
 * The plugin analyzed a cargo workspace and will bump dependencies
 * of managed packages if those dependencies are being updated.
 *
 * If multiple rust packages are being updated, it will merge them
 * into a single rust package.
 */
export declare class CargoWorkspace extends WorkspacePlugin<CrateInfo> {
    protected buildAllPackages(candidates: CandidateReleasePullRequest[]): Promise<{
        allPackages: CrateInfo[];
        candidatesByPackage: Record<string, CandidateReleasePullRequest>;
    }>;
    protected bumpVersion(pkg: CrateInfo): Version;
    protected updateCandidate(existingCandidate: CandidateReleasePullRequest, pkg: CrateInfo, updatedVersions: VersionsMap): CandidateReleasePullRequest;
    protected newCandidate(pkg: CrateInfo, updatedVersions: VersionsMap): CandidateReleasePullRequest;
    protected postProcessCandidates(candidates: CandidateReleasePullRequest[], updatedVersions: VersionsMap): CandidateReleasePullRequest[];
    protected buildGraph(allPackages: CrateInfo[]): Promise<DependencyGraph<CrateInfo>>;
    protected inScope(candidate: CandidateReleasePullRequest): boolean;
    protected packageNameFromPackage(pkg: CrateInfo): string;
    protected pathFromPackage(pkg: CrateInfo): string;
}
export {};
