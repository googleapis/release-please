import { Logger } from '../../util/logger';
import { DefaultUpdater } from '../default';
/**
 * Updates KMR blueprint yaml file.
 */
export declare class KRMBlueprintVersion extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
