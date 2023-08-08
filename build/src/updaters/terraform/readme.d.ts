import { DefaultUpdater } from '../default';
/**
 * Updates a Terraform module's README.
 */
export declare class ReadMe extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string): string;
}
