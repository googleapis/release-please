export interface PullRequest {
    readonly headBranchName: string;
    readonly baseBranchName: string;
    readonly number: number;
    readonly title: string;
    readonly body: string;
    readonly labels: string[];
    readonly files: string[];
    readonly sha?: string;
}
