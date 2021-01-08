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
import * as parser from '@conventional-commits/parser';

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

// Converts conventional commit AST into conventional-changelog's
// output format, see: https://www.npmjs.com/package/conventional-commits-parser
export default function toConventionalChangelogFormat(
  ast: parser.Message
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
            ['text', 'newline'],
            (node: parser.Text | parser.BreakingChange) => {
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
        try {
          for (const commit of toConventionalChangelogFormat(
            parser.parser(footerText)
          )) {
            commits.push(commit);
          }
        } catch (err) {
          // Footer does not appear to be an additional commit.
        }
      }
    }
  );
  commits.push(headerCommit);
  return commits;
}
