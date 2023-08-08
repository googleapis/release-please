import { Logger } from './logger';
import { Version } from '../version';
export declare function generateMatchPattern(pullRequestTitlePattern?: string, logger?: Logger): RegExp;
export declare class PullRequestTitle {
    component?: string;
    targetBranch?: string;
    version?: Version;
    pullRequestTitlePattern: string;
    matchPattern: RegExp;
    private constructor();
    static parse(title: string, pullRequestTitlePattern?: string, logger?: Logger): PullRequestTitle | undefined;
    static ofComponentVersion(component: string, version: Version, pullRequestTitlePattern?: string): PullRequestTitle;
    static ofVersion(version: Version, pullRequestTitlePattern?: string): PullRequestTitle;
    static ofTargetBranchVersion(targetBranch: string, version: Version, pullRequestTitlePattern?: string): PullRequestTitle;
    static ofComponentTargetBranchVersion(component?: string, targetBranch?: string, version?: Version, pullRequestTitlePattern?: string): PullRequestTitle;
    static ofTargetBranch(targetBranch: string, pullRequestTitlePattern?: string): PullRequestTitle;
    getTargetBranch(): string | undefined;
    getComponent(): string | undefined;
    getVersion(): Version | undefined;
    toString(): string;
}
