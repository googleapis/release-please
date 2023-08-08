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
exports.Helm = void 0;
// Generic
const changelog_1 = require("../updaters/changelog");
const yaml = require("js-yaml");
// helm
const chart_yaml_1 = require("../updaters/helm/chart-yaml");
const base_1 = require("./base");
const errors_1 = require("../errors");
class Helm extends base_1.BaseStrategy {
    async buildUpdates(options) {
        const updates = [];
        const version = options.newVersion;
        updates.push({
            path: this.addPath(this.changelogPath),
            createIfMissing: true,
            updater: new changelog_1.Changelog({
                version,
                changelogEntry: options.changelogEntry,
            }),
        });
        updates.push({
            path: this.addPath('Chart.yaml'),
            createIfMissing: false,
            cachedFileContents: this.chartYmlContents,
            updater: new chart_yaml_1.ChartYaml({
                version,
            }),
        });
        return updates;
    }
    async getDefaultPackageName() {
        const chartYmlContents = await this.getChartYmlContents();
        const chart = yaml.load(chartYmlContents.parsedContent, { json: true });
        if (typeof chart === 'object') {
            return chart.name;
        }
        else {
            return undefined;
        }
    }
    async getChartYmlContents() {
        if (!this.chartYmlContents) {
            try {
                this.chartYmlContents = await this.github.getFileContents(this.addPath('Chart.yaml'));
            }
            catch (e) {
                if (e instanceof errors_1.FileNotFoundError) {
                    throw new errors_1.MissingRequiredFileError(this.addPath('Chart.yaml'), Helm.name, `${this.repository.owner}/${this.repository.repo}`);
                }
                throw e;
            }
        }
        return this.chartYmlContents;
    }
}
exports.Helm = Helm;
//# sourceMappingURL=helm.js.map