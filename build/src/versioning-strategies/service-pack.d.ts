import { Version } from '../version';
import { DefaultVersioningStrategy } from './default';
import { ConventionalCommit } from '../commit';
import { VersionUpdater } from '../versioning-strategy';
/**
 * This VersioningStrategy is used for "service pack" versioning. In this
 * strategy, we use the pre-release field with a pattern of `sp-\d+` where
 * the number is an auto-incrementing integer starting with 1.
 */
export declare class ServicePackVersioningStrategy extends DefaultVersioningStrategy {
    determineReleaseType(_version: Version, _commits: ConventionalCommit[]): VersionUpdater;
}
