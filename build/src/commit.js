"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseConventionalCommits = void 0;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const visit = require('unist-util-visit');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const visitWithAncestors = require('unist-util-visit-parents');
const NUMBER_REGEX = /^[0-9]+$/;
const logger_1 = require("./util/logger");
const parser = require("@conventional-commits/parser");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const conventionalCommitsFilter = require('conventional-commits-filter');
function getBlankConventionalCommit() {
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
function toConventionalChangelogFormat(ast) {
    const commits = [];
    const headerCommit = getBlankConventionalCommit();
    // Separate the body and summary nodes, this simplifies the subsequent
    // tree walking logic:
    let body;
    let summary;
    visit(ast, ['body', 'summary'], (node) => {
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
    visit(summary, (node) => {
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
        visit(body, ['text', 'newline'], (node) => {
            headerCommit.body += node.value;
        });
    }
    // Extract BREAKING CHANGE notes, regardless of whether they fall in
    // summary, body, or footer:
    const breaking = {
        title: 'BREAKING CHANGE',
        text: '', // "text" will be populated if a BREAKING CHANGE token is parsed.
    };
    visitWithAncestors(ast, ['breaking-change'], (node, ancestors) => {
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
                visit(parent, ['breaking-change', 'text', 'newline'], (node) => {
                    if (node.type === 'breaking-change') {
                        hitBreakingMarker = true;
                        return;
                    }
                    if (!hitBreakingMarker)
                        return;
                    breaking.text += node.value;
                });
                break;
            case 'token':
                // If the '!' breaking change marker is used, the breaking change
                // will be identified when the footer is parsed as a commit:
                if (!node.value.includes('BREAKING'))
                    return;
                parent = ancestors.pop();
                visit(parent, ['text', 'newline'], (node) => {
                    breaking.text = node.value;
                });
                break;
        }
    });
    if (breaking.text !== '')
        headerCommit.notes.push(breaking);
    // Populates references array from footers:
    // references: [{
    //    action: 'Closes',
    //    owner: null,
    //    repository: null,
    //    issue: '1', raw: '#1',
    //    prefix: '#'
    // }]
    visit(ast, ['footer'], (node) => {
        const reference = {
            prefix: '#',
            action: '',
            issue: '',
        };
        let hasRefSepartor = false;
        visit(node, ['type', 'separator', 'text'], (node) => {
            switch (node.type) {
                case 'type':
                    // refs, closes, etc:
                    // TODO(@bcoe): conventional-changelog does not currently use
                    // "reference.action" in its templates:
                    reference.action = node.value;
                    break;
                case 'separator':
                    // Footer of the form "Refs #99":
                    if (node.value.includes('#'))
                        hasRefSepartor = true;
                    break;
                case 'text':
                    // Footer of the form "Refs: #99"
                    if (node.value.charAt(0) === '#') {
                        hasRefSepartor = true;
                        reference.issue = node.value.substring(1);
                        // TODO(@bcoe): what about references like "Refs: #99, #102"?
                    }
                    else {
                        reference.issue = node.value;
                    }
                    break;
            }
        });
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
    visitWithAncestors(ast, ['type'], (node, ancestors) => {
        let parent = ancestors.pop();
        if (!parent) {
            return;
        }
        if (parent.type === 'token') {
            parent = ancestors.pop();
            let footerText = '';
            const semanticFooter = node.value.toLowerCase() === 'release-as';
            visit(parent, ['type', 'scope', 'breaking-change', 'separator', 'text', 'newline'], (node) => {
                switch (node.type) {
                    case 'scope':
                        footerText += `(${node.value})`;
                        break;
                    case 'separator':
                        // Footers of the form Fixes #99, should not be parsed.
                        if (node.value.includes('#'))
                            return;
                        footerText += `${node.value} `;
                        break;
                    default:
                        footerText += node.value;
                        break;
                }
            });
            // Any footers that carry semantic meaning, e.g., Release-As, should
            // be added to the footer field, for the benefits of post-processing:
            if (semanticFooter) {
                let releaseAs = '';
                visit(parent, ['text'], (node) => {
                    releaseAs = node.value;
                });
                // record Release-As footer as a note
                headerCommit.notes.push({
                    title: 'RELEASE AS',
                    text: releaseAs,
                });
                if (!headerCommit.footer)
                    headerCommit.footer = '';
                headerCommit.footer += `\n${footerText.toLowerCase()}`.trimStart();
            }
            try {
                for (const commit of toConventionalChangelogFormat(parser.parser(footerText))) {
                    commits.push(commit);
                }
            }
            catch (err) {
                // Footer does not appear to be an additional commit.
            }
        }
    });
    commits.push(headerCommit);
    return commits;
}
// TODO(@bcoe): now that we walk the actual AST of conventional commits
// we should be able to move post processing into
// to-conventional-changelog.ts.
function postProcessCommits(commit) {
    commit.notes.forEach(note => {
        let text = '';
        let i = 0;
        let extendedContext = false;
        for (const chunk of note.text.split(/\r?\n/)) {
            if (i > 0 && hasExtendedContext(chunk) && !extendedContext) {
                text = `${text.trim()}\n`;
                extendedContext = true;
            }
            if (chunk === '')
                break;
            else if (extendedContext) {
                text += `    ${chunk}\n`;
            }
            else {
                text += `${chunk} `;
            }
            i++;
        }
        note.text = text.trim();
    });
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
function hasExtendedContext(line) {
    if (line.match(/^#### |^[*-] /))
        return true;
    return false;
}
function parseCommits(message) {
    return conventionalCommitsFilter(toConventionalChangelogFormat(parser.parser(message))).map(postProcessCommits);
}
// If someone wishes to aggregate multiple, complex commit messages into a
// single commit, they can include one or more `BEGIN_NESTED_COMMIT`/`END_NESTED_COMMIT`
// blocks into the body of the commit
function splitMessages(message) {
    const parts = message.split('BEGIN_NESTED_COMMIT');
    const messages = [parts.shift()];
    for (const part of parts) {
        const [newMessage, ...rest] = part.split('END_NESTED_COMMIT');
        messages.push(newMessage);
        // anthing outside of the BEGIN/END annotations are added to the original
        // commit
        messages[0] = messages[0] + rest.join();
    }
    return messages;
}
/**
 * Given a list of raw commits, parse and expand into conventional commits.
 *
 * @param commits {Commit[]} The input commits
 *
 * @returns {ConventionalCommit[]} Parsed and expanded commits. There may be
 *   more commits returned as a single raw commit may contain multiple release
 *   messages.
 */
function parseConventionalCommits(commits, logger = logger_1.logger) {
    const conventionalCommits = [];
    for (const commit of commits) {
        for (const commitMessage of splitMessages(preprocessCommitMessage(commit))) {
            try {
                for (const parsedCommit of parseCommits(commitMessage)) {
                    const breaking = parsedCommit.notes.filter(note => note.title === 'BREAKING CHANGE')
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
                    });
                }
            }
            catch (_err) {
                logger.debug(`commit could not be parsed: ${commit.sha} ${commit.message.split('\n')[0]}`);
            }
        }
    }
    return conventionalCommits;
}
exports.parseConventionalCommits = parseConventionalCommits;
function preprocessCommitMessage(commit) {
    // look for 'BEGIN_COMMIT_OVERRIDE' section of pull request body
    if (commit.pullRequest) {
        const overrideMessage = (commit.pullRequest.body.split('BEGIN_COMMIT_OVERRIDE')[1] || '')
            .split('END_COMMIT_OVERRIDE')[0]
            .trim();
        if (overrideMessage) {
            return overrideMessage;
        }
    }
    return commit.message;
}
//# sourceMappingURL=commit.js.map