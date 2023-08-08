import { Version } from '../version';
import { ConventionalCommit } from '../commit';
import { DefaultVersioningStrategy } from './default';
import { VersionUpdater } from '../versioning-strategy';
/**
 * This VersioningStrategy always bumps the patch version. This
 * strategy is useful for backport branches.
 */
export declare class AlwaysBumpPatch extends DefaultVersioningStrategy {
    determineReleaseType(_version: Version, _commits: ConventionalCommit[]): VersionUpdater;
}
