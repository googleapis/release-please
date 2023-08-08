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
exports.ChartYaml = void 0;
const yaml = require("yaml");
const logger_1 = require("../../util/logger");
const default_1 = require("../default");
/**
 * Updates a Helm chart.yaml file.
 */
class ChartYaml extends default_1.DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        const chart = yaml.parseDocument(content);
        if (chart === null || chart === undefined) {
            return '';
        }
        const oldVersion = chart.get('version');
        logger.info(`updating from ${oldVersion} to ${this.version}`);
        chart.set('version', this.version.toString());
        return chart.toString();
    }
}
exports.ChartYaml = ChartYaml;
//# sourceMappingURL=chart-yaml.js.map