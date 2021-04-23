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

import {ManifestPlugin} from './plugin';
import NodeWorkspaceDependencyUpdates from './node-workspace';
import {GitHub} from '../github';
import {Config} from '../manifest';

export type PluginType = 'node-workspace';

const plugins = {
  'node-workspace': NodeWorkspaceDependencyUpdates,
};

export function getPlugin(
  pluginType: PluginType,
  github: GitHub,
  config: Config
): ManifestPlugin {
  const plugin = plugins[pluginType];
  return new plugin(github, config, pluginType);
}
