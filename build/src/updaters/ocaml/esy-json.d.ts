import { Logger } from '../../util/logger';
import { DefaultUpdater } from '../default';
/**
 * Updates an OCaml esy.json file.
 */
export declare class EsyJson extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
