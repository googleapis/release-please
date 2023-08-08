import { VersioningStrategy, VersionUpdater } from '../versioning-strategy';
import { Version } from '../version';
import { ConventionalCommit } from '../commit';
/**
 * This VersioningStrategy is used by Java releases to bump
 * to the next snapshot version.
 */
export declare class JavaAddSnapshot implements VersioningStrategy {
    strategy: VersioningStrategy;
    constructor(strategy: VersioningStrategy);
    determineReleaseType(_version: Version, _commits: ConventionalCommit[]): VersionUpdater;
    bump(version: Version, commits: ConventionalCommit[]): Version;
}
