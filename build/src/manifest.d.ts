import { ChangelogSection } from './changelog-notes';
import { GitHub, GitHubRelease } from './github';
import { Version } from './version';
import { PullRequest } from './pull-request';
import { Logger } from './util/logger';
import { ReleasePullRequest } from './release-pull-request';
import { ReleaseType, VersioningStrategyType, ChangelogNotesType } from './factory';
import { Release } from './release';
import { ManifestPlugin } from './plugin';
type ExtraJsonFile = {
    type: 'json';
    path: string;
    jsonpath: string;
    glob?: boolean;
};
type ExtraYamlFile = {
    type: 'yaml';
    path: string;
    jsonpath: string;
    glob?: boolean;
};
type ExtraXmlFile = {
    type: 'xml';
    path: string;
    xpath: string;
    glob?: boolean;
};
type ExtraPomFile = {
    type: 'pom';
    path: string;
    glob?: boolean;
};
type ExtraTomlFile = {
    type: 'toml';
    path: string;
    jsonpath: string;
    glob?: boolean;
};
export type ExtraFile = string | ExtraJsonFile | ExtraYamlFile | ExtraXmlFile | ExtraPomFile | ExtraTomlFile;
/**
 * These are configurations provided to each strategy per-path.
 */
export interface ReleaserConfig {
    releaseType: ReleaseType;
    versioning?: VersioningStrategyType;
    bumpMinorPreMajor?: boolean;
    bumpPatchForMinorPreMajor?: boolean;
    releaseAs?: string;
    skipGithubRelease?: boolean;
    draft?: boolean;
    prerelease?: boolean;
    draftPullRequest?: boolean;
    component?: string;
    packageName?: string;
    includeComponentInTag?: boolean;
    includeVInTag?: boolean;
    pullRequestTitlePattern?: string;
    pullRequestHeader?: string;
    tagSeparator?: string;
    separatePullRequests?: boolean;
    labels?: string[];
    releaseLabels?: string[];
    extraLabels?: string[];
    initialVersion?: string;
    changelogSections?: ChangelogSection[];
    changelogPath?: string;
    changelogType?: ChangelogNotesType;
    changelogHost?: string;
    versionFile?: string;
    extraFiles?: ExtraFile[];
    snapshotLabels?: string[];
    skipSnapshot?: boolean;
    excludePaths?: string[];
}
export interface CandidateReleasePullRequest {
    path: string;
    pullRequest: ReleasePullRequest;
    config: ReleaserConfig;
}
export interface CandidateRelease extends Release {
    pullRequest: PullRequest;
    path: string;
    draft?: boolean;
    prerelease?: boolean;
}
interface ReleaserConfigJson {
    'release-type'?: ReleaseType;
    versioning?: VersioningStrategyType;
    'bump-minor-pre-major'?: boolean;
    'bump-patch-for-minor-pre-major'?: boolean;
    'changelog-sections'?: ChangelogSection[];
    'release-as'?: string;
    'skip-github-release'?: boolean;
    draft?: boolean;
    prerelease?: boolean;
    'draft-pull-request'?: boolean;
    label?: string;
    'release-label'?: string;
    'extra-label'?: string;
    'include-component-in-tag'?: boolean;
    'include-v-in-tag'?: boolean;
    'changelog-type'?: ChangelogNotesType;
    'changelog-host'?: string;
    'pull-request-title-pattern'?: string;
    'pull-request-header'?: string;
    'separate-pull-requests'?: boolean;
    'tag-separator'?: string;
    'extra-files'?: ExtraFile[];
    'version-file'?: string;
    'snapshot-label'?: string;
    'skip-snapshot'?: boolean;
    'initial-version'?: string;
    'exclude-paths'?: string[];
}
export interface ManifestOptions {
    bootstrapSha?: string;
    lastReleaseSha?: string;
    alwaysLinkLocal?: boolean;
    separatePullRequests?: boolean;
    plugins?: PluginType[];
    fork?: boolean;
    signoff?: string;
    manifestPath?: string;
    labels?: string[];
    releaseLabels?: string[];
    snapshotLabels?: string[];
    skipLabeling?: boolean;
    sequentialCalls?: boolean;
    draft?: boolean;
    prerelease?: boolean;
    draftPullRequest?: boolean;
    groupPullRequestTitlePattern?: string;
    releaseSearchDepth?: number;
    commitSearchDepth?: number;
    logger?: Logger;
    reviewers?: [string];
}
export interface ReleaserPackageConfig extends ReleaserConfigJson {
    'package-name'?: string;
    component?: string;
    'changelog-path'?: string;
}
export type DirectPluginType = string;
export interface ConfigurablePluginType {
    type: string;
}
export interface LinkedVersionPluginConfig extends ConfigurablePluginType {
    type: 'linked-versions';
    groupName: string;
    components: string[];
    merge?: boolean;
}
export interface SentenceCasePluginConfig extends ConfigurablePluginType {
    specialWords?: string[];
}
export interface WorkspacePluginConfig extends ConfigurablePluginType {
    merge?: boolean;
    considerAllArtifacts?: boolean;
}
export interface GroupPriorityPluginConfig extends ConfigurablePluginType {
    groups: string[];
}
export type PluginType = DirectPluginType | ConfigurablePluginType | GroupPriorityPluginConfig | LinkedVersionPluginConfig | SentenceCasePluginConfig | WorkspacePluginConfig;
/**
 * This is the schema of the manifest config json
 */
