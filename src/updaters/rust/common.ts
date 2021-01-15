// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as TOML from '@iarna/toml';

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

export type DepKind =
  | 'dependencies'
  | 'dev-dependencies'
  | 'build-dependencies';

/**
 * All possible dependency kinds for `CargoManifest`,
 * typed properly.
 */
export const DEP_KINDS: DepKind[] = [
  'dependencies',
  'dev-dependencies',
  'build-dependencies',
];

export function parseCargoManifest(content: string): CargoManifest {
  return TOML.parse(content) as CargoManifest;
}

/**
 * A `Cargo.lock` lockfile
 */
export interface CargoLockfile {
  // sic. the key is singular, but it's an array
  package?: CargoLockfilePackage[];
}

export interface CargoLockfilePackage {
  name: string;
  version: string;
}

export function parseCargoLockfile(content: string): CargoLockfile {
  return TOML.parse(content) as CargoLockfile;
}
