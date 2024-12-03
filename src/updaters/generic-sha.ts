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

import { DefaultUpdater, UpdateOptions } from './default';
import { logger as defaultLogger, Logger } from '../util/logger';

const COMMIT_SHA_REGEX = /\b([a-f0-9]{7,40})\b/; // Regex to match commit SHAs
const VERSION_REGEX = /#\s*v?\d+\.\d+\.\d+/;
const INLINE_UPDATE_REGEX = /x-release-please-(?<scope>sha)/;
const BLOCK_START_REGEX = /x-release-please-start-sha/;
const BLOCK_END_REGEX = /x-release-please-end/;

type BlockScope = 'sha' | 'version';;

/**
 * Options for the Generic updater for commit SHAs.
 */
export interface GenericShaUpdateOptions extends UpdateOptions {
  inlineUpdateRegex?: RegExp;
  blockStartRegex?: RegExp;
  blockEndRegex?: RegExp;
}

export class GenericSha extends DefaultUpdater {
  private readonly inlineUpdateRegex: RegExp;
  private readonly blockStartRegex: RegExp;
  private readonly blockEndRegex: RegExp;

  private sha: string;

  constructor(options: GenericShaUpdateOptions) {
    super(options);

    this.inlineUpdateRegex = options.inlineUpdateRegex ?? INLINE_UPDATE_REGEX;
    this.blockStartRegex = options.blockStartRegex ?? BLOCK_START_REGEX;
    this.blockEndRegex = options.blockEndRegex ?? BLOCK_END_REGEX;

    this.sha = this.getLatestCommitSha();
  }

  /**
   * Fetches the latest commit SHA from the GitHub Actions environment.
   * @returns {string} The latest commit SHA
   */
  private getLatestCommitSha(): string {
    // fetch the latest commit SHA from GitHub Actions environment variable
    const sha = process.env.GITHUB_SOURCE_SHA;
    if (!sha) {
      throw new Error('GITHUB_SOURCE_SHA is not available. Make sure this is run in a GitHub Actions environment.');
    }
    return sha;
  }

  /**
   * Given initial file contents, return updated contents with commit SHA.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(
    content: string | undefined,
    logger: Logger = defaultLogger
  ): string {
    logger.debug(`updateContent: ${content}`)
    if (!content) {
      return '';
    }

    const newLines: string[] = [];
    let blockScope: BlockScope | undefined;

    const version = this.version.toString(); 

    function replaceContent(line: string, scope: BlockScope, sha: string, version: string) {
      switch (scope) {
        case 'sha':
          // replace commit SHA with the latest commit SHA
          newLines.push(line.replace(COMMIT_SHA_REGEX, sha));
          return;
        case 'version':
          // replace version numbers (e.g., # v1.0.0) with the new version
          newLines.push(line.replace(VERSION_REGEX, `# v${version}`));
          return;
        default:
          logger.warn(`unknown block scope: ${scope}`);
          newLines.push(line);
      }
    }

    content.split(/\r?\n/).forEach(line => {
      let match = line.match(this.inlineUpdateRegex);
      if (match) {
        replaceContent(
          line,
          (match.groups?.scope || 'sha') as BlockScope,
          this.sha,
          version
        );
      } else if (blockScope) {
        // in a block, so try to replace versions
        replaceContent(line, blockScope, this.sha, version);
        if (line.match(this.blockEndRegex)) {
          blockScope = undefined;
        }
      } else {
        // look for block start line
        match = line.match(this.blockStartRegex);
        if (match) {
          if (match.groups?.scope) {
            blockScope = match.groups.scope as BlockScope;
          } else {
            blockScope = 'version'; // default to 'version' scope
          }
        }
        newLines.push(line);
      }
    });

    return newLines.join('\n');
  }
}
