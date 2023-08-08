import { Updater, Update } from '../update';
/**
 * The CompositeUpdater chains 0...n updaters and updates
 * the content in order.
 */
export declare class CompositeUpdater implements Updater {
    readonly updaters: Updater[];
    /**
     * Instantiate a new CompositeUpdater
     * @param {Updater[]} updaters The updaters to chain together
     */
    constructor(...updaters: Updater[]);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string | undefined): string;
}
export declare function mergeUpdates(updates: Update[]): Update[];
