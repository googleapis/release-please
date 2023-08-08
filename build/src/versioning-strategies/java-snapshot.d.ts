import { VersioningStrategy, VersionUpdater } from '../versioning-strategy';
import { Version } from '../version';
import { ConventionalCommit } from '../commit';
/**
 * This VersioningStrategy is used by Java releases to bump
 * to the next non-snapshot version.
 */
export declare class JavaSnapshot implements VersioningStrategy {
    strategy: VersioningStrategy;
    constructor(strategy: VersioningStrategy);
    determineReleaseType(version: Version, commits: ConventionalCommit[]): VersionUpdater;
    bump(version: Version, commits: ConventionalCommit[]): Version;
}
