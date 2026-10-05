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

import {logger as defaultLogger, Logger} from './logger';
import {Version} from '../version';

const DEFAULT_HEADER = ':robot: I have created a release *beep* *boop*';
const DEFAULT_FOOTER =
  'This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).';
const NOTES_DELIMITER = '---';

interface PullRequestBodyOptions {
  header?: string;
  footer?: string;
  extra?: string;
  useComponents?: boolean;
}

export class PullRequestBody {
  header: string;
  footer: string;
  extra?: string;
  releaseData: ReleaseData[];
  useComponents: boolean;
  constructor(releaseData: ReleaseData[], options?: PullRequestBodyOptions) {
    this.header = options?.header || DEFAULT_HEADER;
    this.footer = options?.footer || DEFAULT_FOOTER;
    this.extra = options?.extra;
    this.releaseData = releaseData;
    this.useComponents = options?.useComponents ?? this.releaseData.length > 1;
  }
  static parse(
    body: string,
    logger: Logger = defaultLogger
  ): PullRequestBody | undefined {
    const parts = splitBody(body);
    if (!parts) {
      logger.error('Pull request body did not match');
      return undefined;
    }
    let data = extractMultipleReleases(parts.content, logger);
    let useComponents = true;
    if (data.length === 0) {
      data = extractSingleRelease(parts.content, logger);
      useComponents = false;
      if (data.length === 0) {
        logger.warn('Failed to parse releases.');
      }
    }
    return new PullRequestBody(data, {
      header: parts.header,
      footer: parts.footer,
      useComponents,
    });
  }
  notes(): string {
    if (this.useComponents) {
      return this.releaseData
        .map(release => {
          return `<details><summary>${
            release.component ? `${release.component}: ` : ''
          }${release.version?.toString()}</summary>\n\n${
            release.notes
          }\n</details>`;
        })
        .join('\n\n');
    }
    return this.releaseData.map(release => release.notes).join('\n\n');
  }
  toString(): string {
    const notes = this.notes();
    return `${this.header}
${NOTES_DELIMITER}


${notes}

${NOTES_DELIMITER}${this.extra ? `\n\n${this.extra}\n` : ''}
${this.footer}`;
  }
}

function splitBody(
  body: string
): {header: string; footer: string; content: string} | undefined {
  const lines = body.trim().replace(/\r\n/g, '\n').split('\n');
  const index = lines.indexOf(NOTES_DELIMITER);
  if (index === -1) {
    return undefined;
  }
  let lastIndex = lines.lastIndexOf(NOTES_DELIMITER);
  if (lastIndex === index) {
    lastIndex = lines.length - 1;
  }
  const header = lines.slice(0, index).join('\n').trim();
  const content = lines.slice(index + 1, lastIndex).join('\n');
  const footer = lines.slice(lastIndex + 1).join('\n');
  return {
    header,
    footer,
    content,
  };
}

const SUMMARY_PATTERN = /^(?<component>.*[^:]):? (?<version>\d+\.\d+\.\d+.*)$/;
const COMPONENTLESS_SUMMARY_PATTERN = /^(?<version>\d+\.\d+\.\d+.*)$/;
const SECTION_START_PATTERN =
  /^<details>\s*<summary>(?<summary>[^\n]*?)<\/summary>/gm;
const SECTION_END_MARKER = '</details>';
export interface ReleaseData {
  component?: string;
  version?: Version;
  notes: string;
}
interface SectionStart {
  index: number;
  notesIndex: number;
  summary: string;
  component?: string;
  version: Version;
}
function extractMultipleReleases(
  content: string,
  logger: Logger
): ReleaseData[] {
  const starts = findSectionStarts(content, logger);
  return starts.map((start, i) => {
    const limit = i + 1 < starts.length ? starts[i + 1].index : content.length;
    const span = content.slice(start.notesIndex, limit);
    const end = span.lastIndexOf(SECTION_END_MARKER);
    if (end === -1) {
      logger.warn(
        `Missing closing ${SECTION_END_MARKER} for summary: ${start.summary}`
      );
    }
    const notes = (end === -1 ? span : span.slice(0, end)).trim();
    return start.component
      ? {component: start.component, version: start.version, notes}
      : {version: start.version, notes};
  });
}
function findSectionStarts(content: string, logger: Logger): SectionStart[] {
  const starts: SectionStart[] = [];
  const pattern = new RegExp(SECTION_START_PATTERN);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const summary = match.groups!.summary;
    const parsed = parseSummary(summary);
    if (!parsed) {
      logger.warn(`Summary: ${summary} did not match the expected pattern`);
      continue;
    }
    starts.push({
      index: match.index,
      notesIndex: match.index + match[0].length,
      summary,
      ...parsed,
    });
  }
  return starts;
}
function parseSummary(
  summary: string
): {component?: string; version: Version} | undefined {
  const match = summary.match(SUMMARY_PATTERN);
  if (match?.groups) {
    return {
      component: match.groups.component,
      version: Version.parse(match.groups.version),
    };
  }
  const componentlessMatch = summary.match(COMPONENTLESS_SUMMARY_PATTERN);
  if (componentlessMatch?.groups) {
    return {version: Version.parse(componentlessMatch.groups.version)};
  }
  return undefined;
}
const COMPARE_REGEX = /^#{2,} \[?(?<version>\d+\.\d+\.\d+[^\]]*)\]?/;
function extractSingleRelease(body: string, logger: Logger): ReleaseData[] {
  body = body.trim();
  const match = body.match(COMPARE_REGEX);
  const versionString = match?.groups?.version;
  if (!versionString) {
    logger.warn('Failed to find version in release notes');
    return [];
  }
  return [
    {
      version: Version.parse(versionString),
      notes: body,
    },
  ];
}
