import { ManifestPlugin } from '../plugin';
import { RepositoryConfig, CandidateReleasePullRequest } from '../manifest';
import { GitHub } from '../github';
import { Logger } from '../util/logger';
import { Strategy } from '../strategy';
import { Commit } from '../commit';
import { Release } from '../release';
interface LinkedVersionsPluginOptions {
    merge?: boolean;
    logger?: Logger;
}
/**
 * This plugin reconfigures strategies by linking multiple components
 * together.
 *
 * Release notes are broken up using `<summary>`/`<details>` blocks.
 */
export declare class LinkedVersions extends ManifestPlugin {
    readonly groupName: string;
    readonly components: Set<string>;
    readonly merge: boolean;
    constructor(github: GitHub, targetBranch: string, repositoryConfig: RepositoryConfig, groupName: string, components: string[], options?: LinkedVersionsPluginOptions);
    /**
     * Pre-configure strategies.
     * @param {Record<string, Strategy>} strategiesByPath Strategies indexed by path
     * @returns {Record<string, Strategy>} Updated strategies indexed by path
     */
    preconfigure(strategiesByPath: Record<string, Strategy>, commitsByPath: Record<string, Commit[]>, releasesByPath: Record<string, Release>): Promise<Record<string, Strategy>>;
    /**
     * Post-process candidate pull requests.
     * @param {CandidateReleasePullRequest[]} pullRequests Candidate pull requests
     * @returns {CandidateReleasePullRequest[]} Updated pull requests
     */
    run(candidates: CandidateReleasePullRequest[]): Promise<CandidateReleasePullRequest[]>;
}
export {};
