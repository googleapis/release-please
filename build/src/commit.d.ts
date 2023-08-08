import { PullRequest } from './pull-request';
import { Logger } from './util/logger';
import * as parser from '@conventional-commits/parser';
export interface Commit {
    sha: string;
    message: string;
    files?: string[];
    pullRequest?: PullRequest;
}
export interface ConventionalCommit extends Commit {
    type: string;
    scope: string | null;
    notes: parser.Note[];
    references: parser.Reference[];
    bareMessage: string;
    breaking: boolean;
}
/**
 * Given a list of raw commits, parse and expand into conventional commits.
 *
 * @param commits {Commit[]} The input commits
 *
 * @returns {ConventionalCommit[]} Parsed and expanded commits. There may be
 *   more commits returned as a single raw commit may contain multiple release
 *   messages.
 */
export declare function parseConventionalCommits(commits: Commit[], logger?: Logger): ConventionalCommit[];
