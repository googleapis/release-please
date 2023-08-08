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
exports.Apis = void 0;
const logger_1 = require("../../util/logger");
const json_stringify_1 = require("../../util/json-stringify");
/**
 * Updates the apis.json format. See
 * https://github.com/googleapis/google-cloud-dotnet/blob/main/apis/README.md.
 */
class Apis {
    constructor(component, version) {
        this.component = component;
        this.version = version;
    }
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        const data = JSON.parse(content);
        const api = data.apis.find(api => api.id === this.component);
        if (!api) {
            logger.warn(`Failed to find component: ${this.component} in apis.json`);
            return content;
        }
        api.version = this.version.toString();
        return (0, json_stringify_1.jsonStringify)(data, content);
    }
}
exports.Apis = Apis;
//# sourceMappingURL=apis.js.map