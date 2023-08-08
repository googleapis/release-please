import { GitHub } from './github';
import { CandidateReleasePullRequest, RepositoryConfig } from './manifest';
import { Strategy } from './strategy';
import { Commit, ConventionalCommit } from './commit';
import { Release } from './release';
import { Logger } from './util/logger';
/**
 * A plugin runs after a repository manifest has built candidate
 * pull requests and can make updates that span across multiple
 * components. A plugin *might* choose to merge pull requests or add
 * or update existing files.
 */
export declare abstract class ManifestPlugin {
    readonly github: GitHub;
    readonly targetBranch: string;
    readonly repositoryConfig: RepositoryConfig;
    protected logger: Logger;
    constructor(github: GitHub, targetBranch: string, repositoryConfig: RepositoryConfig, logger?: Logger);
    /**
     * Perform post-processing on commits, e.g, sentence casing them.
     * @param {Commit[]} commits The set of commits that will feed into release pull request.
     * @returns {Commit[]} The modified commit objects.
     */
    processCommits(commits: ConventionalCommit[]): ConventionalCommit[];
    /**
     * Post-process candidate pull requests.
     * @param {CandidateReleasePullRequest[]} pullRequests Candidate pull requests
     * @returns {CandidateReleasePullRequest[]} Updated pull requests
     */
    run(pullRequests: CandidateReleasePullRequest[]): Promise<CandidateReleasePullRequest[]>;
    /**
     * Pre-configure strategies.
     * @param {Record<string, Strategy>} strategiesByPath Strategies indexed by path
     * @returns {Record<string, Strategy>} Updated strategies indexed by path
     */
    preconfigure(strategiesByPath: Record<string, Strategy>, _commitsByPath: Record<string, Commit[]>, _releasesByPath: Record<string, Release>): Promise<Record<string, Strategy>>;
}
