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
import {logger as defaultLogger, Logger} from '../../util/logger';
import {replaceTomlValue} from '../../util/toml-edit';
import {DefaultUpdater} from '../default';

// TODO: remove support for `poetry.tool` when Poetry will use `project`.

interface PyProjectContent {
  name: string;
  version: string;
  dynamic?: string[];
}

/**
 * A subset of the contents of a `pyproject.toml`
 */
export interface PyProject {
  project?: PyProjectContent;
  tool?: {
    poetry?: PyProjectContent;
  };
}

export function parsePyProject(content: string): PyProject {
  return TOML.parse(content) as PyProject;
}

/**
 * Updates a pyproject.toml file
 */
export class PyProjectToml extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = parsePyProject(content);
    const project = parsed.project || parsed.tool?.poetry;

    if (!project?.version) {
      // Throw warning if the version is dynamically generated.
      if (project?.dynamic && project.dynamic.includes('version')) {
        const msg =
          "dynamic version found in 'pyproject.toml'. Skipping update.";
        logger.warn(msg);
        return content;
      }

      const msg = 'invalid file';
      logger.error(msg);
      throw new Error(msg);
    }

    return replaceTomlValue(
      content,
      (parsed.project ? ['project'] : ['tool', 'poetry']).concat('version'),
      this.version.toString()
    );
  }
}
