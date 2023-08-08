import { Logger } from '../../util/logger';
import { DefaultUpdater, UpdateOptions } from '../default';
interface SamplesPackageJsonOptions extends UpdateOptions {
    packageName: string;
}
/**
 * Updates the a Node.js package.json file with the library in the
 * dependencies section.
 */
export declare class SamplesPackageJson extends DefaultUpdater {
    packageName: string;
    /**
     * Instantiate a new SamplesPackageJson updater
     * @param options
     */
    constructor(options: SamplesPackageJsonOptions);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
export {};
