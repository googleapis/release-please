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

import {GitHubFileContents} from '../github';

// Generic
import {Changelog} from '../updaters/changelog';
import * as yaml from 'js-yaml';
// helm
import {ChartYaml} from '../updaters/helm/chart-yaml';
import {Strategy, BuildUpdatesOptions} from '../strategy';
import {Update} from '../update';

export class Helm extends Strategy {
  private chartYmlContents?: GitHubFileContents;

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    updates.push({
      path: this.addPath('Chart.yaml'),
      createIfMissing: false,
      cachedFileContents: this.chartYmlContents,
      updater: new ChartYaml({
        version,
      }),
    });
    return updates;
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    const chartYmlContents = await this.getChartYmlContents();
    const chart = yaml.load(chartYmlContents.parsedContent, {json: true});
    if (typeof chart === 'object') {
      return (chart as {name: string}).name;
    } else {
      return undefined;
    }
  }

  private async getChartYmlContents(): Promise<GitHubFileContents> {
    if (!this.chartYmlContents) {
      this.chartYmlContents = await this.github.getFileContents(
        this.addPath('Chart.yaml')
      );
    }
    return this.chartYmlContents;
  }
}
