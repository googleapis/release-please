import { Commit } from '../commit';
export interface CommitSplitOptions {
    includeEmpty?: boolean;
    packagePaths?: string[];
}
/**
 * Helper class for splitting commits by component path. If `packagePaths`
 * is configured, then only consider the provided paths. If `includeEmpty`
 * is configured, then commits without any touched files apply to all
 * configured component paths.
 */
export declare class CommitSplit {
    includeEmpty: boolean;
    packagePaths?: string[];
    constructor(opts?: CommitSplitOptions);
    /**
     * Split commits by component path. If the commit splitter is configured
     * with a set of tracked package paths, then only consider paths for
     * configured components. If `includeEmpty` is configured, then a commit
     * that does not touch any files will be applied to all components'
     * commits.
     * @param {Commit[]} commits The commits to split
     * @returns {Record<string, Commit[]>} Commits indexed by component path
     */
    split<T extends Commit>(commits: T[]): Record<string, T[]>;
}
