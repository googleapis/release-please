/**
 * The contents of a `Cargo.toml` manifest
 */
export interface CargoManifest {
    package?: CargoPackage;
    workspace?: CargoWorkspace;
    dependencies?: CargoDependencies;
    ['dev-dependencies']?: CargoDependencies;
    ['build-dependencies']?: CargoDependencies;
    target?: TargetDependencies;
}
/**
 * Platform-specific dependencies
 */
export interface TargetDependencies {
    [key: string]: {
        dependencies?: CargoDependencies;
        ['dev-dependencies']?: CargoDependencies;
        ['build-dependencies']?: CargoDependencies;
    };
}
export interface CargoWorkspace {
    members?: string[];
}
export interface CargoPackage {
    name?: string;
    version?: string;
}
export interface CargoDependencies {
    [key: string]: string | CargoDependency;
}
export interface CargoDependency {
    version?: string;
    path?: string;
    registry?: string;
}
export type DepKind = 'dependencies' | 'dev-dependencies' | 'build-dependencies';
/**
 * All possible dependency kinds for `CargoManifest`,
 * typed properly.
 */
export declare const DEP_KINDS: DepKind[];
export declare function parseCargoManifest(content: string): CargoManifest;
/**
 * A `Cargo.lock` lockfile
 */
export interface CargoLockfile {
    package?: CargoLockfilePackage[];
}
export interface CargoLockfilePackage {
    name: string;
    version: string;
}
export declare function parseCargoLockfile(content: string): CargoLockfile;
