import { Updater } from '../update';
import { Version } from '../version';
import { Logger } from '../util/logger';
/**
 * Updates YAML document according to given JSONPath.
 *
 * Note that used parser does reformat the document and removes all comments,
 * and converts everything to pure YAML (even JSON source).
 * If you want to retain formatting, use generic updater with comment hints.
 *
 * When applied on multi-document file, it updates all documents.
 */
export declare class GenericYaml implements Updater {
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
