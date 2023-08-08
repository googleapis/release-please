import { ReleasePullRequest } from './release-pull-request';
import { Release } from './release';
import { PullRequest } from './pull-request';
import { Commit } from './commit';
import { VersioningStrategy } from './versioning-strategy';
import { ChangelogNotes } from './changelog-notes';
import { Version } from './version';
export interface BuildReleaseOptions {
    groupPullRequestTitlePattern?: string;
}
/**
 * A strategy is responsible for determining which files are
 * necessary to update in a release pull request.
 */
export interface Strategy {
    readonly changelogNotes: ChangelogNotes;
    readonly path: string;
    readonly versioningStrategy: VersioningStrategy;
    /**
     * Builds a candidate release pull request
     * @param {Commit[]} commits Raw commits to consider for this release.
     * @param {Release} latestRelease Optional. The last release for this
     *   component if available.
     * @param {boolean} draft Optional. Whether or not to create the pull
     *   request as a draft. Defaults to `false`.
     * @returns {ReleasePullRequest | undefined} The release pull request to
     *   open for this path/component. Returns undefined if we should not
     *   open a pull request.
     */
    buildReleasePullRequest(commits: Commit[], latestRelease?: Release, draft?: boolean, labels?: string[]): Promise<ReleasePullRequest | undefined>;
    /**
     * Given a merged pull request, build the candidate release.
     * @param {PullRequest} mergedPullRequest The merged release pull request.
     * @returns {Release} The candidate release.
     * @deprecated Use buildReleases() instead.
     */
    buildRelease(mergedPullRequest: PullRequest, options?: BuildReleaseOptions): Promise<Release | undefined>;
    /**
     * Given a merged pull request, build the candidate releases.
     * @param {PullRequest} mergedPullRequest The merged release pull request.
     * @returns {Release} The candidate release.
     */
    buildReleases(mergedPullRequest: PullRequest, options?: BuildReleaseOptions): Promise<Release[]>;
    /**
     * Return the component for this strategy. This may be a computed field.
     * @returns {string}
     */
    getComponent(): Promise<string | undefined>;
    /**
     * Return the component for this strategy used in the branch name.
     * This may be a computed field.
     * @returns {string}
     */
    getBranchComponent(): Promise<string | undefined>;
    /**
     * Validate whether version is a valid release.
     * @param version Released version.
     * @returns true of release is valid, false if it should be skipped.
     */
    isPublishedVersion?(version: Version): boolean;
}
