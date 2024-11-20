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

import {DefaultUpdater, UpdateOptions} from './default';
import {Version} from '../version';
import {logger as defaultLogger, Logger} from '../util/logger';

const VERSION_REGEX =
  /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<preRelease>[\w.]+))?(\+(?<build>[-\w.]+))?/;
const SINGLE_VERSION_REGEX = /\b\d+\b/;
const INLINE_UPDATE_REGEX =
  /x-release-please-(?<scope>major|minor|patch|version-date|version|date)/;
const BLOCK_START_REGEX =
  /x-release-please-start-(?<scope>major|minor|patch|version-date|version|date)/;
const BLOCK_END_REGEX = /x-release-please-end/;
const DATE_FORMAT_REGEX = /%[Ymd]/g;

type BlockScope =
  | 'major'
  | 'minor'
  | 'patch'
  | 'version'
  | 'date'
  | 'version-date';

/**
 * Options for the Generic updater.
 */
export interface GenericUpdateOptions extends UpdateOptions {
  inlineUpdateRegex?: RegExp;
  blockStartRegex?: RegExp;
  blockEndRegex?: RegExp;
  date?: Date;
  dateFormat?: string;
}

/**
 * The Generic updater looks for well known patterns and replaces
 * content. The well known patterns are:
 *
 * 1. `x-release-please-version` if this string is found on the line,
 *    then replace a semver-looking string on that line with the next
 *    version
 * 2. `x-release-please-major` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    major
 * 3. `x-release-please-minor` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    minor
 * 4. `x-release-please-patch` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    patch
 * 5. `x-release-please-date` if this string is found on the line,
 *    then replace the date with the date of the last commit
 * 6. `x-release-please-version-date` if this string is found on the line,
 *    then replace the both date and version
 *
 * You can also use a block-based replacement. Content between the
 * opening `x-release-please-start-version` and `x-release-please-end` will
 * be considered for version replacement. You can also open these blocks
 * with `x-release-please-start-<major|minor|patch|version-date>` to replace
 * single numbers
 */
export class Generic extends DefaultUpdater {
  private readonly inlineUpdateRegex: RegExp;
  private readonly blockStartRegex: RegExp;
  private readonly blockEndRegex: RegExp;
  private readonly date: Date;
  private readonly dateFormat: string;

  constructor(options: GenericUpdateOptions) {
    super(options);

    this.inlineUpdateRegex = options.inlineUpdateRegex ?? INLINE_UPDATE_REGEX;
    this.blockStartRegex = options.blockStartRegex ?? BLOCK_START_REGEX;
    this.blockEndRegex = options.blockEndRegex ?? BLOCK_END_REGEX;
    this.date = options.date ?? new Date();
    this.dateFormat = options.dateFormat ?? '%Y-%m-%d';
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(
    content: string | undefined,
    logger: Logger = defaultLogger
  ): string {
    if (!content) {
      return '';
    }

    const newLines: string[] = [];
    let blockScope: BlockScope | undefined;

    function replaceVersion(
      line: string,
      scope: BlockScope,
      version: Version,
      date: Date,
      dateFormat: string
    ) {
      const dateRegex = createDateRegex(dateFormat);
      const formattedDate = formatDate(dateFormat, date);

      switch (scope) {
        case 'date':
          if (isValidDate(formattedDate, dateFormat)) {
            newLines.push(line.replace(dateRegex, formattedDate));
          } else {
            logger.warn(`Invalid date format: ${formattedDate}`);
            newLines.push(line);
          }
          return;
        case 'version-date':
          if (isValidDate(formattedDate, dateFormat)) {
            line = line.replace(dateRegex, formattedDate);
          } else {
            logger.warn(`Invalid date format: ${formattedDate}`);
          }
          newLines.push(line.replace(VERSION_REGEX, version.toString()));
          return;
        case 'major':
          newLines.push(line.replace(SINGLE_VERSION_REGEX, `${version.major}`));
          return;
        case 'minor':
          newLines.push(line.replace(SINGLE_VERSION_REGEX, `${version.minor}`));
          return;
        case 'patch':
          newLines.push(line.replace(SINGLE_VERSION_REGEX, `${version.patch}`));
          return;
        case 'version':
          newLines.push(line.replace(VERSION_REGEX, version.toString()));
          return;
        default:
          logger.warn(`unknown block scope: ${scope}`);
          newLines.push(line);
      }
    }

    content.split(/\r?\n/).forEach(line => {
      let match = line.match(this.inlineUpdateRegex);
      if (match) {
        // replace inline versions
        replaceVersion(
          line,
          (match.groups?.scope || 'version') as BlockScope,
          this.version,
          this.date,
          this.dateFormat
        );
      } else if (blockScope) {
        // in a block, so try to replace versions
        replaceVersion(
          line,
          blockScope,
          this.version,
          this.date,
          this.dateFormat
        );
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
            blockScope = 'version';
          }
        }
        newLines.push(line);
      }
    });

    return newLines.join('\n');
  }
}

function createDateRegex(format: string): RegExp {
  const regexString = format.replace(DATE_FORMAT_REGEX, match => {
    switch (match) {
      case '%Y':
        return '(\\d{4})';
      case '%m':
        return '(\\d{2})';
      case '%d':
        return '(\\d{2})';
      default:
        return match;
    }
  });
  return new RegExp(regexString);
}

function formatDate(format: string, date: Date): string {
  return format.replace(DATE_FORMAT_REGEX, match => {
    switch (match) {
      case '%Y':
        return date.getFullYear().toString();
      case '%m':
        return ('0' + (date.getMonth() + 1)).slice(-2);
      case '%d':
        return ('0' + date.getDate()).slice(-2);
      default:
        return match;
    }
  });
}

function isValidDate(dateString: string, format: string): boolean {
  const dateParts = dateString.match(/\d+/g);
  if (!dateParts) return false;

  const year = parseInt(dateParts[format.indexOf('%Y') / 3], 10);
  const month = parseInt(dateParts[format.indexOf('%m') / 3], 10);
  const day = parseInt(dateParts[format.indexOf('%d') / 3], 10);

  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}
