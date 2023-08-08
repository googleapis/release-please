import { DefaultUpdater, UpdateOptions } from '../default';
export interface GemfileLockOptions extends UpdateOptions {
    gemName: string;
}
/**
 * Builds a regex matching a gem version in a Gemfile.lock file.
 * @example
 *    rails (7.0.1)
 *    rails (7.0.1.alpha1)
 */
export declare function buildGemfileLockVersionRegex(gemName: string): RegExp;
/**
 * Updates a Gemfile.lock files which is expected to have a local path version string.
 */
export declare class GemfileLock extends DefaultUpdater {
    gemName: string;
    constructor(options: GemfileLockOptions);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string): string;
}
