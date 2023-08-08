import { Updater } from '../update';
/**
 * This updater ignores previous content and writes the provided
 * content verbatim.
 */
export declare class RawContent implements Updater {
    rawContent: string;
    /**
     * Create a new RawContent instance
     * @param {string} rawContent The raw content to set as the contents.
     */
    constructor(rawContent: string);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(_content: string | undefined): string;
}
