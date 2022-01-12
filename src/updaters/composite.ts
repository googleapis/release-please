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

import {Updater, Update} from '../update';

/**
 * The CompositeUpdater chains 0...n updaters and updates
 * the content in order.
 */
export class CompositeUpdater implements Updater {
  readonly updaters: Updater[];
  /**
   * Instantiate a new CompositeUpdater
   * @param {Updater[]} updaters The updaters to chain together
   */
  constructor(...updaters: Updater[]) {
    this.updaters = updaters;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string | undefined): string {
    for (const updater of this.updaters) {
      content = updater.updateContent(content);
    }
    return content || '';
  }
}

export function mergeUpdates(updates: Update[]): Update[] {
  const updatesByPath: Record<string, Update[]> = {};
  for (const update of updates) {
    if (updatesByPath[update.path]) {
      updatesByPath[update.path].push(update);
    } else {
      updatesByPath[update.path] = [update];
    }
  }

  const newUpdates: Update[] = [];
  for (const path in updatesByPath) {
    const update = updatesByPath[path];
    const updaters = update.map(u => u.updater);
    newUpdates.push({
      path,
      createIfMissing: update[0].createIfMissing,
      updater:
        updaters.length === 1 ? updaters[0] : new CompositeUpdater(...updaters),
    });
  }
  return newUpdates;
}
