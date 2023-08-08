import { BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions } from './base';
import { Update } from '../update';
import { Commit } from '../commit';
import { Release } from '../release';
import { ReleasePullRequest } from '../release-pull-request';
import { PullRequestBody } from '../util/pull-request-body';
export declare class PHPYoshi extends BaseStrategy {
    constructor(options: BaseStrategyOptions);
    buildReleasePullRequest(commits: Commit[], latestRelease?: Release, draft?: boolean, labels?: string[]): Promise<ReleasePullRequest | undefined>;
    protected parsePullRequestBody(pullRequestBody: string): Promise<PullRequestBody | undefined>;
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
}
