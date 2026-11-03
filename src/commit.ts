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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const visit = require('unist-util-visit');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const visitWithAncestors = require('unist-util-visit-parents');
const NUMBER_REGEX = /^[0-9]+$/;
import {PullRequest} from './pull-request';
import {logger as defaultLogger, Logger} from './util/logger';

import * as parser from '@conventional-commits/parser';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const conventionalCommitsFilter = require('conventional-commits-filter');

export interface CommitAuthor {
  name: string;
  email?: string;
  username?: string;
}

export interface Commit {
  sha: string;
  message: string;
  files?: string[];
  pullRequest?: PullRequest;
  author?: CommitAuthor;
}

export interface ConventionalCommit extends Commit {
  type: string;
  scope: string | null;
  notes: parser.Note[];
  references: parser.Reference[];
  bareMessage: string;
  breaking: boolean;
}

type SummaryNodes =
  | parser.Type
  | parser.Scope
  | parser.BreakingChange
  | parser.Text;
type FooterNodes =
  | parser.Type
  | parser.Scope
  | parser.BreakingChange
  | parser.Separator
  | parser.Text
  | parser.Newline;

function getBlankConventionalCommit(): parser.ConventionalChangelogCommit {
  return {
    body: '',
    subject: '',
    type: '',
    scope: null,
    notes: [],
    references: [],
    mentions: [],
    merge: null,
    revert: null,
    header: '',
    footer: null,
  };
}

/**
 * Converts conventional commit AST into conventional-changelog's
 * output format, see: https://www.npmjs.com/package/conventional-commits-parser
 *
 * @param ast {parser.Message} The conventional commit AST to convert
 * @param conventionalTypes {Set<string>} The types of conventional commits to consider ("feat", "fix", "chore", ...)
 * @returns {parser.ConventionalChangelogCommit[]} Array of conventional commits in conventional-changelog format
 */
