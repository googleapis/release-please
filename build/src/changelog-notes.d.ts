import { Commit, ConventionalCommit } from './commit';
export interface BuildNotesOptions {
    host?: string;
    owner: string;
    repository: string;
    version: string;
    previousTag?: string;
    currentTag: string;
    targetBranch: string;
    changelogSections?: ChangelogSection[];
    commits?: Commit[];
}
export interface ChangelogNotes {
    buildNotes(commits: ConventionalCommit[], options: BuildNotesOptions): Promise<string>;
}
export interface ChangelogSection {
    type: string;
    section: string;
    hidden?: boolean;
}
export declare function buildChangelogSections(scopes: string[]): ChangelogSection[];
