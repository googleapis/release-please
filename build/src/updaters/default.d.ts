import { Updater } from '../update';
import { Version, VersionsMap } from '../version';
export interface UpdateOptions {
    version: Version;
    versionsMap?: VersionsMap;
}
/**
 * This updater writes a plain file with the version string as the
 * only content.
 */
export declare class DefaultUpdater implements Updater {
    version: Version;
    versionsMap?: VersionsMap;
    constructor(options: UpdateOptions);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(_content: string): string;
}
