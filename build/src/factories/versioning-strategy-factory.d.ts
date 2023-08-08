import { VersioningStrategy } from '../versioning-strategy';
import { GitHub } from '../github';
export type VersioningStrategyType = string;
export interface VersioningStrategyFactoryOptions {
    type?: VersioningStrategyType;
    bumpMinorPreMajor?: boolean;
    bumpPatchForMinorPreMajor?: boolean;
    github: GitHub;
}
export type VersioningStrategyBuilder = (options: VersioningStrategyFactoryOptions) => VersioningStrategy;
export declare function buildVersioningStrategy(options: VersioningStrategyFactoryOptions): VersioningStrategy;
export declare function registerVersioningStrategy(name: string, versioningStrategyBuilder: VersioningStrategyBuilder): void;
export declare function unregisterVersioningStrategy(name: string): void;
export declare function getVersioningStrategyTypes(): readonly VersioningStrategyType[];
