"use strict";
// Copyright 2022 Google LLC
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
exports.GenericJson = void 0;
const jp = require("jsonpath");
const json_stringify_1 = require("../util/json-stringify");
const logger_1 = require("../util/logger");
class GenericJson {
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
        const data = JSON.parse(content);
        const nodes = jp.apply(data, this.jsonpath, _val => {
            return this.version.toString();
        });
        if (!nodes) {
            logger.warn(`No entries modified in ${this.jsonpath}`);
            return content;
        }
        return (0, json_stringify_1.jsonStringify)(data, content);
    }
}
exports.GenericJson = GenericJson;
//# sourceMappingURL=generic-json.js.map