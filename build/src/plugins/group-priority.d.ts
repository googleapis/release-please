import { ManifestPlugin } from '../plugin';
import { GitHub } from '../github';
import { RepositoryConfig, CandidateReleasePullRequest } from '../manifest';
/**
 * This plugin allows configuring a priority of release groups. For example, you could
 * prioritize Java snapshot pull requests over other releases.
 */
export declare class GroupPriority extends ManifestPlugin {
    readonly groups: string[];
    /**
     * Instantiate a new GroupPriority plugin.
     *
     * @param {GitHub} github GitHub client
     * @param {string} targetBranch Release branch
     * @param {RepositoryConfig} repositoryConfig Parsed configuration for the entire
     *   repository. This allows plugins to know how components interact.
     * @param {string[]} groups List of group names ordered with highest priority first
     */
    constructor(github: GitHub, targetBranch: string, repositoryConfig: RepositoryConfig, groups: string[]);
    /**
     * Group candidate release PRs by grouping and check our list of preferred
     * groups in order. If a preferred group is found, only return pull requests for
     * that group.
     * @param {CandidateReleasePullRequest[]} pullRequests Candidate pull requests
     * @returns {CandidateReleasePullRequest[]} Possibly a subset of the candidate
     *   pull requests if a preferred group is found.
     */
    run(pullRequests: CandidateReleasePullRequest[]): Promise<CandidateReleasePullRequest[]>;
}
