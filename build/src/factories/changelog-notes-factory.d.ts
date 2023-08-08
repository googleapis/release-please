import { GitHub } from '../github';
import { ChangelogNotes, ChangelogSection } from '../changelog-notes';
export type ChangelogNotesType = string;
export interface ChangelogNotesFactoryOptions {
    type: ChangelogNotesType;
    github: GitHub;
    changelogSections?: ChangelogSection[];
    commitPartial?: string;
    headerPartial?: string;
    mainTemplate?: string;
}
export type ChangelogNotesBuilder = (options: ChangelogNotesFactoryOptions) => ChangelogNotes;
export declare function buildChangelogNotes(options: ChangelogNotesFactoryOptions): ChangelogNotes;
export declare function registerChangelogNotes(name: string, changelogNotesBuilder: ChangelogNotesBuilder): void;
export declare function unregisterChangelogNotes(name: string): void;
export declare function getChangelogTypes(): readonly ChangelogNotesType[];
