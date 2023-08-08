import { Updater } from '../update';
import { Version } from '../version';
import { Logger } from '../util/logger';
/**
 * Updates TOML document according to given JSONPath.
 *
 * Note that used parser does reformat the document and removes all comments,
 * and converts everything to pure TOML.
 * If you want to retain formatting, use generic updater with comment hints.
 */
export declare class GenericToml implements Updater {
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
