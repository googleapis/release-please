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
import {parse} from 'node-html-parser';
import {Version} from '../version';

const DEFAULT_HEADER = ':robot: I have created a release *beep* *boop*';
const DEFAULT_FOOTER =
  'This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).';
const NOTES_DELIMITER = '---';
const CUSTOM_NOTES_BEGIN = '<!-- BEGIN CUSTOM RELEASE NOTES -->';
const CUSTOM_NOTES_END = '<!-- END CUSTOM RELEASE NOTES -->';

interface PullRequestBodyOptions {
  header?: string;
  footer?: string;
  extra?: string;
  useComponents?: boolean;
  customReleaseNotes?: string;
}

export class PullRequestBody {
  header: string;
  footer: string;
  extra?: string;
  releaseData: ReleaseData[];
  useComponents: boolean;
  customReleaseNotes?: string;
  constructor(releaseData: ReleaseData[], options?: PullRequestBodyOptions) {
    this.header = options?.header || DEFAULT_HEADER;
    this.footer = options?.footer || DEFAULT_FOOTER;
    this.extra = options?.extra;
    this.releaseData = releaseData;
    this.useComponents = options?.useComponents ?? this.releaseData.length > 1;
    this.customReleaseNotes = options?.customReleaseNotes;
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
    const {notes: customReleaseNotes, rest: content} =
      parseCustomReleaseNotes(parts.content);
    let data = extractMultipleReleases(content, logger);
    let useComponents = true;
    if (data.length === 0) {
      data = extractSingleRelease(content, logger);
      useComponents = false;
      if (data.length === 0) {
        logger.warn('Failed to parse releases.');
      }
    }
    return new PullRequestBody(data, {
      header: parts.header,
      footer: parts.footer,
      useComponents,
      customReleaseNotes,
    });
  }
  notes(): string {
    const customSection = this.customReleaseNotes
      ? `${CUSTOM_NOTES_BEGIN}\n${this.customReleaseNotes}\n${CUSTOM_NOTES_END}\n\n`
      : '';
    let generatedNotes: string;
    if (this.useComponents) {
      generatedNotes = this.releaseData
        .map(release => {
          return `<details><summary>${
            release.component ? `${release.component}: ` : ''
          }${release.version?.toString()}</summary>\n\n${
            release.notes
          }\n</details>`;
        })
        .join('\n\n');
    } else {
      generatedNotes = this.releaseData
        .map(release => release.notes)
        .join('\n\n');
    }
    return customSection + generatedNotes;
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
export interface ReleaseData {
  component?: string;
  version?: Version;
  notes: string;
}
function extractMultipleReleases(notes: string, logger: Logger): ReleaseData[] {
  const data: ReleaseData[] = [];
  const root = parse(notes);
  for (const detail of root.getElementsByTagName('details')) {
    const summaryNode = detail.getElementsByTagName('summary')[0];
    const summary = summaryNode?.textContent;
    const match = summary.match(SUMMARY_PATTERN);
    if (match?.groups) {
      detail.removeChild(summaryNode);
      const notes = detail.textContent.trim();
      data.push({
        component: match.groups.component,
        version: Version.parse(match.groups.version),
        notes,
      });
    } else {
      const componentlessMatch = summary.match(COMPONENTLESS_SUMMARY_PATTERN);
      if (!componentlessMatch?.groups) {
        logger.warn(`Summary: ${summary} did not match the expected pattern`);
        continue;
      }
      detail.removeChild(summaryNode);
      const notes = detail.textContent.trim();
      data.push({
        version: Version.parse(componentlessMatch.groups.version),
        notes,
      });
    }
  }
  return data;
}
function parseCustomReleaseNotes(content: string): {
  notes: string | undefined;
  rest: string;
} {
  const sections: string[] = [];
  let rest = content;
  while (true) {
    const beginIndex = rest.indexOf(CUSTOM_NOTES_BEGIN);
    const endIndex = rest.indexOf(CUSTOM_NOTES_END);
    if (beginIndex === -1 || endIndex === -1 || endIndex <= beginIndex) break;
    const notes = rest
      .slice(beginIndex + CUSTOM_NOTES_BEGIN.length, endIndex)
      .trim();
    if (notes) sections.push(notes);
    rest =
      rest.slice(0, beginIndex) + rest.slice(endIndex + CUSTOM_NOTES_END.length);
  }
  return {
    notes: sections.length > 0 ? sections.join('\n\n') : undefined,
    rest: rest.trim(),
  };
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
