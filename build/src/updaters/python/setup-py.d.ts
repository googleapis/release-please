import { DefaultUpdater } from '../default';
/**
 * Updates a setup.py file.
 */
export declare class SetupPy extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string): string;
}
