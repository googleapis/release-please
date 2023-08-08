import { DefaultUpdater, UpdateOptions } from '../default';
import { Logger } from '../../util/logger';
interface JavaUpdateOptions extends UpdateOptions {
    isSnapshot?: boolean;
}
/**
 * Updates a file annotated with region markers. These region markers are
 * either denoted inline with `{x-version-update:<component-name>:current|released}`
 * or with a `{x-version-update-start:<component-name>}` and `{x-version-update-end}`.
 */
export declare class JavaUpdate extends DefaultUpdater {
    isSnapshot: boolean;
    constructor(options: JavaUpdateOptions);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
export {};
