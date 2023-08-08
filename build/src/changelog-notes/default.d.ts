import { ChangelogNotes, BuildNotesOptions } from '../changelog-notes';
import { ConventionalCommit } from '../commit';
interface DefaultChangelogNotesOptions {
    commitPartial?: string;
    headerPartial?: string;
    mainTemplate?: string;
}
export declare class DefaultChangelogNotes implements ChangelogNotes {
    private commitPartial?;
    private headerPartial?;
    private mainTemplate?;
    constructor(options?: DefaultChangelogNotesOptions);
    buildNotes(commits: ConventionalCommit[], options: BuildNotesOptions): Promise<string>;
}
export {};
