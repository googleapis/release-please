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
  calverScheme?: string;
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
  readonly calverScheme: string;
  protected logger: Logger;
  private currentDate?: Date;

  constructor(options: CalendarVersioningStrategyOptions = {}) {
    this.calverScheme = options.calverScheme ?? DEFAULT_SCHEME;
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

    const tokens = parseFormat(this.calverScheme);
    const hasBreaking = breaking > 0;
    const hasFeatures = features > 0;
    const bumpType = determineBumpType(tokens, hasBreaking, hasFeatures);

    return new CalendarVersionUpdate(
      this.calverScheme,
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

const DEFAULT_SCHEME = 'YYYY.0M.0D';

type BumpType = 'major' | 'minor' | 'micro';

function determineBumpType(
  tokens: CalVerToken[],
  hasBreaking: boolean,
  hasFeatures: boolean
): BumpType {
  const availableTokens = new Set(tokens);

  if (hasBreaking) {
    if (availableTokens.has('MAJOR')) return 'major';
    if (availableTokens.has('MINOR')) return 'minor';
  } else if (hasFeatures) {
    if (availableTokens.has('MINOR')) return 'minor';
  }

  return 'micro';
}

interface ParsedCalVer {
  segments: CalVerSegment[];
  preRelease?: string;
  build?: string;
}

type CalVerToken =
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

interface CalVerSegment {
  type: CalVerToken;
  value: number;
  originalString: string;
}

interface SegmentProcessingState {
  dateChanged: boolean;
  shouldResetLower: boolean;
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
    const parsed = this.parseAndValidate(version, tokens);

    const newSegments = this.buildNewSegments(tokens, parsed.segments);

    return this.createVersion(newSegments, parsed.build);
  }

  private createVersion(
    segments: CalVerSegment[],
    build?: string
  ): CalendarVersion {
    const formattedString = formatVersion(
      {segments, preRelease: undefined, build},
      this.format
    );

    const values = segments.map(s => s.value);
    const major = values[0] ?? 0;
    const minor = values[1] ?? 0;
    const patch = values[2] ?? 0;

    return new CalendarVersion(
      major,
      minor,
      patch,
      undefined,
      build,
      formattedString
    );
  }

  private parseAndValidate(
    version: Version,
    tokens: CalVerToken[]
  ): ParsedCalVer {
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

    return parsed;
  }

  private buildNewSegments(
    tokens: CalVerToken[],
    oldSegments: CalVerSegment[]
  ): CalVerSegment[] {
    const state: SegmentProcessingState = {
      dateChanged: false,
      shouldResetLower: false,
    };

    return tokens.map((tokenType, i) => {
      const oldSegment = oldSegments[i];

      if (isDateSegment(tokenType)) {
        return this.processDateSegment(tokenType, oldSegment, state);
      }
      return this.processSemanticSegment(tokenType, oldSegment, state);
    });
  }

  private processDateSegment(
    tokenType: CalVerToken,
    oldSegment: CalVerSegment | undefined,
    state: SegmentProcessingState
  ): CalVerSegment {
    const newDateValue = formatSegment(tokenType, this.currentDate);
    const oldNumericValue = oldSegment?.value ?? 0;
    const newNumericValue = Number(newDateValue);

    if (newNumericValue !== oldNumericValue) {
      state.dateChanged = true;
      state.shouldResetLower = true;
    }

    return {
      type: tokenType,
      value: newNumericValue,
      originalString: newDateValue,
    };
  }

  private processSemanticSegment(
    tokenType: CalVerToken,
    oldSegment: CalVerSegment | undefined,
    state: SegmentProcessingState
  ): CalVerSegment {
    const oldValue = oldSegment?.value ?? 0;
    const newValue = state.dateChanged
      ? 0
      : this.computeValueSameDate(tokenType, oldValue, state);

    return {
      type: tokenType,
      value: newValue,
      originalString: newValue.toString(),
    };
  }

  private computeValueSameDate(
    tokenType: CalVerToken,
    oldValue: number,
    state: SegmentProcessingState
  ): number {
    if (state.shouldResetLower) {
      return 0;
    }

    const isTargetSegment = this.isTargetSegmentForBump(tokenType);
    if (isTargetSegment) {
      state.shouldResetLower = true;
      return oldValue + 1;
    }

    return oldValue;
  }

  private isTargetSegmentForBump(tokenType: CalVerToken): boolean {
    return tokenType.toLowerCase() === this.bumpType;
  }
}

const SHORT_YEAR_EPOCH = 2000;

const YEAR_TOKENS = new Set(['YYYY', 'YY', '0Y']);
const SHORT_YEAR_TOKENS = new Set(['YY', '0Y']);
const MONTH_TOKENS = new Set(['MM', '0M']);
const DAY_TOKENS = new Set(['DD', '0D']);
const WEEK_TOKENS = new Set(['WW', '0W']);
const DATE_TOKENS = new Set([
  ...YEAR_TOKENS,
  ...MONTH_TOKENS,
  ...DAY_TOKENS,
  ...WEEK_TOKENS,
]);

function isDateSegment(
  type: string
): type is 'YYYY' | 'YY' | '0Y' | 'MM' | '0M' | 'WW' | '0W' | 'DD' | '0D' {
  return DATE_TOKENS.has(type);
}

function extractDateFromSegments(
  segments: CalVerSegment[],
  tokens: CalVerToken[]
): Date | null {
  const values = extractDateValues(segments, tokens);

  if (values.year === null) {
    return null;
  }

  return buildDate(values);
}

interface DateValues {
  year: number | null;
  month: number | null;
  day: number | null;
  week: number | null;
}

function extractDateValues(
  segments: CalVerSegment[],
  tokens: CalVerToken[]
): DateValues {
  const values: DateValues = {year: null, month: null, day: null, week: null};

  for (let i = 0; i < segments.length; i++) {
    const token = tokens[i];
    const value = segments[i].value;

    if (YEAR_TOKENS.has(token)) {
      values.year = SHORT_YEAR_TOKENS.has(token)
        ? value + SHORT_YEAR_EPOCH
        : value;
    } else if (MONTH_TOKENS.has(token)) {
      values.month = value;
    } else if (DAY_TOKENS.has(token)) {
      values.day = value;
    } else if (WEEK_TOKENS.has(token)) {
      values.week = value;
    }
  }

  return values;
}

function buildDate(values: DateValues): Date {
  const year = values.year!;

  if (values.month !== null) {
    const day = values.day ?? 1;
    return new Date(Date.UTC(year, values.month - 1, day));
  }

  if (values.week !== null) {
    return buildDateFromWeek(year, values.week);
  }

  return new Date(Date.UTC(year, 0, 1));
}

function buildDateFromWeek(year: number, week: number): Date {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1DayOfWeek = (jan1.getUTCDay() + 6) % 7;
  const daysToAdd = (week - 1) * 7 - jan1DayOfWeek;
  return new Date(Date.UTC(year, 0, 1 + daysToAdd));
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

interface DateParts {
  year: number;
  shortYear: number;
  month: number;
  day: number;
  week: number;
}

function getDateParts(date: Date): DateParts {
  const year = date.getUTCFullYear();
  return {
    year,
    shortYear: year - SHORT_YEAR_EPOCH,
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    week: getWeekOfYear(date),
  };
}

type SegmentFormatter = (parts: DateParts) => string;

const SEGMENT_FORMATTERS: Record<string, SegmentFormatter> = {
  YYYY: parts => parts.year.toString(),
  YY: parts => parts.shortYear.toString(),
  '0Y': parts => parts.shortYear.toString().padStart(2, '0'),
  MM: parts => parts.month.toString(),
  '0M': parts => parts.month.toString().padStart(2, '0'),
  WW: parts => parts.week.toString(),
  '0W': parts => parts.week.toString().padStart(2, '0'),
  DD: parts => parts.day.toString(),
  '0D': parts => parts.day.toString().padStart(2, '0'),
};

function formatSegment(type: CalVerToken, date: Date): string {
  const formatter = SEGMENT_FORMATTERS[type];
  return formatter ? formatter(getDateParts(date)) : '';
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

function parseFormat(format: string): CalVerToken[] {
  return [...format.matchAll(PLACEHOLDER_PATTERN)].map(
    m => m[0] as CalVerToken
  );
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

  for (const segment of parsed.segments) {
    result = result.replace(segment.type, segment.originalString);
  }

  if (parsed.preRelease) {
    result += `-${parsed.preRelease}`;
  }
  if (parsed.build) {
    result += `+${parsed.build}`;
  }

  return result;
}
