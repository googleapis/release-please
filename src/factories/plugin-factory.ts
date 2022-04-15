// Copyright 2022 Google LLC
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

import {
  LinkedVersionPluginConfig,
  PluginType,
  RepositoryConfig,
} from '../manifest';
import {GitHub} from '../github';
import {ManifestPlugin} from '../plugin';
import {LinkedVersions} from '../plugins/linked-versions';
import {CargoWorkspace} from '../plugins/cargo-workspace';
import {NodeWorkspace} from '../plugins/node-workspace';
import {VersioningStrategyType} from './versioning-strategy-factory';

export interface PluginFactoryOptions {
  type: PluginType;
  github: GitHub;
  targetBranch: string;
  repositoryConfig: RepositoryConfig;

  // node options
  alwaysLinkLocal?: boolean;

  // workspace options
  updateAllPackages?: boolean;
}

export type PluginBuilder = (options: PluginFactoryOptions) => ManifestPlugin;

const pluginFactories: Record<string, PluginBuilder> = {
  'linked-versions': options =>
    new LinkedVersions(
      options.github,
      options.targetBranch,
      options.repositoryConfig,
      (options.type as LinkedVersionPluginConfig).groupName,
      (options.type as LinkedVersionPluginConfig).components
    ),
  'cargo-workspace': options =>
    new CargoWorkspace(
      options.github,
      options.targetBranch,
      options.repositoryConfig,
      options
    ),
  'node-workspace': options =>
    new NodeWorkspace(
      options.github,
      options.targetBranch,
      options.repositoryConfig,
      options
    ),
};

export function buildPlugin(options: PluginFactoryOptions): ManifestPlugin {
  if (typeof options.type === 'object') {
    const builder = pluginFactories[options.type.type];
    if (builder) {
      return builder(options);
    }
    throw new Error(`Unknown plugin type: ${options.type.type}`);
  } else {
    const builder = pluginFactories[options.type];
    if (builder) {
      return builder(options);
    }
    throw new Error(`Unknown plugin type: ${options.type}`);
  }
}

export function registerPlugin(name: string, pluginBuilder: PluginBuilder) {
  pluginFactories[name] = pluginBuilder;
}

export function unregisterPlugin(name: string) {
  delete pluginFactories[name];
}

export function getPluginTypes(): readonly VersioningStrategyType[] {
  return Object.keys(pluginFactories).sort();
}
