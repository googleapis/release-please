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

import {Version} from '../version';
import {ConventionalCommit} from '../commit';
import {
  VersioningStrategy,
  VersionUpdater,
  CustomVersionUpdate,
} from '../versioning-strategy';
import {logger as defaultLogger, Logger} from '../util/logger';

export interface CalendarVersioningStrategyOptions {
  dateFormat?: string;
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;
  logger?: Logger;
}

/**
 * CalVer versioning strategy that supports calendar-based versioning
 * combined with semantic versioning concepts.
 *
 * Supports formats like:
 * - YYYY.0M.0D (e.g., 2024.01.15)
 * - YY.MM.MICRO (e.g., 24.1.0, 24.1.1)
 * - YYYY.MINOR.MICRO (e.g., 2024.1.0)
 * - YY.0M.0D (e.g., 24.01.15)
 *
 * CalVer format tokens:
 *
 * Date segments:
 * - YYYY: Full year (2006, 2016, 2106)
 * - YY: Short year without zero-padding (6, 16, 106) - relative to 2000
 * - 0Y: Zero-padded year (06, 16, 106) - relative to 2000
 * - MM: Short month (1, 2 ... 11, 12)
 * - 0M: Zero-padded month (01, 02 ... 11, 12)
 * - WW: Short week of year (1, 2, 33, 52)
 * - 0W: Zero-padded week (01, 02, 33, 52)
 * - DD: Short day (1, 2 ... 30, 31)
 * - 0D: Zero-padded day (01, 02 ... 30, 31)
 *
 * Semantic segments (incremented based on commits):
 * - MAJOR: Major version number (breaking changes)
 * - MINOR: Minor version number (features)
 * - MICRO: Micro/patch version number (fixes)
 */
export class CalendarVersioningStrategy implements VersioningStrategy {
  readonly dateFormat: string;
  readonly bumpMinorPreMajor: boolean;
  readonly bumpPatchForMinorPreMajor: boolean;
  protected logger: Logger;
  private currentDate?: Date;

  constructor(options: CalendarVersioningStrategyOptions = {}) {
    this.dateFormat = options.dateFormat ?? DEFAULT_DATE_FORMAT;
    this.bumpMinorPreMajor = options.bumpMinorPreMajor === true;
    this.bumpPatchForMinorPreMajor = options.bumpPatchForMinorPreMajor === true;
    this.logger = options.logger ?? defaultLogger;
  }

  setCurrentDate(date: Date): void {
    this.currentDate = date;
  }

  determineReleaseType(
    version: Version,
    commits: ConventionalCommit[]
  ): VersionUpdater {
    let breaking = 0;
    let features = 0;

    for (const commit of commits) {
      const releaseAs = commit.notes.find(note => note.title === 'RELEASE AS');
      if (releaseAs) {
        this.logger.debug(
          `found Release-As: ${releaseAs.text}, forcing version`
        );
        return new CustomVersionUpdate(
          Version.parse(releaseAs.text).toString()
        );
      }
      if (commit.breaking) {
        breaking++;
      } else if (commit.type === 'feat' || commit.type === 'feature') {
        features++;
      }
    }

    const tokens = parseFormat(this.dateFormat);
    const hasMAJOR = tokens.includes('MAJOR');
    const hasMINOR = tokens.includes('MINOR');
    const hasMICRO = tokens.includes('MICRO');

    const parsed = parseVersionString(version.toString(), this.dateFormat);
    if (!parsed) {
      throw new Error(
        `Failed to parse version "${version}" with format "${this.dateFormat}"`
      );
    }
    const majorIndex = tokens.indexOf('MAJOR');
    const majorValue =
      majorIndex >= 0 ? parsed.segments[majorIndex]?.value ?? 0 : 0;
    const isPreMajor = hasMAJOR && majorValue < 1;

    let bumpType: BumpType = 'micro';

    if (breaking > 0) {
      if (hasMAJOR) {
        if (isPreMajor && this.bumpMinorPreMajor && hasMINOR) {
          bumpType = 'minor';
        } else {
          bumpType = 'major';
        }
      } else if (hasMINOR) {
        bumpType = 'minor';
      } else {
        bumpType = 'micro';
      }
    } else if (features > 0) {
      if (hasMINOR) {
        if (isPreMajor && this.bumpPatchForMinorPreMajor && hasMICRO) {
          bumpType = 'micro';
        } else {
          bumpType = 'minor';
        }
      } else {
        bumpType = 'micro';
      }
    }

    return new CalendarVersionUpdate(
      this.dateFormat,
      bumpType,
      this.currentDate
    );
  }

