import { Update } from '../update';
import { Version } from '../version';
import { BaseStrategy, BaseStrategyOptions, BuildUpdatesOptions } from './base';
import { ConventionalCommit } from '../commit';
import { Release } from '../release';
import { ReleasePullRequest } from '../release-pull-request';
import { VersioningStrategy } from '../versioning-strategy';
export interface JavaBuildUpdatesOption extends BuildUpdatesOptions {
    isSnapshot?: boolean;
}
/**
 * A strategy that generates SNAPSHOT version after each release, which is standard especially in Maven projects.
 *
 * This is universal strategy that does not update any files on its own. Use maven strategy for Maven projects.
 */
export declare class Java extends BaseStrategy {
    protected readonly snapshotVersioning: VersioningStrategy;
    protected readonly snapshotLabels: string[];
    readonly skipSnapshot: boolean;
    constructor(options: BaseStrategyOptions);
    buildReleasePullRequest(commits: ConventionalCommit[], latestRelease?: Release, draft?: boolean, labels?: string[]): Promise<ReleasePullRequest | undefined>;
    protected buildSnapshotPullRequest(latestRelease?: Release, draft?: boolean, labels?: string[]): Promise<ReleasePullRequest>;
    isPublishedVersion(version: Version): boolean;
    protected needsSnapshot(commits: ConventionalCommit[], latestRelease?: Release): Promise<boolean>;
    protected buildUpdates(options: JavaBuildUpdatesOption): Promise<Update[]>;
}
