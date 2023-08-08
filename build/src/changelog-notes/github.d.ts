import { ChangelogNotes, BuildNotesOptions } from '../changelog-notes';
import { ConventionalCommit } from '../commit';
import { GitHub } from '../github';
export declare class GitHubChangelogNotes implements ChangelogNotes {
    private github;
    constructor(github: GitHub);
    buildNotes(_commits: ConventionalCommit[], options: BuildNotesOptions): Promise<string>;
}
