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
exports.PullRequestBody = void 0;
const logger_1 = require("./logger");
const node_html_parser_1 = require("node-html-parser");
const version_1 = require("../version");
const DEFAULT_HEADER = ':robot: I have created a release *beep* *boop*';
const DEFAULT_FOOTER = 'This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).';
const NOTES_DELIMITER = '---';
class PullRequestBody {
    constructor(releaseData, options) {
        var _a;
        this.header = (options === null || options === void 0 ? void 0 : options.header) || DEFAULT_HEADER;
        this.footer = (options === null || options === void 0 ? void 0 : options.footer) || DEFAULT_FOOTER;
        this.extra = options === null || options === void 0 ? void 0 : options.extra;
        this.releaseData = releaseData;
        this.useComponents = (_a = options === null || options === void 0 ? void 0 : options.useComponents) !== null && _a !== void 0 ? _a : this.releaseData.length > 1;
    }
    static parse(body, logger = logger_1.logger) {
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
    notes() {
        if (this.useComponents) {
            return this.releaseData
                .map(release => {
                var _a;
                return `<details><summary>${release.component ? `${release.component}: ` : ''}${(_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()}</summary>\n\n${release.notes}\n</details>`;
            })
                .join('\n\n');
        }
        return this.releaseData.map(release => release.notes).join('\n\n');
    }
    toString() {
        const notes = this.notes();
        return `${this.header}
${NOTES_DELIMITER}


${notes}

${NOTES_DELIMITER}${this.extra ? `\n\n${this.extra}\n` : ''}
${this.footer}`;
    }
}
exports.PullRequestBody = PullRequestBody;
function splitBody(body) {
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
function extractMultipleReleases(notes, logger) {
    const data = [];
    const root = (0, node_html_parser_1.parse)(notes);
    for (const detail of root.getElementsByTagName('details')) {
        const summaryNode = detail.getElementsByTagName('summary')[0];
        const summary = summaryNode === null || summaryNode === void 0 ? void 0 : summaryNode.textContent;
        const match = summary.match(SUMMARY_PATTERN);
        if (match === null || match === void 0 ? void 0 : match.groups) {
            detail.removeChild(summaryNode);
            const notes = detail.textContent.trim();
            data.push({
                component: match.groups.component,
                version: version_1.Version.parse(match.groups.version),
                notes,
            });
        }
        else {
            const componentlessMatch = summary.match(COMPONENTLESS_SUMMARY_PATTERN);
            if (!(componentlessMatch === null || componentlessMatch === void 0 ? void 0 : componentlessMatch.groups)) {
                logger.warn(`Summary: ${summary} did not match the expected pattern`);
                continue;
            }
            detail.removeChild(summaryNode);
            const notes = detail.textContent.trim();
            data.push({
                version: version_1.Version.parse(componentlessMatch.groups.version),
                notes,
            });
        }
    }
    return data;
}
const COMPARE_REGEX = /^#{2,} \[?(?<version>\d+\.\d+\.\d+.*)\]?/;
function extractSingleRelease(body, logger) {
    var _a;
    body = body.trim();
    const match = body.match(COMPARE_REGEX);
    const versionString = (_a = match === null || match === void 0 ? void 0 : match.groups) === null || _a === void 0 ? void 0 : _a.version;
    if (!versionString) {
        logger.warn('Failed to find version in release notes');
        return [];
    }
    return [
        {
            version: version_1.Version.parse(versionString),
            notes: body,
        },
    ];
}
//# sourceMappingURL=pull-request-body.js.map