  bump(version: Version, commits: ConventionalCommit[]): Version {
    return this.determineReleaseType(version, commits).bump(version);
  }
}

export class CalendarVersion extends Version {
  private readonly formattedString: string;

  constructor(
    major: number,
    minor: number,
    patch: number,
    preRelease?: string,
    build?: string,
    formattedString?: string
  ) {
    super(major, minor, patch, preRelease, build);
    this.formattedString = formattedString ?? `${major}.${minor}.${patch}`;
  }

  toString(): string {
    const preReleasePart = this.preRelease ? `-${this.preRelease}` : '';
    const buildPart = this.build ? `+${this.build}` : '';
    return `${this.formattedString}${preReleasePart}${buildPart}`;
  }
}

const DEFAULT_DATE_FORMAT = 'YYYY.0M.0D';

type BumpType = 'major' | 'minor' | 'micro';

interface ParsedCalVer {
  segments: CalVerSegment[];
  preRelease?: string;
  build?: string;
}

interface CalVerSegment {
  type:
    | 'YYYY'
    | 'YY'
    | '0Y'
    | 'MM'
    | '0M'
    | 'WW'
    | '0W'
    | 'DD'
    | '0D'
    | 'MAJOR'
    | 'MINOR'
    | 'MICRO';
  value: number;
  originalString: string;
}

class CalendarVersionUpdate implements VersionUpdater {
  private readonly format: string;
  private readonly currentDate: Date;
  private readonly bumpType: BumpType;

  constructor(format: string, bumpType: BumpType, currentDate?: Date) {
    this.format = format;
    this.bumpType = bumpType;
    this.currentDate = currentDate ?? new Date();
  }

  bump(version: Version): Version {
    const tokens = parseFormat(this.format);
    const parsed = parseVersionString(version.toString(), this.format);
    if (!parsed) {
      throw new Error(
        `Failed to parse version "${version}" with format "${this.format}"`
      );
    }

    const versionDate = extractDateFromSegments(parsed.segments, tokens);
    if (versionDate && versionDate > this.currentDate) {
      throw new Error(
        `Cannot bump version "${version}": the version date is newer than the current date. ` +
          'Ensure the system date is correct or use a release-as override.'
      );
    }

    const newSegments: CalVerSegment[] = [];
    let dateChanged = false;
    let shouldResetLower = false;

    for (let i = 0; i < tokens.length; i++) {
      const tokenType = tokens[i];
      const oldSegment = parsed.segments[i];

      if (isDateSegment(tokenType)) {
        const newDateValue = formatSegment(tokenType, this.currentDate);
        const oldNumericValue = oldSegment?.value ?? 0;
        const newNumericValue = Number(newDateValue);

        if (newNumericValue !== oldNumericValue) {
          dateChanged = true;
          shouldResetLower = true;
        }

        newSegments.push({
          type: tokenType,
          value: newNumericValue,
          originalString: newDateValue,
        });
      } else if (isSemanticSegment(tokenType)) {
        let newValue: number;
        const oldValue = oldSegment?.value ?? 0;

        if (shouldResetLower) {
          if (dateChanged) {
            newValue = 0;
          } else if (tokenType === 'MAJOR' && this.bumpType === 'major') {
            newValue = 1;
          } else if (
            tokenType === 'MINOR' &&
            (this.bumpType === 'major' || this.bumpType === 'minor')
          ) {
            newValue = this.bumpType === 'minor' ? 1 : 0;
          } else if (tokenType === 'MICRO') {
            newValue = this.bumpType === 'micro' ? 1 : 0;
          } else {
            newValue = 0;
          }
        } else {
          const shouldBump =
            (tokenType === 'MAJOR' && this.bumpType === 'major') ||
            (tokenType === 'MINOR' && this.bumpType === 'minor') ||
            (tokenType === 'MICRO' && this.bumpType === 'micro');

          if (shouldBump) {
            newValue = oldValue + 1;
            shouldResetLower = true;
          } else if (shouldResetLower) {
            newValue = 0;
          } else {
            newValue = oldValue;
          }
        }

        newSegments.push({
          type: tokenType,
          value: newValue,
          originalString: newValue.toString(),
        });
      }
    }

    const newParsed: ParsedCalVer = {
      segments: newSegments,
      preRelease: undefined,
      build: parsed?.build,
    };

    const newVersionString = formatVersion(newParsed, this.format);

    const fourPartMatch = newVersionString.match(
      /^(\d+)\.(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.*))?$/
    );
    if (fourPartMatch) {
      return new CalendarVersion(
        Number(fourPartMatch[1]),
        Number(fourPartMatch[2]),
        Number(fourPartMatch[3]),
        fourPartMatch[5],
        fourPartMatch[6],
        `${fourPartMatch[1]}.${fourPartMatch[2]}.${fourPartMatch[3]}.${fourPartMatch[4]}`
      );
    }