export interface ManifestConfig extends ReleaserConfigJson {
    packages: Record<string, ReleaserPackageConfig>;
    'bootstrap-sha'?: string;
    'last-release-sha'?: string;
    'always-link-local'?: boolean;
    plugins?: PluginType[];
    'group-pull-request-title-pattern'?: string;
    'release-search-depth'?: number;
    'commit-search-depth'?: number;
    'sequential-calls'?: boolean;
}
export type ReleasedVersions = Record<string, Version>;
export type RepositoryConfig = Record<string, ReleaserConfig>;
export declare const DEFAULT_RELEASE_PLEASE_CONFIG = "release-please-config.json";
export declare const DEFAULT_RELEASE_PLEASE_MANIFEST = ".release-please-manifest.json";
export declare const ROOT_PROJECT_PATH = ".";
export declare const DEFAULT_COMPONENT_NAME = "";
export declare const DEFAULT_LABELS: string[];
export declare const DEFAULT_RELEASE_LABELS: string[];
export declare const DEFAULT_SNAPSHOT_LABELS: string[];
export declare const SNOOZE_LABEL = "autorelease: snooze";
export declare const MANIFEST_PULL_REQUEST_TITLE_PATTERN = "chore: release ${branch}";
interface CreatedRelease extends GitHubRelease {
    id: number;
    path: string;
    version: string;
    major: number;
    minor: number;
    patch: number;
}
export declare class Manifest {
    private repository;
    private github;
    readonly repositoryConfig: RepositoryConfig;
    readonly releasedVersions: ReleasedVersions;
    private targetBranch;
    private separatePullRequests;
    readonly fork: boolean;
    private signoffUser?;
    private labels;
    private skipLabeling?;
    private sequentialCalls?;
    private releaseLabels;
    private snapshotLabels;
    readonly plugins: ManifestPlugin[];
    private _strategiesByPath?;
    private _pathsByComponent?;
    private manifestPath;
    private bootstrapSha?;
    private lastReleaseSha?;
    private draft?;
    private prerelease?;
    private draftPullRequest?;
    private groupPullRequestTitlePattern?;
    readonly releaseSearchDepth: number;
    readonly commitSearchDepth: number;
    readonly logger: Logger;
    private pullRequestOverflowHandler;
    private reviewers?;
    /**
     * Create a Manifest from explicit config in code. This assumes that the
     * repository has a single component at the root path.
     *
     * @param {GitHub} github GitHub client
     * @param {string} targetBranch The releaseable base branch
     * @param {RepositoryConfig} repositoryConfig Parsed configuration of path => release configuration
     * @param {ReleasedVersions} releasedVersions Parsed versions of path => latest release version
     * @param {ManifestOptions} manifestOptions Optional. Manifest options
     * @param {string} manifestOptions.bootstrapSha If provided, use this SHA
     *   as the point to consider commits after
     * @param {boolean} manifestOptions.alwaysLinkLocal Option for the node-workspace
     *   plugin
     * @param {boolean} manifestOptions.separatePullRequests If true, create separate pull
     *   requests instead of a single manifest release pull request
     * @param {PluginType[]} manifestOptions.plugins Any plugins to use for this repository
     * @param {boolean} manifestOptions.fork If true, create pull requests from a fork. Defaults
     *   to `false`
     * @param {string} manifestOptions.signoff Add a Signed-off-by annotation to the commit
     * @param {string} manifestOptions.manifestPath Path to the versions manifest
     * @param {string[]} manifestOptions.labels Labels that denote a pending, untagged release
     *   pull request. Defaults to `[autorelease: pending]`
     * @param {string[]} manifestOptions.releaseLabels Labels to apply to a tagged release
     *   pull request. Defaults to `[autorelease: tagged]`
     */
    constructor(github: GitHub, targetBranch: string, repositoryConfig: RepositoryConfig, releasedVersions: ReleasedVersions, manifestOptions?: ManifestOptions);
    /**
     * Create a Manifest from config files in the repository.
     *
     * @param {GitHub} github GitHub client
     * @param {string} targetBranch The releaseable base branch
     * @param {string} configFile Optional. The path to the manifest config file
     * @param {string} manifestFile Optional. The path to the manifest versions file
     * @param {string} path The single path to check. Optional
     * @returns {Manifest}
     */
    static fromManifest(github: GitHub, targetBranch: string, configFile?: string, manifestFile?: string, manifestOptionOverrides?: ManifestOptions, path?: string, releaseAs?: string): Promise<Manifest>;
    /**
     * Create a Manifest from explicit config in code. This assumes that the
     * repository has a single component at the root path.
     *
     * @param {GitHub} github GitHub client
     * @param {string} targetBranch The releaseable base branch
     * @param {ReleaserConfig} config Release strategy options
     * @param {ManifestOptions} manifestOptions Optional. Manifest options
     * @param {string} manifestOptions.bootstrapSha If provided, use this SHA
     *   as the point to consider commits after
     * @param {boolean} manifestOptions.alwaysLinkLocal Option for the node-workspace
     *   plugin
     * @param {boolean} manifestOptions.separatePullRequests If true, create separate pull
     *   requests instead of a single manifest release pull request
     * @param {PluginType[]} manifestOptions.plugins Any plugins to use for this repository
     * @param {boolean} manifestOptions.fork If true, create pull requests from a fork. Defaults
     *   to `false`
     * @param {string} manifestOptions.signoff Add a Signed-off-by annotation to the commit
     * @param {string} manifestOptions.manifestPath Path to the versions manifest
     * @param {string[]} manifestOptions.labels Labels that denote a pending, untagged release
     *   pull request. Defaults to `[autorelease: pending]`
     * @param {string[]} manifestOptions.releaseLabels Labels to apply to a tagged release
     *   pull request. Defaults to `[autorelease: tagged]`
     * @returns {Manifest}
     */
    static fromConfig(github: GitHub, targetBranch: string, config: ReleaserConfig, manifestOptions?: ManifestOptions, path?: string): Promise<Manifest>;
    /**
     * Build all candidate pull requests for this repository.
     *
     * Iterates through each path and builds a candidate pull request for component.
     * Applies any configured plugins.
     *
     * @returns {ReleasePullRequest[]} The candidate pull requests to open or update.
     */
    buildPullRequests(): Promise<ReleasePullRequest[]>;
    private backfillReleasesFromTags;
    private getAllTags;
    /**
     * Opens/updates all candidate release pull requests for this repository.
     *
     * @returns {PullRequest[]} Pull request numbers of release pull requests
     */
    createPullRequests(): Promise<(PullRequest | undefined)[]>;
    private findOpenReleasePullRequests;
    private findSnoozedReleasePullRequests;
    private createOrUpdatePullRequest;
    private maybeUpdateExistingPullRequest;
    private maybeUpdateSnoozedPullRequest;
    private findMergedReleasePullRequests;
    /**
     * Find merged, untagged releases and build candidate releases to tag.
     *
     * @returns {CandidateRelease[]} List of release candidates
     */
    buildReleases(): Promise<CandidateRelease[]>;
    /**
     * Find merged, untagged releases. For each release, create a GitHub release,
     * comment on the pull request used to generated it and update the pull request
     * labels.
     *
     * @returns {GitHubRelease[]} List of created GitHub releases
     */
    createReleases(): Promise<(CreatedRelease | undefined)[]>;
    private createReleasesForPullRequest;
    private createRelease;
    private getStrategiesByPath;
    private getPathsByComponent;
}
export {};
