import { VersioningStrategy, VersionUpdater } from '../versioning-strategy';
import { ConventionalCommit } from '../commit';
import { Version } from '../version';
import { Logger } from '../util/logger';
interface DefaultVersioningStrategyOptions {
    bumpMinorPreMajor?: boolean;
    bumpPatchForMinorPreMajor?: boolean;
    logger?: Logger;
}
/**
 * This is the default VersioningStrategy for release-please. Breaking
 * changes should bump the major, features should bump the minor, and other
 * significant changes should bump the patch version.
 */
export declare class DefaultVersioningStrategy implements VersioningStrategy {
    readonly bumpMinorPreMajor: boolean;
    readonly bumpPatchForMinorPreMajor: boolean;
    protected logger: Logger;
    /**
     * Create a new DefaultVersioningStrategy
     * @param {DefaultVersioningStrategyOptions} options Configuration options
     * @param {boolean} options.bumpMinorPreMajor If the current version is less than 1.0.0,
     *   then bump the minor version for breaking changes
     * @param {boolean} options.bumpPatchForMinorPreMajor If the current version is less than
     *   1.0.0, then bump the patch version for features
     */
    constructor(options?: DefaultVersioningStrategyOptions);
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
    /**
     * Given the current version of an artifact and a list of commits,
     * return the next version.
     *
     * @param {Version} version The current version
     * @param {ConventionalCommit[]} commits The list of commits to consider
     * @returns {Version} The next version
     */
    bump(version: Version, commits: ConventionalCommit[]): Version;
}
export {};
