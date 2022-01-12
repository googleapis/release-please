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

import {logger} from './logger';
import {parse} from 'node-html-parser';
import {Version} from '../version';

const DEFAULT_HEADER = ':robot: I have created a release *beep* *boop*';
const DEFAULT_FOOTER =
  'This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).';
const NOTES_DELIMITER = '---';

interface PullRequestBodyOptions {
  header?: string;
  footer?: string;
}

export class PullRequestBody {
  header: string;
  footer: string;
  releaseData: ReleaseData[];
  constructor(releaseData: ReleaseData[], options?: PullRequestBodyOptions) {
    this.header = options?.header || DEFAULT_HEADER;
    this.footer = options?.footer || DEFAULT_FOOTER;
    this.releaseData = releaseData;
  }
  static parse(body: string): PullRequestBody | undefined {
    const parts = splitBody(body);
    if (!parts) {
      logger.error('Pull request body did not match');
      return undefined;
    }
    let data = extractMultipleReleases(parts.content);
    if (data.length === 0) {
      data = extractSingleRelease(parts.content);
      if (data.length === 0) {
        logger.warn('Failed to parse releases.');
      }
    }
    return new PullRequestBody(data, {
      header: parts.header,
      footer: parts.footer,
    });
  }
  notes(): string {
    if (this.releaseData.length > 1) {
      return this.releaseData
        .map(release => {
          return `<details><summary>${
            release.component
          }: ${release.version?.toString()}</summary>\n\n${
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

${NOTES_DELIMITER}
${this.footer}`;
  }
}

function splitBody(
  body: string
): {header: string; footer: string; content: string} | undefined {
  const lines = body.trim().split('\n');
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
export interface ReleaseData {
  component?: string;
  version?: Version;
  notes: string;
}
function extractMultipleReleases(notes: string): ReleaseData[] {
  const data: ReleaseData[] = [];
  const root = parse(notes);
  for (const detail of root.getElementsByTagName('details')) {
    const summaryNode = detail.getElementsByTagName('summary')[0];
    const summary = summaryNode?.textContent;
    const match = summary.match(SUMMARY_PATTERN);
    if (!match?.groups) {
      logger.warn(`Summary: ${summary} did not match the expected pattern`);
      continue;
    }
    detail.removeChild(summaryNode);
    const notes = detail.textContent.trim();
    data.push({
      component: match.groups.component,
      version: Version.parse(match.groups.version),
      notes,
    });
  }
  return data;
}
const COMPARE_REGEX = /^#{2,} \[(?<version>\d+\.\d+\.\d+.*)\]/;
function extractSingleRelease(body: string): ReleaseData[] {
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
