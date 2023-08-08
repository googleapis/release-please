import { Version } from './version';
import { ConventionalCommit } from './commit';
/**
 * An interface for updating a version.
 */
export interface VersionUpdater {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version: Version): Version;
}
/**
 * This VersionUpdater performs a SemVer major version bump.
 */
export declare class MajorVersionUpdate implements VersionUpdater {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version: Version): Version;
}
/**
 * This VersionUpdater performs a SemVer minor version bump.
 */
export declare class MinorVersionUpdate implements VersionUpdater {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version: Version): Version;
}
/**
 * This VersionUpdater performs a SemVer patch version bump.
 */
export declare class PatchVersionUpdate implements VersionUpdater {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version: Version): Version;
}
/**
 * This VersionUpdater sets the version to a specific version.
 */
export declare class CustomVersionUpdate implements VersionUpdater {
    private versionString;
    constructor(versionString: string);
    /**
     * Returns the new bumped version. This version is specified
     * at initialization.
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(_version: Version): Version;
}
/**
 * Implement this interface to create a new versioning scheme.
 */
export interface VersioningStrategy {
    /**
     * Given the current version of an artifact and a list of commits,
     * return the next version.
     *
     * @param {Version} version The current version
     * @param {ConventionalCommit[]} commits The list of commits to consider
     * @returns {Version} The next version
     */
    bump(version: Version, commits: ConventionalCommit[]): Version;
    /**
     * Given the current version of an artifact and a list of commits,
     * return a VersionUpdater that knows how to bump the version.
     *
     * This is useful for chaining together versioning strategies.
     *
     * @param {Version} version The current version
     * @param {ConventionalCommit[]} commits The list of commits to consider
     * @returns {VersionUpdater} Updater for bumping the next version.
     */
    determineReleaseType(version: Version, commits: ConventionalCommit[]): VersionUpdater;
}
