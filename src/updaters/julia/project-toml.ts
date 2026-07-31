// Copyright 2025 Google LLC
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
import {logger as defaultLogger, Logger} from '../../util/logger';
import {replaceTomlValue} from '../../util/toml-edit';
import {DefaultUpdater} from '../default';

/**
 * A subset of the contents of a Julia `Project.toml` or `JuliaProject.toml`
 */
export interface JuliaProject {
  name?: string;
  version?: string;
}

export function parseJuliaProject(content: string): JuliaProject {
  return TOML.parse(content) as JuliaProject;
}

/**
 * Updates a Julia Project.toml or JuliaProject.toml file
 */
export class JuliaProjectToml extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = parseJuliaProject(content);

    if (!parsed.version) {
      const msg = 'invalid file';
      logger.error(msg);
      throw new Error(msg);
    }

    return replaceTomlValue(content, ['version'], this.version.toString());
  }
}
