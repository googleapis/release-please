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

import {ReleasePR, ReleaseCandidate, PackageName} from '../release-pr';
import {GitHubFileContents} from '../github';
import {Update} from '../updaters/update';

// Generic
import {Changelog} from '../updaters/changelog';
import * as yaml from 'js-yaml';
// helm
import {ChartYaml} from '../updaters/helm/chart-yaml';

export class Helm extends ReleasePR {
  private chartYmlContents?: GitHubFileContents;
  private _packageName?: string;

  protected async buildUpdates(
    changelogEntry: string,
    candidate: ReleaseCandidate,
    packageName: PackageName
  ): Promise<Update[]> {
    const updates: Update[] = [];

    updates.push(
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    updates.push(
      new ChartYaml({
        path: this.addPath('Chart.yaml'),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
        contents: await this.getChartYmlContents(),
      })
    );
    return updates;
  }

  async getPackageName(): Promise<PackageName> {
    if (this._packageName === undefined) {
      const chartYmlContents = await this.getChartYmlContents();
      const chart = yaml.load(chartYmlContents.parsedContent, {json: true});
      if (typeof chart === 'object') {
        this.packageName = this._packageName =
          (chart as {name: string}).name ?? this.packageName;
      } else {
        this._packageName = this.packageName;
      }
    }
    return {
      name: this.packageName,
      getComponent: () => this.packageName,
    };
  }

  private async getChartYmlContents(): Promise<GitHubFileContents> {
    if (!this.chartYmlContents) {
      this.chartYmlContents = await this.gh.getFileContents(
        this.addPath('Chart.yaml')
      );
    }
    return this.chartYmlContents;
  }
}
