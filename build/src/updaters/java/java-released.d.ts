import { Generic, GenericUpdateOptions } from '../generic';
/**
 * The JavaReleased updater is used only when updating to stable (not SNAPSHOT)
 * versions. It looks for well known patterns and replaces content.
 * The well known patterns are:
 *
 * 1. `x-release-please-released-version` if this string is found on the line,
 *    then replace a semver-looking string on that line with the next
 *    version
 * 2. `x-release-please-released-major` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    major
 * 3. `x-release-please-released-minor` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    minor
 * 4. `x-release-please-released-patch` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    patch
 *
 * You can also use a block-based replacement. Content between the
 * opening `x-release-please-released-start-version` and `x-release-please-released-end` will
 * be considered for version replacement. You can also open these blocks
 * with `x-release-please-released-start-<major|minor|patch>` to replace single
 * numbers
 */
export declare class JavaReleased extends Generic {
    constructor(options: GenericUpdateOptions);
}
