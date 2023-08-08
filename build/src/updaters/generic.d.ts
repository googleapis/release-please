import { DefaultUpdater, UpdateOptions } from './default';
import { Logger } from '../util/logger';
/**
 * Options for the Generic updater.
 */
export interface GenericUpdateOptions extends UpdateOptions {
    inlineUpdateRegex?: RegExp;
    blockStartRegex?: RegExp;
    blockEndRegex?: RegExp;
}
/**
 * The Generic updater looks for well known patterns and replaces
 * content. The well known patterns are:
 *
 * 1. `x-release-please-version` if this string is found on the line,
 *    then replace a semver-looking string on that line with the next
 *    version
 * 2. `x-release-please-major` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    major
 * 3. `x-release-please-minor` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    minor
 * 4. `x-release-please-patch` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    patch
 *
 * You can also use a block-based replacement. Content between the
 * opening `x-release-please-start-version` and `x-release-please-end` will
 * be considered for version replacement. You can also open these blocks
 * with `x-release-please-start-<major|minor|patch>` to replace single
 * numbers
 */
export declare class Generic extends DefaultUpdater {
    private readonly inlineUpdateRegex;
    private readonly blockStartRegex;
    private readonly blockEndRegex;
    constructor(options: GenericUpdateOptions);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string | undefined, logger?: Logger): string;
}
