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

import {DefaultUpdater} from './default';
import {logger} from '../util/logger';

/**
 * Updates an arbitrary file
 */
export class ArbitraryFile extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string): string {
    if (!this.versionsMap) {
      const msg = 'lacking versionsMap';
      logger.error(msg);
      throw new Error(msg);
    }
    if (!this.versionsMap?.has('previousVersion')) {
      const msg = 'lacking previousVersion in versionsMap';
      logger.error(msg);
      throw new Error(msg);
    } 
    return content.replace(
      this.versionsMap.get('previousVersion')!.toString(),
      this.version.toString()
    );
  }
}