    const versionMatch = newVersionString.match(
      /^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.*))?$/
    );
    if (versionMatch) {
      const baseString = `${versionMatch[1]}.${versionMatch[2]}.${versionMatch[3]}`;
      return new CalendarVersion(
        Number(versionMatch[1]),
        Number(versionMatch[2]),
        Number(versionMatch[3]),
        versionMatch[4],
        versionMatch[5],
        baseString
      );
    }

    const twoPartMatch = newVersionString.match(
      /^(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.*))?$/
    );
    if (twoPartMatch) {
      const baseString = `${twoPartMatch[1]}.${twoPartMatch[2]}.0`;
      return new CalendarVersion(
        Number(twoPartMatch[1]),
        Number(twoPartMatch[2]),
        0,
        twoPartMatch[3],
        twoPartMatch[4],
        baseString
      );
    }

    return Version.parse(newVersionString);
  }
}

function isDateSegment(
  type: string
): type is 'YYYY' | 'YY' | '0Y' | 'MM' | '0M' | 'WW' | '0W' | 'DD' | '0D' {
  return ['YYYY', 'YY', '0Y', 'MM', '0M', 'WW', '0W', 'DD', '0D'].includes(
    type
  );
}

function isSemanticSegment(type: string): type is 'MAJOR' | 'MINOR' | 'MICRO' {
  return ['MAJOR', 'MINOR', 'MICRO'].includes(type);
}

const SHORT_YEAR_EPOCH = 2000;

function extractDateFromSegments(
  segments: CalVerSegment[],
  tokens: CalVerSegment['type'][]
): Date | null {
  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;
  let week: number | null = null;

  for (let i = 0; i < segments.length; i++) {
    const token = tokens[i];
    const value = segments[i].value;

    switch (token) {
      case 'YYYY':
        year = value;
        break;
      case 'YY':
      case '0Y':
        year = value + SHORT_YEAR_EPOCH;
        break;
      case 'MM':
      case '0M':
        month = value;
        break;
      case 'DD':
      case '0D':
        day = value;
        break;
      case 'WW':
      case '0W':
        week = value;
        break;
    }
  }

  if (year === null) {
    return null;
  }

  if (month !== null && day !== null) {
    return new Date(Date.UTC(year, month - 1, day));
  }

  if (month !== null) {
    return new Date(Date.UTC(year, month - 1, 1));
  }

  if (week !== null) {
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const jan1DayOfWeek = (jan1.getUTCDay() + 6) % 7;
    const daysToAdd = (week - 1) * 7 - jan1DayOfWeek;
    return new Date(Date.UTC(year, 0, 1 + daysToAdd));
  }

  return new Date(Date.UTC(year, 0, 1));
}

