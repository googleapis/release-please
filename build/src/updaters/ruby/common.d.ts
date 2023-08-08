import { Version } from '../../version';
export declare const RUBY_VERSION_REGEX: RegExp;
/**
 * Stringify a version to a ruby compatible version string
 *
 * @param version The version to stringify
 * @param useDotPrePreleaseSeperator Use a `.` seperator for prereleases rather then `-`
 * @returns a ruby compatible version string
 */
export declare function stringifyRubyVersion(version: Version, useDotPrePreleaseSeperator?: boolean): string;
/**
 * This function mimics Gem::Version parsing of version semver strings
 *
 * @param versionString The version string to resolve
 * @returns A Gem::Version compatible version string
 */
export declare function resolveRubyGemfileLockVersion(versionString: string): string;
