import { PullRequestBody } from './pull-request-body';
import { GitHub } from '../github';
import { PullRequest } from '../pull-request';
import { Logger } from './logger';
import { ReleasePullRequest } from '../release-pull-request';
/**
 * Interface for managing the pull request body contents when the content
 * is too large to fit into a pull request.
 */
export interface PullRequestOverflowHandler {
    /**
     * If a pull request's body is too big, store it somewhere and return
     * a new pull request body with information about the new location.
     * @param {ReleasePullRequest} pullRequest The candidate release pull request
     * @returns {string} The new pull request body which may contain a link to
     *   the full content.
     */
    handleOverflow(pullRequest: ReleasePullRequest, maxSize?: number): Promise<string>;
    /**
     * Given a pull request, parse the pull request body from the pull request
     * or storage if the body was too big to store in the pull request body.
     * @param {PullRequest} pullRequest The pull request from GitHub
     * @return {PullRequestBody} The parsed pull request body
     */
    parseOverflow(pullRequest: PullRequest): Promise<PullRequestBody | undefined>;
}
/**
 * This implementation of PullRequestOverflowHandler stores the full release
 * notes on a new git branch. The branch name is derived from the head branch
 * name of the release pull request.
 */
export declare class FilePullRequestOverflowHandler implements PullRequestOverflowHandler {
    private github;
    private logger;
    constructor(github: GitHub, logger?: Logger);
    /**
     * Optionally store the full release notes into `release-notes.md` file
     * on a new branch if they do not fit into the body of a pull request.
     *
     * The new release notes will have a link to the GitHub UI for that file
     * which should render the release notes nicely.
     * @param {ReleasePullRequest} pullRequest The candidate release pull request
     * @returns {string} The new pull request body which contains a link to
     *   the full content.
     */
    handleOverflow(pullRequest: ReleasePullRequest, maxSize?: number): Promise<string>;
    /**
     * Given a pull request, retrieve the full release notes from the stored
     * file if the body was too big to store in the pull request body.
     * @param {PullRequest} pullRequest The pull request from GitHub
     * @return {PullRequestBody} The parsed pull request body
     */
    parseOverflow(pullRequest: PullRequest): Promise<PullRequestBody | undefined>;
}