function toConventionalChangelogFormat(
  ast: parser.Message,
  conventionalTypes: Set<string>
): parser.ConventionalChangelogCommit[] {
  const commits: parser.ConventionalChangelogCommit[] = [];
  const headerCommit = getBlankConventionalCommit();
  // Separate the body and summary nodes, this simplifies the subsequent
  // tree walking logic:
  let body;
  let summary;
  visit(ast, ['body', 'summary'], (node: parser.Node) => {
    switch (node.type) {
      case 'body':
        body = node;
        break;
      case 'summary':
        summary = node;
        break;
    }
  });

  // <type>, "(", <scope>, ")", ["!"], ":", <whitespace>*, <text>
  visit(summary, (node: SummaryNodes) => {
    switch (node.type) {
      case 'type':
        headerCommit.type = node.value;
        headerCommit.header += node.value;
        break;
      case 'scope':
        headerCommit.scope = node.value;
        headerCommit.header += `(${node.value})`;
        break;
      case 'breaking-change':
        headerCommit.header += '!';
        break;
      case 'text':
        headerCommit.subject = node.value;
        headerCommit.header += `: ${node.value}`;
        break;
      default:
        break;
    }
  });

  // [<any body-text except pre-footer>]
  if (body) {
    visit(body, ['text', 'newline'], (node: parser.Text) => {
      headerCommit.body += node.value;
    });
  }

  // Extract BREAKING CHANGE notes, regardless of whether they fall in
  // summary, body, or footer:
  const breaking: parser.Note = {
    title: 'BREAKING CHANGE',
    text: '', // "text" will be populated if a BREAKING CHANGE token is parsed.
  };
  visitWithAncestors(
    ast,
    ['breaking-change'],
    (node: parser.BreakingChange, ancestors: parser.Node[]) => {
      let hitBreakingMarker = false;
      let parent = ancestors.pop();
      if (!parent) {
        return;
      }
      switch (parent.type) {
        case 'summary':
          breaking.text = headerCommit.subject;
          break;
        case 'body':
          breaking.text = '';
          // We treat text from the BREAKING CHANGE marker forward as
          // the breaking change notes:
          visit(
            parent,
            ['breaking-change', 'text', 'newline'],
            (node: SummaryNodes) => {
              if (node.type === 'breaking-change') {
                hitBreakingMarker = true;
                return;
              }
              if (!hitBreakingMarker) return;
              breaking.text += node.value;
            }
          );
          break;
        case 'token':
          // If the '!' breaking change marker is used, the breaking change
          // will be identified when the footer is parsed as a commit:
          if (!node.value.includes('BREAKING')) return;
          parent = ancestors.pop();
          visit(parent, ['text', 'newline'], (node: parser.Text) => {
            breaking.text = node.value;
          });
          break;
      }
    }
  );

  // Add additional breaking change detection from commit body
  if (body) {
    const bodyString = String(body);
    const breakingChangeMatch = bodyString.match(/BREAKING-CHANGE:\s*(.*)/);
    if (breakingChangeMatch && breakingChangeMatch[1]) {
      if (breaking.text) {
        breaking.text += '\n';
      }
      breaking.text += breakingChangeMatch[1].trim();
    }
  }

  if (breaking.text !== '') headerCommit.notes.push(breaking);

  // Populates references array from footers:
  // references: [{
  //    action: 'Closes',
  //    owner: null,
  //    repository: null,
  //    issue: '1', raw: '#1',
  //    prefix: '#'
  // }]
  visit(ast, ['footer'], (node: parser.Footer) => {
    const reference: parser.Reference = {
      prefix: '#',
      action: '',
      issue: '',
    };
    let hasRefSepartor = false;
    visit(
      node,
      ['type', 'separator', 'text'],
      (node: parser.Type | parser.Separator | parser.Text) => {
        switch (node.type) {
          case 'type':
            // refs, closes, etc:
            // TODO(@bcoe): conventional-changelog does not currently use
            // "reference.action" in its templates:
            reference.action = node.value;
            break;
          case 'separator':
            // Footer of the form "Refs #99":
            if (node.value.includes('#')) hasRefSepartor = true;
            break;
          case 'text':
            // Footer of the form "Refs: #99"
            if (node.value.charAt(0) === '#') {
              hasRefSepartor = true;
              reference.issue = node.value.substring(1);
              // TODO(@bcoe): what about references like "Refs: #99, #102"?
            } else {
              reference.issue = node.value;
            }
            break;
        }
      }
    );
    // TODO(@bcoe): how should references like "Refs: v8:8940" work.
    if (hasRefSepartor && reference.issue.match(NUMBER_REGEX)) {
      headerCommit.references.push(reference);
    }
  });

  /*
   * Split footers that resemble commits into additional commits, e.g.,
   * chore: multiple commits
   * chore(recaptchaenterprise): migrate recaptchaenterprise to the Java microgenerator
   *   Committer: @miraleung
   *   PiperOrigin-RevId: 345559154
   * ...
   */
  visitWithAncestors(
    ast,
    ['type'],
    (node: parser.Type, ancestors: parser.Node[]) => {
      let parent = ancestors.pop();
      if (!parent) {
        return;
      }
      if (parent.type === 'token') {
        parent = ancestors.pop();
        let footerText = '';
        const semanticFooter = node.value.toLowerCase() === 'release-as';
        visit(
          parent,
          ['type', 'scope', 'breaking-change', 'separator', 'text', 'newline'],
          (node: FooterNodes) => {
            switch (node.type) {
              case 'scope':
                footerText += `(${node.value})`;
                break;
              case 'separator':
                // Footers of the form Fixes #99, should not be parsed.
                if (node.value.includes('#')) return;
                footerText += `${node.value} `;
                break;
              default:
                footerText += node.value;
                break;
            }
          }
        );
        // Any footers that carry semantic meaning, e.g., Release-As, should
        // be added to the footer field, for the benefits of post-processing:
        if (semanticFooter) {
          let releaseAs = '';
          visit(parent, ['text'], (node: parser.Text) => {
            releaseAs = node.value;
          });
          // record Release-As footer as a note
          headerCommit.notes.push({
            title: 'RELEASE AS',
            text: releaseAs,
          });
          if (!headerCommit.footer) headerCommit.footer = '';
          headerCommit.footer += `\n${footerText.toLowerCase()}`.trimStart();
        }
        try {
          for (const commit of toConventionalChangelogFormat(
            parser.parser(footerText),
            conventionalTypes
          )) {
            commits.push(commit);
          }
        } catch (err) {
          // Footer does not appear to be an additional commit.
        }
      }
    }
  );

  // Keep only the conventional commit if its type matches one looked for
  if (conventionalTypes.has(headerCommit.type)) {
    commits.push(headerCommit);
  }

  return commits;
}

