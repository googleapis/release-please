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

    // Prepare types config, supporting regex-like "type" patterns by mapping
    // them to synthetic types that conventional-changelog can group by.
    const config: {[key: string]: ChangelogSection[]} = {};
    const regexMatchers: Array<{regex: RegExp; syntheticType: string; hidden?: boolean}> = [];
    const hasRegexMeta = (pattern: string): boolean => /[.*+?^${}()|[\]\\]/.test(pattern);
    const toRegex = (pattern: string): RegExp | undefined => {
      try {
        return new RegExp(pattern);
      } catch (_err) {
        return undefined;
      }
    };
    if (options.changelogSections) {
      const remappedTypes: ChangelogSection[] = [];
      let regexIndex = 0;
      for (const section of options.changelogSections) {
        if (hasRegexMeta(section.type)) {
          const rx = toRegex(section.type);
          if (rx) {
            const syntheticType = `regex-${regexIndex++}`;
            regexMatchers.push({regex: rx, syntheticType, hidden: section.hidden});
            remappedTypes.push({type: syntheticType, section: section.section, hidden: section.hidden});
          }
        } else {
          remappedTypes.push(section);
        }
      }
      config.types = remappedTypes;
    }
    const preset = await presetFactory(config);
    preset.writerOpts.commitPartial =
      this.commitPartial || preset.writerOpts.commitPartial;
    preset.writerOpts.headerPartial =
      this.headerPartial || preset.writerOpts.headerPartial;
    preset.writerOpts.mainTemplate =
      this.mainTemplate || preset.writerOpts.mainTemplate;
    const changelogCommits = commits.map(commit => {
      // If regex types are configured, override the type used for grouping
      // when the commit subject matches a configured regex pattern.
      let mappedType = commit.type;
      if (regexMatchers.length > 0) {
        const subject = commit.bareMessage || commit.message;
        const matcher = regexMatchers.find(m => m.regex.test(subject));
        if (matcher) {
          mappedType = matcher.syntheticType;
        }
      }
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
      return {
        body: '', // commit.body,
        subject: htmlEscape(commit.bareMessage),
        type: mappedType,
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

    return conventionalChangelogWriter
      .parseArray(changelogCommits, context, preset.writerOpts)
      .trim();
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
  return message.replace(/``[^`].*[^`]``|`[^`]*`|<|>/g, match =>
    match.length > 1 ? match : match === '<' ? '&lt;' : '&gt;'
  );
}
