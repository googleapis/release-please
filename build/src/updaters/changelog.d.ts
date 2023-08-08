import { DefaultUpdater, UpdateOptions } from './default';
interface ChangelogOptions extends UpdateOptions {
    changelogEntry: string;
    versionHeaderRegex?: string;
}
export declare class Changelog extends DefaultUpdater {
    changelogEntry: string;
    readonly versionHeaderRegex: RegExp;
    constructor(options: ChangelogOptions);
    updateContent(content: string | undefined): string;
    private header;
}
export {};
