import { DefaultUpdater } from '../default';
/**
 * Updates a versions.rb file which is expected to have a version string.
 */
export declare class VersionRB extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string): string;
}
