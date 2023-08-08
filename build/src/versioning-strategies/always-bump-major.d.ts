import { Version } from '../version';
import { ConventionalCommit } from '../commit';
import { DefaultVersioningStrategy } from './default';
import { VersionUpdater } from '../versioning-strategy';
/**
 * This VersioningStrategy always bumps the major version.
 */
export declare class AlwaysBumpMajor extends DefaultVersioningStrategy {
    determineReleaseType(_version: Version, _commits: ConventionalCommit[]): VersionUpdater;
}
