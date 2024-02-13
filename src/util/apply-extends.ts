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
import * as path from 'path';

type GhResource = {
  repo: string;
  owner: string;
  branch: string;
  file: string;
};

export const applyExtends = async (
  config: ManifestConfig,
  github: GitHub,
  branch: string
): Promise<ManifestConfig> => {
  return populate(config, {
    resolve({id}) {
      return resolveRef(id, branch);
    },
    async load({resolved, cwd}) {
      if (cwd.startsWith('https:')) {
        return http.getJson<ManifestConfig>(`${cwd}/${resolved}`);
      }
      return github.getFileJson<ManifestConfig>(resolved, branch);
    },
    parse({contents}) {
      return contents;
    },
  });
};

export const resolveRef = (id: string, branch: string): string => {
  if (id.startsWith('./')) {
    return id.slice(2);
  }

  const ref = parseGithubRef(id, branch);
  if (!ref) {
    throw new Error(`config: unsupported 'extends' argument: ${id}`);
  }

  const {owner, repo, branch: _branch, file} = ref;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${_branch}/${file}`;
};

// https://github.com/googleapis/release-please/pull/2222#discussion_r1486658546
// owner/repo/path/to/file.json@branchOrSha
// owner/repo:path/to/file.json@branchOrSha
const githubRefPattern =
  /^([a-z0-9_-]+)\/(\.?[a-z0-9_-]+)(?:[/:]([a-z0-9/._-]+))?(?:@([a-z0-9._-]+))?$/i;

// https://docs.renovatebot.com/config-presets/#github
const renovateLikePattern =
  /^github>([a-z0-9_-]+)\/(\.?[a-z0-9_-]+)(?::([a-z0-9/._-]+))?(?:#([a-z0-9._-]+))?$/i;

export const parseGithubRef = (
  input: string,
  branch: string
): GhResource | undefined => {
  const [
    _,
    owner,
    repo,
    _file = DEFAULT_RELEASE_PLEASE_CONFIG,
    _branch = branch,
  ] =
    [githubRefPattern, renovateLikePattern]
      .map(re => re.exec(input))
      .find(Boolean) || [];

  if (!_) {
    return;
  }

  const file = _file.endsWith('/')
    ? _file + DEFAULT_RELEASE_PLEASE_CONFIG
    : _file + (path.extname(_file) ? '' : '.json');

  return {
    owner,
    repo,
    file,
    branch: _branch,
  };
};
