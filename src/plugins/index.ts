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
import {GitHub} from '../github';
import {Config} from '../manifest';

export async function getPlugin(
  name: string,
  github: GitHub,
  config: Config
): Promise<ManifestPlugin> {
  // the prefixed './' should be sufficient to tell webpack to include all the
  // plugin files under src/plugins/
  // https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import
  const instance = (await import(`./${name}`)).default;
  return new instance(github, config, name);
}
