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

const DEFAULT_HEADER = ':sparkles: Stainless prepared a new release';
const DEFAULT_FOOTER = `This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.`;
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
const COMPARE_REGEX = /^#{2,} \[?(?<version>\d+\.\d+\.\d+.*)\]?/;
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
