import { Logger } from '../../util/logger';
import { Updater } from '../../update';
import { VersionsMap } from '../../version';
/**
 * Updates `Cargo.lock` lockfiles, preserving formatting and comments.
 */
export declare class CargoLock implements Updater {
    versionsMap: VersionsMap;
    constructor(versionsMap: VersionsMap);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
