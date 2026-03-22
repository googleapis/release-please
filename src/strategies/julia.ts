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

import {BaseStrategy, BuildUpdatesOptions} from './base';
import {FileNotFoundError} from '../errors';
import {Update} from '../update';
import {Changelog} from '../updaters/changelog';
import {Version} from '../version';
import {
  ProjectToml,
  parseProjectToml,
  JuliaProject,
} from '../updaters/julia/project-toml';

interface ProjectTomlInfo {
  path: string;
  project: JuliaProject;
}

export class Julia extends BaseStrategy {
  private projectTomlInfo?: ProjectTomlInfo | null;

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    if (!this.skipChangelog) {
      updates.push({
        path: this.addPath(this.changelogPath),
        createIfMissing: true,
        updater: new Changelog({
          version,
          changelogEntry: options.changelogEntry,
        }),
      });
    }

    updates.push({
      path: await this.getProjectTomlPath(),
      createIfMissing: false,
      updater: new ProjectToml({version}),
    });

    return updates;
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    const projectTomlInfo = await this.getProjectTomlInfo();
    return projectTomlInfo?.project.name;
  }

  private async getProjectTomlPath(): Promise<string> {
    const projectTomlInfo = await this.getProjectTomlInfo();
    return projectTomlInfo?.path ?? this.addPath('Project.toml');
  }

  private async getProjectTomlInfo(): Promise<ProjectTomlInfo | null> {
    if (this.projectTomlInfo === undefined) {
      this.projectTomlInfo = await this.loadProjectTomlInfo();
    }
    return this.projectTomlInfo;
  }

  private async loadProjectTomlInfo(): Promise<ProjectTomlInfo | null> {
    for (const filename of ['Project.toml', 'JuliaProject.toml']) {
      try {
        const path = this.addPath(filename);
        const content = await this.github.getFileContentsOnBranch(
          path,
          this.targetBranch
        );
        return {
          path,
          project: parseProjectToml(content.parsedContent),
        };
      } catch (e) {
        if (e instanceof FileNotFoundError) {
          continue;
        }
        throw e;
      }
    }
    return null;
  }
}
