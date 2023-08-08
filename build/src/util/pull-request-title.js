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
exports.PullRequestTitle = exports.generateMatchPattern = void 0;
const logger_1 = require("./logger");
const version_1 = require("../version");
// cannot import from '..' - transpiled code references to RELEASE_PLEASE
// at the script level are undefined, they are only defined inside function
// or instance methods/properties.
const DEFAULT_PR_TITLE_PATTERN = 'chore${scope}: release${component} ${version}';
function generateMatchPattern(pullRequestTitlePattern, logger = logger_1.logger) {
    if (pullRequestTitlePattern &&
        pullRequestTitlePattern.search(/\$\{scope\}/) === -1)
        logger.warn("pullRequestTitlePattern miss the part of '${scope}'");
    if (pullRequestTitlePattern &&
        pullRequestTitlePattern.search(/\$\{component\}/) === -1)
        logger.warn("pullRequestTitlePattern miss the part of '${component}'");
    if (pullRequestTitlePattern &&
        pullRequestTitlePattern.search(/\$\{version\}/) === -1)
        logger.warn("pullRequestTitlePattern miss the part of '${version}'");
    return new RegExp(`^${(pullRequestTitlePattern || DEFAULT_PR_TITLE_PATTERN)
        .replace('[', '\\[') // TODO: handle all regex escaping
        .replace(']', '\\]')
        .replace('(', '\\(')
        .replace(')', '\\)')
        .replace('${scope}', '(\\((?<branch>[\\w-./]+)\\))?')
        .replace('${component}', ' ?(?<component>@?[\\w-./]*)?')
        .replace('${version}', 'v?(?<version>[0-9].*)')
        .replace('${branch}', '(?<branch>[\\w-./]+)?')}$`);
}
exports.generateMatchPattern = generateMatchPattern;
class PullRequestTitle {
    constructor(opts) {
        this.version = opts.version;
        this.component = opts.component;
        this.targetBranch = opts.targetBranch;
        this.pullRequestTitlePattern =
            opts.pullRequestTitlePattern || DEFAULT_PR_TITLE_PATTERN;
        this.matchPattern = generateMatchPattern(this.pullRequestTitlePattern, opts.logger);
    }
    static parse(title, pullRequestTitlePattern, logger = logger_1.logger) {
        const matchPattern = generateMatchPattern(pullRequestTitlePattern, logger);
        const match = title.match(matchPattern);
        if (match === null || match === void 0 ? void 0 : match.groups) {
            return new PullRequestTitle({
                version: match.groups['version']
                    ? version_1.Version.parse(match.groups['version'])
                    : undefined,
                component: match.groups['component'],
                targetBranch: match.groups['branch'],
                pullRequestTitlePattern,
                logger,
            });
        }
        return undefined;
    }
    static ofComponentVersion(component, version, pullRequestTitlePattern) {
        return new PullRequestTitle({ version, component, pullRequestTitlePattern });
    }
    static ofVersion(version, pullRequestTitlePattern) {
        return new PullRequestTitle({ version, pullRequestTitlePattern });
    }
    static ofTargetBranchVersion(targetBranch, version, pullRequestTitlePattern) {
        return new PullRequestTitle({
            version,
            targetBranch,
            pullRequestTitlePattern,
        });
    }
    static ofComponentTargetBranchVersion(component, targetBranch, version, pullRequestTitlePattern) {
        return new PullRequestTitle({
            version,
            component,
            targetBranch,
            pullRequestTitlePattern,
        });
    }
    static ofTargetBranch(targetBranch, pullRequestTitlePattern) {
        return new PullRequestTitle({
            targetBranch,
            pullRequestTitlePattern,
        });
    }
    getTargetBranch() {
        return this.targetBranch;
    }
    getComponent() {
        return this.component;
    }
    getVersion() {
        return this.version;
    }
    toString() {
        var _a;
        const scope = this.targetBranch ? `(${this.targetBranch})` : '';
        const component = this.component ? ` ${this.component}` : '';
        const version = (_a = this.version) !== null && _a !== void 0 ? _a : '';
        return this.pullRequestTitlePattern
            .replace('${scope}', scope)
            .replace('${component}', component)
            .replace('${version}', version.toString())
            .replace('${branch}', this.targetBranch || '')
            .trim();
    }
}
exports.PullRequestTitle = PullRequestTitle;
//# sourceMappingURL=pull-request-title.js.map