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
import {importEsm} from '../util/import-esm';
import {
  CommitPartial,
  HeaderPartial,
  MainTemplate,
  TemplateCommit,
  TemplateContext,
  commitPartial as defaultCommitPartial,
  commitUrl,
  headerPartial as defaultHeaderPartial,
  issueUrl,
  mainTemplate as defaultMainTemplate,
  userUrl,
} from './templates';

const DEFAULT_HOST = 'https://github.com';

// The conventionalcommits preset used to match numeric issue references only;
// keep that behavior rather than its current default of matching any
// alphanumeric reference.
const ISSUE_PATTERN = /[0-9]+/;

interface DefaultChangelogNotesOptions {
  commitPartial?: CommitPartial;
  headerPartial?: HeaderPartial;
  mainTemplate?: MainTemplate;
}

interface Note {
  title: string;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WriterOptions = Record<string, any>;

interface ConventionalChangelogWriter {
  writeChangelogString(
    commits: TemplateCommit[],
    context: Partial<TemplateContext>,
    options: WriterOptions
  ): Promise<string>;
}

interface ConventionalCommitsPreset {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default(config?: Record<string, any>): {writer: WriterOptions};
}

export class DefaultChangelogNotes implements ChangelogNotes {
  // allow for customized commit template.
  private commitPartial?: CommitPartial;
  private headerPartial?: HeaderPartial;
  private mainTemplate?: MainTemplate;

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

    // `conventional-changelog-writer` and the conventionalcommits preset are
    // ESM-only, this package is published as CommonJS.
    const [writer, preset] = await Promise.all([
      importEsm<ConventionalChangelogWriter>('conventional-changelog-writer'),
      importEsm<ConventionalCommitsPreset>(
        'conventional-changelog-conventionalcommits'
      ),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: Record<string, any> = {
      issuePattern: ISSUE_PATTERN,
      // release-please renders the links itself, so that the generated
      // changelog does not depend on the preset's URL formatting.
      formatCommitUrl: commitUrl,
      formatIssueUrl: issueUrl,
      formatUserUrl: userUrl,
    };
    if (options.changelogSections) {
      config.types = options.changelogSections.map(toPresetCommitType);
    }

    const writerOptions: WriterOptions = {
      ...preset.default(config).writer,
      template: this.mainTemplate || defaultMainTemplate,
      headerPartial: this.headerPartial || defaultHeaderPartial,
      commitPartial: this.commitPartial || defaultCommitPartial,
      preamblePartial: () => '',
      footerPartial: () => '',
      // notes are rendered in the order they were parsed in.
      notesSort: undefined,
    };

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
      let subject = htmlEscape(commit.bareMessage);
      // Append author info if enabled and author is available
      if (options.includeCommitAuthors && commit.author) {
        const authorDisplay = commit.author.username
          ? `@${commit.author.username}`
          : commit.author.name;
        subject = `${subject} (${authorDisplay})`;
      }
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

    return (
      await writer.writeChangelogString(
        changelogCommits,
        context,
        writerOptions
      )
    ).trim();
  }
}

/**
 * Translates a release-please changelog section into a commit type of the
 * conventionalcommits preset, which expresses hidden sections as an effect.
 */
function toPresetCommitType(section: ChangelogSection) {
  return {
    type: section.type,
    section: section.section,
    effect: section.hidden ? 'hidden' : 'bump',
  };
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
