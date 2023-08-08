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
exports.KRMBlueprintVersion = void 0;
const logger_1 = require("../../util/logger");
const default_1 = require("../default");
/**
 * Updates KMR blueprint yaml file.
 */
class KRMBlueprintVersion extends default_1.DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        var _a;
        // js-yaml(and kpt TS SDK) does not preserve comments hence regex match
        // match starting cnrm/ ending with semver to prevent wrong updates like pinned config.kubernetes.io/function
        let matchRegex = '(cnrm/.*/)(v[0-9]+.[0-9]+.[0-9]+)+(-w+)?';
        // if explicit previous version, match only that version
        if ((_a = this.versionsMap) === null || _a === void 0 ? void 0 : _a.has('previousVersion')) {
            matchRegex = `(cnrm/.*/)(v${this.versionsMap.get('previousVersion')})+(-w+)?`;
        }
        const oldVersion = content.match(new RegExp(matchRegex));
        if (oldVersion) {
            logger.info(`updating from ${oldVersion[2]} to v${this.version}`);
        }
        const newVersion = content.replace(new RegExp(matchRegex, 'g'), `$1v${this.version}`);
        return newVersion;
    }
}
exports.KRMBlueprintVersion = KRMBlueprintVersion;
//# sourceMappingURL=krm-blueprint-version.js.map