// Copyright 2024 Google LLC
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

import {populate} from '@topoconfig/extends';
import {type ManifestConfig, DEFAULT_RELEASE_PLEASE_CONFIG} from '../manifest';
import type {GitHub} from '../github';
import {http} from './http-api';

export const applyExtends = async (
  config: ManifestConfig,
  github: GitHub,
  branch: string
): Promise<ManifestConfig> => {
  return populate(config, {
    resolve(id: string) {
      if (id.startsWith('./')) {
        return id.slice(2);
      }

      const [_, owner, repo, _branch = branch] =
        /^([a-z0-9_-]+)\/(\.?[a-z0-9_-]+)(?:\/([a-z0-9_-]+))?$/i.exec(id) || [];
      if (_) {
        return `https://raw.githubusercontent.com/${owner}/${repo}/${_branch}/${DEFAULT_RELEASE_PLEASE_CONFIG}`;
      }

      throw new Error(`unsupported 'extends' argument: ${id}`);
    },
    async load(id, _, base) {
      if (base.startsWith('https:')) {
        return http.getJson<ManifestConfig>(`${base}/${id}`);
      }

      return github.getFileJson<ManifestConfig>(id, branch);
    },
    parse(v) {
      return v;
    },
  });
};
