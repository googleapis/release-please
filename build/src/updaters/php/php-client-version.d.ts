import { DefaultUpdater } from '../default';
/**
 * Updates a php file that has a constant VERSION defined.
 */
export declare class PHPClientVersion extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string): string;
}
