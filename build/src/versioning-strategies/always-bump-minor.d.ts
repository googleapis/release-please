import { Version } from '../version';
import { ConventionalCommit } from '../commit';
import { DefaultVersioningStrategy } from './default';
import { VersionUpdater } from '../versioning-strategy';
/**
 * This VersioningStrategy always bumps the minor version.
 */
export declare class AlwaysBumpMinor extends DefaultVersioningStrategy {
    determineReleaseType(_version: Version, _commits: ConventionalCommit[]): VersionUpdater;
}
