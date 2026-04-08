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

import {
  ChangelogSection,
  ChangelogNotes,
  BuildNotesOptions,
} from '../changelog-notes';
import {ConventionalCommit} from '../commit';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const conventionalChangelogWriter = require('conventional-changelog-writer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const presetFactory = require('conventional-changelog-conventionalcommits');
const DEFAULT_HOST = 'https://github.com';

interface DefaultChangelogNotesOptions {
  commitPartial?: string;
  headerPartial?: string;
  mainTemplate?: string;
}

interface Note {
  title: string;
  text: string;
}

const INLINE_CODE_PATTERN = /``[^`].*[^`]``|`[^`]*`/g;

export class DefaultChangelogNotes implements ChangelogNotes {
  // allow for customized commit template.
  private commitPartial?: string;
  private headerPartial?: string;
  private mainTemplate?: string;

  constructor(options: DefaultChangelogNotesOptions = {}) {
    this.commitPartial = options.commitPartial;
    this.headerPartial = options.headerPartial;
    this.mainTemplate = options.mainTemplate;
  }

  async buildNotes(
    commits: ConventionalCommit[],
    options: BuildNotesOptions
  ): Promise<string> {
    const context = {
      host: options.host || DEFAULT_HOST,
      owner: options.owner,
      repository: options.repository,
      version: options.version,
      previousTag: options.previousTag,
      currentTag: options.currentTag,
      linkCompare: !!options.previousTag,
    };

    const config: {[key: string]: ChangelogSection[]} = {};
    if (options.changelogSections) {
      config.types = options.changelogSections;
    }
    const preset = await presetFactory(config);
    preset.writerOpts.commitPartial =
      this.commitPartial || preset.writerOpts.commitPartial;
    preset.writerOpts.headerPartial =
      this.headerPartial || preset.writerOpts.headerPartial;
    preset.writerOpts.mainTemplate =
      this.mainTemplate || preset.writerOpts.mainTemplate;
    const protectedInlineCode = new Map<string, string>();
    let inlineCodeTokenIndex = 0;
    const changelogCommits = commits.map(commit => {
      const notes = commit.notes
        .filter(note => note.title === 'BREAKING CHANGE')
        .map(note =>
          replaceIssueLink(
            note,
            context.host,
            context.owner,
            context.repository
          )
        );
      const subject = protectInlineCode(
        htmlEscape(commit.bareMessage),
        protectedInlineCode,
        () => buildInlineCodeToken(inlineCodeTokenIndex++)
      );
      return {
        body: '', // commit.body,
        subject,
        type: commit.type,
        scope: commit.scope,
        notes,
        references: commit.references,
        mentions: [],
        merge: null,
        revert: null,
        header: commit.message,
        footer: commit.notes
          .filter(note => note.title === 'RELEASE AS')
          .map(note => `Release-As: ${note.text}`)
          .join('\n'),
        hash: commit.sha,
      };
    });

    return restoreInlineCode(
      conventionalChangelogWriter
        .parseArray(changelogCommits, context, preset.writerOpts)
        .trim(),
      protectedInlineCode
    );
  }
}

function replaceIssueLink(
  note: Note,
  host: string,
  owner: string,
  repo: string
): Note {
  note.text = note.text.replace(
    /\(#(\d+)\)/,
    `([#$1](${host}/${owner}/${repo}/issues/$1))`
  );
  return note;
}

function htmlEscape(message: string): string {
  return message.replace(
    new RegExp(`${INLINE_CODE_PATTERN.source}|<|>`, 'g'),
    match => (match.length > 1 ? match : match === '<' ? '&lt;' : '&gt;')
  );
}

function buildInlineCodeToken(index: number): string {
  return `INLINE_CODE_TOKEN_${index}`;
}

function protectInlineCode(
  message: string,
  protectedInlineCode: Map<string, string>,
  nextToken: () => string
): string {
  return message.replace(INLINE_CODE_PATTERN, match => {
    const token = nextToken();
    protectedInlineCode.set(token, match);
    return token;
  });
}

function restoreInlineCode(
  message: string,
  protectedInlineCode: Map<string, string>
): string {
  for (const [token, inlineCode] of protectedInlineCode.entries()) {
    message = message.replace(new RegExp(token, 'g'), inlineCode);
  }
  return message;
}
