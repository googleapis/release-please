import { Updater } from '../update';
/**
 * Base class for all updaters working with XML files.
 */
export declare abstract class BaseXml implements Updater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string): string;
    /**
     * Updates the document in-place if needed.
     * @param document Document to be modified.
     * @return true if document has been changed and therefore file needs to be changed, false otherwise.
     * @protected
     */
    protected abstract updateDocument(document: Document): boolean;
}
