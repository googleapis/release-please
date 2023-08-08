import { DefaultUpdater } from '../default';
/**
 * Python file with a __version__ property (or attribute, or whatever).
 */
export declare class PythonFileWithVersion extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string): string;
}