// Week of year where January 1 is always in week 1.
// Weeks align with calendar weeks (starting Monday).
function getWeekOfYear(date: Date): number {
  const jan1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  // Days since Monday: Monday = 0, Tuesday = 1, ..., Sunday = 6
  const jan1DayOfWeek = (jan1.getUTCDay() + 6) % 7;
  const daysSinceJan1 = Math.floor(
    (date.getTime() - jan1.getTime()) / 86400000
  );
  return Math.floor((daysSinceJan1 + jan1DayOfWeek) / 7) + 1;
}

function formatSegment(type: CalVerSegment['type'], date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const week = getWeekOfYear(date);
  const shortYear = year - SHORT_YEAR_EPOCH;

  switch (type) {
    case 'YYYY':
      return year.toString();
    case 'YY':
      return shortYear.toString();
    case '0Y':
      return shortYear.toString().padStart(2, '0');
    case 'MM':
      return month.toString();
    case '0M':
      return month.toString().padStart(2, '0');
    case 'WW':
      return week.toString();
    case '0W':
      return week.toString().padStart(2, '0');
    case 'DD':
      return day.toString();
    case '0D':
      return day.toString().padStart(2, '0');
    default:
      return '';
  }
}

const CALVER_PLACEHOLDERS: Record<string, string> = {
  YYYY: '\\d{4}',
  '0Y': '\\d{2,3}',
  YY: '\\d{1,3}',
  '0M': '\\d{2}',
  MM: '\\d{1,2}',
  '0W': '\\d{2}',
  WW: '\\d{1,2}',
  '0D': '\\d{2}',
  DD: '\\d{1,2}',
  MAJOR: '\\d+',
  MINOR: '\\d+',
  MICRO: '\\d+',
};

const PLACEHOLDER_PATTERN = new RegExp(
  Object.keys(CALVER_PLACEHOLDERS)
    .sort((a, b) => b.length - a.length)
    .join('|'),
  'g'
);

function parseFormat(format: string): CalVerSegment['type'][] {
  const tokens: CalVerSegment['type'][] = [];
  let match;
  while ((match = PLACEHOLDER_PATTERN.exec(format)) !== null) {
    tokens.push(match[0] as CalVerSegment['type']);
  }
  PLACEHOLDER_PATTERN.lastIndex = 0;
  return tokens;
}

function parseVersionString(
  versionString: string,
  format: string
): ParsedCalVer | null {
  const tokens = parseFormat(format);
  if (tokens.length === 0) {
    return null;
  }

  let regexPattern = format.replace(/\./g, '\\.');
  regexPattern = regexPattern.replace(PLACEHOLDER_PATTERN, match => {
    const pattern = CALVER_PLACEHOLDERS[match];
    return pattern ? `(${pattern})` : match;
  });
  regexPattern = `^${regexPattern}(?:-([^+]+))?(?:\\+(.*))?$`;

  const regex = new RegExp(regexPattern);
  const match = versionString.match(regex);

  if (!match) {
    return null;
  }

  const segments: CalVerSegment[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const originalString = match[i + 1];
    segments.push({
      type: tokens[i],
      value: Number(originalString),
      originalString,
    });
  }

  return {
    segments,
    preRelease: match[tokens.length + 1],
    build: match[tokens.length + 2],
  };
}

function formatVersion(parsed: ParsedCalVer, format: string): string {
  let result = format;

  const tokenOrder = [
    'YYYY',
    '0Y',
    'YY',
    '0M',
    'MM',
    '0W',
    'WW',
    '0D',
    'DD',
    'MAJOR',
    'MINOR',
    'MICRO',
  ];

  const segmentsByType = new Map<string, CalVerSegment>();
  for (const segment of parsed.segments) {
    segmentsByType.set(segment.type, segment);
  }

  for (const token of tokenOrder) {
    const segment = segmentsByType.get(token);
    if (segment) {
      result = result.replace(token, segment.originalString);
    }
  }

  if (parsed.preRelease) {
    result += `-${parsed.preRelease}`;
  }
  if (parsed.build) {
    result += `+${parsed.build}`;
  }

  return result;
}
