import { Logger } from '../../util/logger';
import { DefaultUpdater } from '../default';
/**
 * This updates a Node.js package.json file's main version.
 */
export declare class PackageJson extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
