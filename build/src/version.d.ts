/**
 * This data class is used to represent a SemVer version.
 */
export declare class Version {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
    readonly preRelease?: string;
    readonly build?: string;
    constructor(major: number, minor: number, patch: number, preRelease?: string, build?: string);
    /**
     * Parse a version string into a data class.
     *
     * @param {string} versionString the input version string
     * @returns {Version} the parsed version
     * @throws {Error} if the version string cannot be parsed
     */
    static parse(versionString: string): Version;
    /**
     * Comparator to other Versions to be used in sorting.
     *
     * @param {Version} other The other version to compare to
     * @returns {number} -1 if this version is earlier, 0 if the versions
     *   are the same, or 1 otherwise.
     */
    compare(other: Version): -1 | 0 | 1;
    /**
     * Returns a normalized string version of this version.
     *
     * @returns {string}
     */
    toString(): string;
}
export type VersionsMap = Map<string, Version>;
