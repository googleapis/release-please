import { Logger } from '../../util/logger';
import { DefaultUpdater } from '../default';
/**
 * Updates a root composer.json
 */
export declare class RootComposerUpdatePackages extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