// TODO(@bcoe): now that we walk the actual AST of conventional commits
// we should be able to move post processing into
// to-conventional-changelog.ts.
function postProcessCommits(commit: parser.ConventionalChangelogCommit) {
  commit.notes.forEach(note => {
    let text = '';
    let i = 0;
    let extendedContext = false;
    for (const chunk of note.text.split(/\r?\n/)) {
      if (i > 0 && hasExtendedContext(chunk) && !extendedContext) {
        text = `${text.trim()}\n`;
        extendedContext = true;
      }
      if (chunk === '') break;
      else if (extendedContext) {
        text += `    ${chunk}\n`;
      } else {
        text += `${chunk} `;
      }
      i++;
    }
    note.text = text.trim();
  });

  const breakingChangeMatch = commit.body?.match(/BREAKING-CHANGE:\s*(.*)/);
  if (breakingChangeMatch && breakingChangeMatch[1]) {
    const existingNote = commit.notes.find(
      note => note.title === 'BREAKING CHANGE'
    );
    if (existingNote) {
      existingNote.text += `\n${breakingChangeMatch[1].trim()}`;
    } else {
      commit.notes.push({
        title: 'BREAKING CHANGE',
        text: breakingChangeMatch[1].trim(),
      });
    }
  }

  return commit;
}

