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
import {replaceTomlValue} from '../../util/toml-edit';
import {DefaultUpdater} from '../default';

export interface JuliaProject {
  name?: string;
  version?: string;
}

export function parseProjectToml(content: string): JuliaProject {
  const parsed = TOML.parse(content) as Record<string, unknown>;
  return {
    name: typeof parsed.name === 'string' ? parsed.name : undefined,
    version: typeof parsed.version === 'string' ? parsed.version : undefined,
  };
}

/**
 * Updates Julia `Project.toml` manifests while preserving formatting/comments.
 */
export class ProjectToml extends DefaultUpdater {
  updateContent(content: string): string {
    const parsed = parseProjectToml(content);
    if (!parsed.version) {
      throw new Error('Project.toml does not contain a version field');
    }
    return replaceTomlValue(content, ['version'], this.version.toString());
  }
}
