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

import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update, UpdateOptions, VersionsMap} from './update';
import {GitHubFileContents} from '../github';
import * as TOML from '@iarna/toml';

export class CargoToml implements Update {
  path: string;
  changelogEntry: string;
  version: string;
  versions?: VersionsMap;
  packageName: string;
  create: boolean;
  contents?: GitHubFileContents;

  constructor(options: UpdateOptions) {
    this.create = false;
    this.path = options.path;
    this.changelogEntry = options.changelogEntry;
    this.version = options.version;
    this.versions = options.versions;
    this.packageName = options.packageName;
  }

  updateContent(content: string): string {
    if (!this.versions) {
      throw new Error('CargoToml called with no versions to update');
    }

    const parsed = parseCargoManifest(content);
    if (!parsed.package) {
      checkpoint(
        `${this.path} is not a package manifest`,
        CheckpointType.Failure
      );
      throw new Error(`${this.path} is not a package manifest`);
    }

    const state: {updated: boolean} = {updated: false};

    for (const [pkgName, pkgVersion] of this.versions) {
      if (parsed.package.name === pkgName) {
        checkpoint(
          `updating ${this.path}'s own version from ${parsed.package?.version} to ${pkgVersion}`,
          CheckpointType.Success
        );
        parsed.package.version = pkgVersion;
        state.updated = true;
      } else {
        const updateDeps = (kind: string, deps?: CargoDependencies) => {
          if (!deps) {
            return;
          }

          const dep = deps[pkgName];
          if (!dep) {
            return;
          }

          if (typeof dep === 'string' || typeof dep.path === 'undefined') {
            checkpoint(
              `skipping ${pkgName} ${kind} in ${this.path}`,
              CheckpointType.Success
            );
            return;
          }

          checkpoint(
            `updating ${this.path} ${kind} ${pkgName} from ${dep.version} to ${pkgVersion}`,
            CheckpointType.Success
          );
          dep.version = pkgVersion;
          state.updated = true;
        };
        updateDeps('dependency', parsed.dependencies);
        updateDeps('dev-dependency', parsed['dev-dependencies']);
        updateDeps('build-dependency', parsed['build-dependencies']);
      }
    }

    if (state.updated) {
      return serializeCargoManifest(parsed);
    } else {
      return content;
    }
  }
}

export function parseCargoManifest(content: string): CargoManifest {
  return TOML.parse(content) as CargoManifest;
}

export function serializeCargoManifest(manifest: CargoManifest): string {
  return TOML.stringify(manifest as TOML.JsonMap);
}

export interface CargoManifest {
  package?: CargoPackage;
  workspace?: CargoWorkspace;

  dependencies?: CargoDependencies;
  ['dev-dependencies']?: CargoDependencies;
  ['build-dependencies']?: CargoDependencies;
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
