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
exports.BranchName = void 0;
const version_1 = require("../version");
const logger_1 = require("./logger");
// cannot import from '..' - transpiled code references to RELEASE_PLEASE
// at the script level are undefined, they are only defined inside function
// or instance methods/properties.
// import {RELEASE_PLEASE} from '../constants';
const RELEASE_PLEASE = 'release-please';
function getAllResourceNames() {
    return [
        AutoreleaseBranchName,
        ComponentBranchName,
        GroupBranchName,
        DefaultBranchName,
        V12ComponentBranchName,
        V12DefaultBranchName,
    ];
}
class BranchName {
    static parse(branchName, logger = logger_1.logger) {
        try {
            const branchNameClass = getAllResourceNames().find(clazz => {
                return clazz.matches(branchName);
            });
            if (!branchNameClass) {
                return undefined;
            }
            return new branchNameClass(branchName);
        }
        catch (e) {
            logger.warn(`Error parsing branch name: ${branchName}`, e);
            return undefined;
        }
    }
    static ofComponentVersion(branchPrefix, version) {
        return new AutoreleaseBranchName(`release-${branchPrefix}-v${version}`);
    }
    static ofVersion(version) {
        return new AutoreleaseBranchName(`release-v${version}`);
    }
    static ofTargetBranch(targetBranch) {
        return new DefaultBranchName(`${RELEASE_PLEASE}--branches--${targetBranch}`);
    }
    static ofComponentTargetBranch(component, targetBranch) {
        return new ComponentBranchName(`${RELEASE_PLEASE}--branches--${targetBranch}--components--${component}`);
    }
    static ofGroupTargetBranch(group, targetBranch) {
        return new GroupBranchName(`${RELEASE_PLEASE}--branches--${targetBranch}--groups--${safeBranchName(group)}`);
    }
    constructor(_branchName) { }
    static matches(_branchName) {
        return false;
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
        return '';
    }
}
exports.BranchName = BranchName;
/**
 * This is the legacy branch pattern used by releasetool
 *
 * @see https://github.com/googleapis/releasetool
 */
const AUTORELEASE_PATTERN = /^release-?(?<component>[\w-.]*)?-v(?<version>[0-9].*)$/;
const RELEASE_PLEASE_BRANCH_PREFIX = 'release-please--branches';
class AutoreleaseBranchName extends BranchName {
    static matches(branchName) {
        if (branchName.startsWith(RELEASE_PLEASE_BRANCH_PREFIX)) {
            return false;
        }
        return !!branchName.match(AUTORELEASE_PATTERN);
    }
    constructor(branchName) {
        super(branchName);
        const match = branchName.match(AUTORELEASE_PATTERN);
        if (match === null || match === void 0 ? void 0 : match.groups) {
            this.component = match.groups['component'];
            this.version = version_1.Version.parse(match.groups['version']);
        }
    }
    toString() {
        var _a, _b;
        if (this.component) {
            return `release-${this.component}-v${(_a = this.version) === null || _a === void 0 ? void 0 : _a.toString()}`;
        }
        return `release-v${(_b = this.version) === null || _b === void 0 ? void 0 : _b.toString()}`;
    }
}
/**
 * This is a parsable branch pattern used by release-please v12.
 * It has potential issues due to git treating `/` like directories.
 * This should be removed at some point in the future.
 *
 * @see https://github.com/googleapis/release-please/issues/1024
 */
const V12_DEFAULT_PATTERN = `^${RELEASE_PLEASE}/branches/(?<branch>[^/]+)$`;
class V12DefaultBranchName extends BranchName {
    static matches(branchName) {
        return !!branchName.match(V12_DEFAULT_PATTERN);
    }
    constructor(branchName) {
        super(branchName);
        const match = branchName.match(V12_DEFAULT_PATTERN);
        if (match === null || match === void 0 ? void 0 : match.groups) {
            this.targetBranch = match.groups['branch'];
        }
    }
    toString() {
        return `${RELEASE_PLEASE}/branches/${this.targetBranch}`;
    }
}
/**
 * This is a parsable branch pattern used by release-please v12.
 * It has potential issues due to git treating `/` like directories.
 * This should be removed at some point in the future.
 *
 * @see https://github.com/googleapis/release-please/issues/1024
 */
const V12_COMPONENT_PATTERN = `^${RELEASE_PLEASE}/branches/(?<branch>[^/]+)/components/(?<component>.+)$`;
class V12ComponentBranchName extends BranchName {
    static matches(branchName) {
        return !!branchName.match(V12_COMPONENT_PATTERN);
    }
    constructor(branchName) {
        super(branchName);
        const match = branchName.match(V12_COMPONENT_PATTERN);
        if (match === null || match === void 0 ? void 0 : match.groups) {
            this.targetBranch = match.groups['branch'];
            this.component = match.groups['component'];
        }
    }
    toString() {
        return `${RELEASE_PLEASE}/branches/${this.targetBranch}/components/${this.component}`;
    }
}
const DEFAULT_PATTERN = `^${RELEASE_PLEASE}--branches--(?<branch>.+)$`;
class DefaultBranchName extends BranchName {
    static matches(branchName) {
        return !!branchName.match(DEFAULT_PATTERN);
    }
    constructor(branchName) {
        super(branchName);
        const match = branchName.match(DEFAULT_PATTERN);
        if (match === null || match === void 0 ? void 0 : match.groups) {
            this.targetBranch = match.groups['branch'];
        }
    }
    toString() {
        return `${RELEASE_PLEASE}--branches--${this.targetBranch}`;
    }
}
const COMPONENT_PATTERN = `^${RELEASE_PLEASE}--branches--(?<branch>.+)--components--(?<component>.+)$`;
class ComponentBranchName extends BranchName {
    static matches(branchName) {
        return !!branchName.match(COMPONENT_PATTERN);
    }
    constructor(branchName) {
        super(branchName);
        const match = branchName.match(COMPONENT_PATTERN);
        if (match === null || match === void 0 ? void 0 : match.groups) {
            this.targetBranch = match.groups['branch'];
            this.component = match.groups['component'];
        }
    }
    toString() {
        return `${RELEASE_PLEASE}--branches--${this.targetBranch}--components--${this.component}`;
    }
}
const GROUP_PATTERN = `^${RELEASE_PLEASE}--branches--(?<branch>.+)--groups--(?<group>.+)$`;
class GroupBranchName extends BranchName {
    static matches(branchName) {
        return !!branchName.match(GROUP_PATTERN);
    }
    constructor(branchName) {
        super(branchName);
        const match = branchName.match(GROUP_PATTERN);
        if (match === null || match === void 0 ? void 0 : match.groups) {
            this.targetBranch = match.groups['branch'];
            this.component = match.groups['group'];
        }
    }
    toString() {
        return `${RELEASE_PLEASE}--branches--${this.targetBranch}--groups--${this.component}`;
    }
}
function safeBranchName(branchName) {
    // convert disallowed characters in branch names, replacing them with '-'.
    // replace multiple consecutive '-' with a single '-' to avoid interfering with
    // our regexes for parsing the branch names
    return branchName.replace(/[^\w\d]/g, '-').replace(/-+/g, '-');
}
//# sourceMappingURL=branch-name.js.map