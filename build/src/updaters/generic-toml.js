"use strict";
// Copyright 2023 Google LLC
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
exports.GenericToml = void 0;
const jp = require("jsonpath");
const toml_edit_1 = require("../util/toml-edit");
const logger_1 = require("../util/logger");
/**
 * Updates TOML document according to given JSONPath.
 *
 * Note that used parser does reformat the document and removes all comments,
 * and converts everything to pure TOML.
 * If you want to retain formatting, use generic updater with comment hints.
 */
class GenericToml {
    constructor(jsonpath, version) {
        this.jsonpath = jsonpath;
        this.version = version;
    }
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        let data;
        try {
            data = (0, toml_edit_1.parseWith)(content);
        }
        catch (e) {
            logger.warn('Invalid toml, cannot be parsed', e);
            return content;
        }
        const paths = jp.paths(data, this.jsonpath);
        if (!paths || paths.length === 0) {
            logger.warn(`No entries modified in ${this.jsonpath}`);
            return content;
        }
        let processed = content;
        paths.forEach(path => {
            if (path[0] === '$')
                path = path.slice(1);
            processed = (0, toml_edit_1.replaceTomlValue)(processed, path, this.version.toString());
        });
        return processed;
    }
}
exports.GenericToml = GenericToml;
//# sourceMappingURL=generic-toml.js.map