import { Commit } from '../commit';
import { ReleaserConfig } from '../manifest';
export type CommitExcludeConfig = Pick<ReleaserConfig, 'excludePaths'>;
export declare class CommitExclude {
    private excludePaths;
    constructor(config: Record<string, CommitExcludeConfig>);
    excludeCommits<T extends Commit>(commitsPerPath: Record<string, T[]>): Record<string, T[]>;
    private shouldInclude;
    private isRelevant;
}