// If someone wishes to include additional contextual information for a
// BREAKING CHANGE using markdown, they can do so by starting the line after the initial
// breaking change description with either:
//
// 1. a fourth-level header.
// 2. a bulleted list (using either '*' or '-').
//
// BREAKING CHANGE: there were breaking changes
// #### Deleted Endpoints
// - endpoint 1
// - endpoint 2
function hasExtendedContext(line: string) {
  if (line.match(/^#### |^[*-] /)) return true;
  return false;
}

function parseCommits(
  message: string,
  conventionalTypes: Set<string>
): parser.ConventionalChangelogCommit[] {
  let ast: parser.Message;
  try {
    ast = parser.parser(message);
  } catch (err) {
    const sanitizedMessage = sanitizeScopes(message, conventionalTypes);
    if (sanitizedMessage === message) {
      throw err;
    }
    ast = parser.parser(sanitizedMessage);
  }
  return conventionalCommitsFilter(
    toConventionalChangelogFormat(ast, conventionalTypes)
  )
    .map(unescapeScope)
    .map(postProcessCommits);
}

const UNTERMINATED_SCOPE_LINE_REGEX = /^[^\s:!()]+\([^()\r\n]*(?:\(|\r?$)/;
const OPEN_PARENTHESES_REPLACER = '\0[\0';
const CLOSE_PARENTHESES_REPLACER = '\0]\0';

/**
 * `@conventional-commits/parser` attempts to parse the start of every body line
 * as a Conventional Commit footer (`<type>(<scope>): <value>`). If a body line
 * starts at column 0 with `token(` and encounters another `(` or end-of-line
 * before a closing `)` (such as nested parentheses `Foo.Bar(baz(abc))` or a
 * function call wrapped across lines), the parser's `scope()` rule throws an
 * uncaught `Error: unexpected token ... valid tokens [)]`.
 *
 * The following two cases are dealt with by this method, in order to prevent
 * `@conventional-commits/parser` to throw when parsing out the commit:
 * - Within any line which is a conventional commit header, the method escapes
 *   the '(' and ')' characters eventually contained within the conventional commit
 *   scope, as in `feat(a(b))`.
 * - Within any line starting with an expression containing nested parenthesis, as
 *   in `Foo.Bar(baz(abc))`, the method prefixes a single space to the line, preventing
 *   `scope()` from throwing.
 */
function sanitizeScopes(
  message: string,
  conventionalTypes: Set<string>
): string {
  const lines = message.split(/\r?\n/);

  // Constructing the regular expression to match/extract a conventional commit scope, if present.
  // The RegExp is composed of the following parts:
  //    '(?<=^(?:feat|fix|...)\()' => Start of the string, followed by the conventional commit type,
  //                                  followed by an opening parenthesis.
  //    '(?:.*)'                   => Conventional commit scope (any characters)
  //    '(?=\)!?: .*$)'            => Closing parenthesis, followed by optional '!' character, followed
  //                                  by ': ' sequence, followed by the conventional commit description,
  //                                  till the end of the string.
  const scopeRegExp = new RegExp(
    `(?<=^(?:${createLogicalOr([
      ...conventionalTypes,
    ])})\\()(?:.*)(?=\\)!?: .*$)`
  );

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 0) {
      let sanitized = false;

      // If the line is a conventional commit header containing a scope, we escape
      // the scope (aka replacing open and close parentheses with OPEN_PARENTHESES_REPLACER
      // and CLOSE_PARENTHESES_REPLACER), so that the underlying @conventional-commits/parser
      // will not fail when parsing out the commit.
      lines[i] = lines[i].replace(scopeRegExp, scope => {
        sanitized = true;
        return scope
          .replace('(', OPEN_PARENTHESES_REPLACER)
          .replace(')', CLOSE_PARENTHESES_REPLACER);
      });

      if (i > 0 && !sanitized) {
        // The line is not a conventional commit header containing a scope, but still can
        // be something starting with `Foo.Bar(baz(abc)) ...`, which would make the
        // underlying @conventional-commits/parser fail. If so, we sanitize the line by
        // prefixing it with a single space character so that the parser does not fail.
        if (UNTERMINATED_SCOPE_LINE_REGEX.test(lines[i])) {
          lines[i] = ` ${lines[i]}`;
        }
      }
    }
  }
  return lines.join('\n');
}

/**
 * Un-escapes the scope (if any) of a parsed conventional commit (aka putting the
 * nested open/close parentheses back in the scope, if any had been escaped/sanitized
 * ahead of the parsing). See sanitizeScopes() function above, for context.
 *
 * @param commit The parsed conventional commit.
 * @returns The parsed conventional commit, with its scope unescaped/unsanitized.
 */
function unescapeScope(
  commit: parser.ConventionalChangelogCommit
): parser.ConventionalChangelogCommit {
  if (commit.scope) {
    commit.scope = commit.scope
      .replace(OPEN_PARENTHESES_REPLACER, '(')
      .replace(CLOSE_PARENTHESES_REPLACER, ')');
  }

  return commit;
}

/**
 * Splits a commit message into multiple messages based on conventional commit format and nested commit blocks.
 * This function is capable of:
 * 1. Separating conventional commits (feat, fix, docs, etc.) within the main message.
 * 2. Extracting nested commits enclosed in BEGIN_NESTED_COMMIT/END_NESTED_COMMIT blocks.
 * 3. Preserving the original message structure outside of nested commit blocks.
 * 4. Handling multiple nested commits and conventional commits in a single message.
 *
 * @param message The input commit message string
 * @param conventionalTypes {Set<string>} Types of conventional commits to consider ("feat", "fix", "chore", ...).
 * @returns An array of individual conventional commit messages
 */
function splitMessages(
  message: string,
  conventionalTypes: Set<string>
): string[] {
  const commits: string[] = [message.trim()];

  // -----
  // First step: extracting nested commits enclosed in `BEGIN_NESTED_COMMIT/END_NESTED_COMMIT` blocks
  // - Each block is considered as if it is a git commit message on its own.
  // - The input/initial commit message stays a commit itself, with its `BEGIN_NESTED_COMMIT/END_NESTED_COMMIT`
  //   blocks removed.
  // -----

  // We use String.replace(...), which enables to both extract `BEGIN_NESTED_COMMIT/END_NESTED_COMMIT`
  // blocks, and remove them from the input commit message.
  commits[0] = commits[0].replace(
    /(?:^|\n)BEGIN_NESTED_COMMIT\s*?\n([\s\S]+?)\nEND_NESTED_COMMIT\s*?(?=$|\n)/g,
    (fullMatch: string, nestedCommit: string) => {
      // Extracting the nested commit
      commits.push(nestedCommit.trim());

      // Removing the nested commit from the initial message
      return '';
    }
  );

  // At this point, the `commits` array contains all the git commit messages to be considered.

  // -----
  // Second step: from each commit message, extracting zero or many conventional commits:
  // Each line matching a conventional commit header as `<type>(<optional scope>)[!]: <description>`,
  // found either at the start of the commit message or after an empty line, is the start of a
  // conventional commit.
  // -----

  // Constructing the regular expression to match the start of any conventional commit.
  // The constructed RegExp is composed of the following parts:
  //    '(?<=^|\r?\n\r?\n)'    => Start of string, or mandatory empty line
  //    '(?:feat|fix|...|...)' => Types of conventional commits to consider (logical OR expression)
  //    '(?:\(.*\))?'          => Optional scope of the conventional commit (any characters)
  //    '!?'                   => Optional '!' character
  //    ': '                   => ': ' sequence which must precede the description
  //    '.*'                   => Description of the conventional commit
  //    '(?=$|\r?\n)'          => End of string, or end of line
  const regExp = new RegExp(
    `(?<=^|\\r?\\n\\r?\\n)(?:${createLogicalOr([
      ...conventionalTypes,
    ])})(?:\\(.*\\))?!?: .*(?=$|\\r?\\n)`,
    'g'
  );

  const conventionalCommits: string[] = [];

  commits.forEach(commit => {
    // Matching each conventional commit header
    const matches = [...commit.matchAll(regExp)];

    // For each match, extracting the conventional commit
    matches.forEach((match, index) => {
      conventionalCommits.push(
        commit
          .slice(
            match.index,
            index === matches.length - 1 ? undefined : matches[index + 1].index
          )
          .trim()
      );
    });
  });

  return conventionalCommits;
}

/**
 * Given a list of raw commits, parse and expand into conventional commits.
 *
 * @param commits {Commit[]} The input commits
 * @param conventionalTypes {Set<string>} Types of conventional commits to consider ("feat", "fix", "chore", ...). Only conventional commits of those types will be extracted.
 * @returns {ConventionalCommit[]} Parsed and expanded commits. There may be
 *   more commits returned as a single raw commit may contain multiple release
 *   messages.
 */
export function parseConventionalCommits(
  commits: Commit[],
  conventionalTypes: Set<string>,
  logger: Logger = defaultLogger
): ConventionalCommit[] {
  const conventionalCommits: ConventionalCommit[] = [];

  for (const commit of commits) {
    for (const commitMessage of splitMessages(
      preprocessCommitMessage(commit),
      conventionalTypes
    )) {
      try {
        for (const parsedCommit of parseCommits(
          commitMessage,
          conventionalTypes
        )) {
          const breaking =
            parsedCommit.notes.filter(note => note.title === 'BREAKING CHANGE')
              .length > 0;
          conventionalCommits.push({
            sha: commit.sha,
            message: parsedCommit.header,
            files: commit.files,
            pullRequest: commit.pullRequest,
            type: parsedCommit.type,
            scope: parsedCommit.scope,
            bareMessage: parsedCommit.subject,
            notes: parsedCommit.notes,
            references: parsedCommit.references,
            breaking,
            author: commit.author,
          });
        }
      } catch (_err) {
        logger.debug(
          `commit could not be parsed: ${commit.sha} ${
            commit.message.split('\n')[0]
          }`
        );
        logger.debug(`error message: ${_err}`);
      }
    }
  }

  return conventionalCommits;
}

function preprocessCommitMessage(commit: Commit): string {
  // look for 'BEGIN_COMMIT_OVERRIDE' section of pull request body
  if (commit.pullRequest) {
    const overrideMessage = (
      commit.pullRequest.body.split('BEGIN_COMMIT_OVERRIDE')[1] || ''
    )
      .split('END_COMMIT_OVERRIDE')[0]
      .trim();
    if (overrideMessage) {
      return overrideMessage;
    }
  }
  return commit.message;
}

/**
 * Given an array of strings, creates a logical OR expression matching those strings, that can be
 * used as part of a regular expression. Special RegExp characters within each string are escaped,
 * if present.
 *
 * Examples:
 * Given an array containing ['feat','fix'], the method returns 'feat|fix'
 *
 * @param parts Array of strings.
 * @returns Logical OR expression that can be used within a RegExp.
 */
export function createLogicalOr(parts: string[]): string {
  return parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
}
