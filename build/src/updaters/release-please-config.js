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
exports.ReleasePleaseConfig = void 0;
const json_stringify_1 = require("../util/json-stringify");
const SCHEMA_URL = 'https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json';
class ReleasePleaseConfig {
    constructor(path, config) {
        this.path = path;
        this.config = config;
    }
    updateContent(content) {
        var _a;
        let parsed;
        if (content) {
            parsed = JSON.parse(content);
        }
        else {
            parsed = { packages: {} };
        }
        parsed['$schema'] = (_a = parsed['$schema']) !== null && _a !== void 0 ? _a : SCHEMA_URL;
        parsed.packages[this.path] = releaserConfigToJsonConfig(this.config);
        if (content) {
            return (0, json_stringify_1.jsonStringify)(parsed, content);
        }
        else {
            return JSON.stringify(parsed, null, 2);
        }
    }
}
exports.ReleasePleaseConfig = ReleasePleaseConfig;
function releaserConfigToJsonConfig(config) {
    var _a, _b, _c;
    const jsonConfig = {
        'package-name': config.packageName,
        component: config.component,
        'changelog-path': config.changelogPath,
        'release-type': config.releaseType,
        'bump-minor-pre-major': config.bumpMinorPreMajor,
        'bump-patch-for-minor-pre-major': config.bumpPatchForMinorPreMajor,
        'changelog-sections': config.changelogSections,
        'release-as': config.releaseAs,
        'skip-github-release': config.skipGithubRelease,
        draft: config.draft,
        prerelease: config.prerelease,
        'draft-pull-request': config.draftPullRequest,
        label: (_a = config.labels) === null || _a === void 0 ? void 0 : _a.join(','),
        'release-label': (_b = config.releaseLabels) === null || _b === void 0 ? void 0 : _b.join(','),
        'include-component-in-tag': config.includeComponentInTag,
        'include-v-in-tag': config.includeVInTag,
        'changelog-type': config.changelogType,
        'changelog-host': config.changelogHost,
        'pull-request-title-pattern': config.pullRequestTitlePattern,
        'pull-request-header': config.pullRequestHeader,
        'separate-pull-requests': config.separatePullRequests,
        'tag-separator': config.tagSeparator,
        'extra-files': config.extraFiles,
        'version-file': config.versionFile,
        'snapshot-label': (_c = config.snapshotLabels) === null || _c === void 0 ? void 0 : _c.join(','), // Java-only
    };
    return jsonConfig;
}
//# sourceMappingURL=release-please-config.js.map