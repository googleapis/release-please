// Copyright 2026 Google LLC
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

import {Updater} from '../../update';
import {VersionsMap} from '../../version';
import {logger as defaultLogger, Logger} from '../../util/logger';
import {UpdateOptions} from '../default';
import {modify, applyEdits, parse} from 'jsonc-parser';

interface BunWorkspace {
  name: string;
  version?: string;
}

interface BunLockData {
  workspaces: Record<string, BunWorkspace>;
}

export class BunLock implements Updater {
  versionsMap?: VersionsMap;

  constructor(options: Partial<UpdateOptions>) {
    this.versionsMap = options.versionsMap;
  }

  updateContent(content: string, logger: Logger = defaultLogger): string {
    if (!this.versionsMap) {
      return content;
    }

    const parsed = parse(content, [], {
      allowTrailingComma: true,
    }) as BunLockData;

    const edits = [];
    for (const [path, workspace] of Object.entries(parsed.workspaces)) {
      if (!workspace.name) continue;

      const version = this.versionsMap.get(workspace.name);
      if (version) {
        logger.info(`updating from ${workspace.version} to ${version}`);
        edits.push(
          ...modify(
            content,
            ['workspaces', path, 'version'],
            version.toString(),
            {formattingOptions: {insertSpaces: true, tabSize: 2}}
          )
        );
      }
    }

    return applyEdits(content, edits);
  }
}
