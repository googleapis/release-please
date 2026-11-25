// Copyright 2026 Google LLC
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

/**
 * Changelog templates.
 *
 * `conventional-changelog-writer` 9 renders changelogs with plain functions
 * instead of handlebars templates, which is what lets release-please drop
 * handlebars from its dependency tree. The functions below reproduce the
 * markdown that release-please produced with the handlebars templates of
 * `conventional-changelog-conventionalcommits` 6, byte for byte.
 */

/** A commit reference, as produced by the conventional commits parser. */
export interface TemplateReference {
  owner?: string | null;
  repository?: string | null;
  prefix: string;
  issue: string;
  action?: string | null;
}

/** A commit after the preset's `transform` has run over it. */
export interface TemplateCommit {
  scope?: string | null;
  subject?: string;
  header?: string;
  body?: string;
  hash?: string;
  shortHash?: string;
  references?: TemplateReference[];
}

/** A commit note (`BREAKING CHANGE`, ...) with its originating commit. */
export interface TemplateNote {
  title: string;
  text: string;
  commit: TemplateCommit;
}

/** Commits sharing a changelog section. */
export interface TemplateCommitGroup {
  title: string;
  commits: TemplateCommit[];
}

/** Notes sharing a title. */
export interface TemplateNoteGroup {
  title: string;
  notes: TemplateNote[];
}

/**
 * The context `conventional-changelog-writer` hands to the template and its
 * partials.
 */
export interface TemplateContext {
  host: string;
  owner: string;
  repository: string;
  version: string;
  previousTag?: string;
  currentTag?: string;
  linkCompare?: boolean;
  linkReferences?: boolean;
  date?: string;
  title?: string;
  commitGroups?: TemplateCommitGroup[];
  noteGroups?: TemplateNoteGroup[];
  headerPartial: HeaderPartial;
  commitPartial: CommitPartial;
}

/** Renders the version heading of a changelog entry. */
export type HeaderPartial = (context: TemplateContext) => string;

/** Renders a single commit of a changelog entry. */
export type CommitPartial = (
  context: TemplateContext,
  commit: TemplateCommit
) => string;

/** Renders a whole changelog entry. */
export type MainTemplate = (context: TemplateContext) => string;

const BREAKING_CHANGE_ICON = '⚠';

/** Builds the repository URL of the release being described. */
export function repositoryUrl(context: TemplateContext): string {
  return `${context.host}/${context.owner}/${context.repository}`;
}

/** Builds the URL comparing the previous release with the current one. */
export function compareUrl(context: TemplateContext): string {
  return `${repositoryUrl(context)}/compare/${context.previousTag}...${
    context.currentTag
  }`;
}

/** Builds the URL of a commit. */
export function commitUrl(
  context: TemplateContext,
  commit: TemplateCommit
): string {
  return `${repositoryUrl(context)}/commit/${commit.hash}`;
}

/** Builds the URL of a referenced issue. */
export function issueUrl(
  context: TemplateContext,
  reference: TemplateReference
): string {
  const owner = reference.owner || context.owner;
  const repository = reference.repository || context.repository;
  return `${context.host}/${owner}/${repository}/issues/${reference.issue}`;
}

/** Builds the URL of a mentioned user. */
export function userUrl(context: TemplateContext, user: string): string {
  return `${context.host}/${user}`;
}

/** Renders a referenced issue, e.g. `googleapis/release-please#1`. */
export function referenceLabel(reference: TemplateReference): string {
  const owner = reference.owner ? `${reference.owner}/` : '';
  return `${owner}${reference.repository || ''}${reference.prefix}${
    reference.issue
  }`;
}

/** Renders a commit's references, linked when the context allows it. */
function renderReferences(
  context: TemplateContext,
  commit: TemplateCommit
): string {
  if (!commit.references?.length) {
    return '';
  }
  const references = commit.references
    .map(reference =>
      context.linkReferences
        ? `[${referenceLabel(reference)}](${issueUrl(context, reference)})`
        : referenceLabel(reference)
    )
    .join(' ');
  // "refs" rather than "closes" keeps GitHub from closing the referenced
  // issues when the release pull request is merged.
  return `, refs ${references}`;
}

/** Renders the version heading, e.g. `## [1.2.3](...) (1983-10-10)`. */
export const headerPartial: HeaderPartial = context => {
  const version = context.linkCompare
    ? `[${context.version}](${compareUrl(context)})`
    : context.version;
  const title = context.title ? ` "${context.title}"` : '';
  const date = context.date ? ` (${context.date})` : '';
  return `## ${version}${title}${date}`;
};

/** Renders a commit, e.g. `* **scope:** subject ([abc1234](...))`. */
export const commitPartial: CommitPartial = (context, commit) => {
  const scope = commit.scope ? `**${commit.scope}:** ` : '';
  const subject = commit.subject || commit.header || '';
  let link = '';
  if (commit.hash) {
    link = context.linkReferences
      ? ` ([${commit.shortHash}](${commitUrl(context, commit)}))`
      : ` ${commit.shortHash}`;
  }
  return `* ${scope}${subject}${link}${renderReferences(context, commit)}`;
};

/** Renders the notes of a changelog entry under the given heading level. */
function renderNoteGroups(
  noteGroups: TemplateNoteGroup[] | undefined,
  headingLevel: string
): string {
  let notes = '';
  for (const group of noteGroups ?? []) {
    notes += `\n${headingLevel} ${BREAKING_CHANGE_ICON} ${group.title}\n\n`;
    for (const note of group.notes) {
      const scope = note.commit.scope ? `**${note.commit.scope}:** ` : '';
      notes += `* ${scope}${note.text}\n`;
    }
  }
  return notes;
}

/** Renders a complete changelog entry. */
export const mainTemplate: MainTemplate = context => {
  let changelog = `${context.headerPartial(context)}\n\n`;
  changelog += renderNoteGroups(context.noteGroups, '###');
  for (const group of context.commitGroups ?? []) {
    changelog += '\n';
    if (group.title) {
      changelog += `### ${group.title}\n\n`;
    }
    for (const commit of group.commits) {
      changelog += `${context.commitPartial(context, commit)}\n`;
    }
    changelog += '\n';
  }
  return changelog;
};

/**
 * The templates used by the `ruby-yoshi` strategy: one heading level deeper,
 * no commit links and a `/` between version and date.
 */
export const rubyYoshi = {
  headerPartial: (context => {
    const version = context.linkCompare
      ? `[${context.version}](${compareUrl(context)})`
      : context.version;
    const title = context.title ? ` "${context.title}"` : '';
    const date = context.date ? ` / ${context.date}` : '';
    return `### ${version}${title}${date}`;
  }) as HeaderPartial,

  commitPartial: ((_context, commit) => {
    const subject = commit.subject || commit.header || '';
    const body = commit.body ? `\n${commit.body}` : '';
    return `* ${subject}${body}`;
  }) as CommitPartial,

  mainTemplate: (context => {
    let changelog = `${context.headerPartial(context)}\n`;
    changelog += renderNoteGroups(context.noteGroups, '####');
    for (const group of context.commitGroups ?? []) {
      changelog += '\n';
      if (group.title) {
        changelog += `#### ${group.title}\n\n`;
      }
      for (const commit of group.commits) {
        changelog += `${context.commitPartial(context, commit)}\n`;
      }
    }
    return changelog;
  }) as MainTemplate,
};
