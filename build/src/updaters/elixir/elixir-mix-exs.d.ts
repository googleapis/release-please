import { Logger } from '../../util/logger';
import { DefaultUpdater } from '../default';
/**
 * Updates an Elixir mix.exs file and looks for a version string.
 */
export declare class ElixirMixExs extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
