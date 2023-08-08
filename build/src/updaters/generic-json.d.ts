import { Updater } from '../update';
import { Version } from '../version';
import { Logger } from '../util/logger';
export declare class GenericJson implements Updater {
    readonly jsonpath: string;
    readonly version: Version;
    constructor(jsonpath: string, version: Version);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
