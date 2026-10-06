// Copyright 2025 Google LLC
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

import {BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions} from './base';
import {Update} from '../update';
import {Changelog} from '../updaters/changelog';
import {ChangelogJson} from '../updaters/changelog-json';
import {Version} from '../version';
import {
  JuliaProject,
  parseJuliaProject,
  JuliaProjectToml,
} from '../updaters/julia/project-toml';
import {filterCommits} from '../util/filter-commits';

const CHANGELOG_SECTIONS = [
  {type: 'feat', section: 'Features'},
  {type: 'fix', section: 'Bug Fixes'},
  {type: 'perf', section: 'Performance Improvements'},
  {type: 'deps', section: 'Dependencies'},
  {type: 'revert', section: 'Reverts'},
  {type: 'docs', section: 'Documentation'},
  {type: 'style', section: 'Styles', hidden: true},
  {type: 'chore', section: 'Miscellaneous Chores', hidden: true},
  {type: 'refactor', section: 'Code Refactoring', hidden: true},
  {type: 'test', section: 'Tests', hidden: true},
  {type: 'build', section: 'Build System', hidden: true},
  {type: 'ci', section: 'Continuous Integration', hidden: true},
];

export class Julia extends BaseStrategy {
  constructor(options: BaseStrategyOptions) {
    options.changelogSections = options.changelogSections ?? CHANGELOG_SECTIONS;
    super(options);
  }

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    !this.skipChangelog &&
      updates.push({
        path: this.addPath(this.changelogPath),
        createIfMissing: true,
        updater: new Changelog({
          version,
          changelogEntry: options.changelogEntry,
        }),
      });

    let parsedJuliaProject = await this.getJuliaProject(
      this.addPath('Project.toml')
    );

    let juliaProject = parsedJuliaProject;
    let projectName = this.component;
    if (juliaProject) {
      updates.push({
        path: this.addPath('Project.toml'),
        createIfMissing: false,
        updater: new JuliaProjectToml({
          version,
        }),
      });
      projectName = juliaProject.name;
    } else {
      this.logger.warn(
        parsedJuliaProject
          ? 'invalid Project.toml'
          : `file ${this.addPath('Project.toml')} did not exist`
      );
    }

    parsedJuliaProject = await this.getJuliaProject(
      this.addPath('JuliaProject.toml')
    );

    juliaProject = parsedJuliaProject;

    projectName = this.component;
    if (juliaProject) {
      updates.push({
        path: this.addPath('JuliaProject.toml'),
        createIfMissing: false,
        updater: new JuliaProjectToml({
          version,
        }),
      });
      projectName = juliaProject.name;
    } else {
      this.logger.warn(
        parsedJuliaProject
          ? 'invalid JuliaProject.toml'
          : `file ${this.addPath('JuliaProject.toml')} did not exist`
      );
    }

    if (!projectName) {
      this.logger.warn('No project/component found.');
    }

    // If a machine readable changelog.json exists update it:
    const artifactName = projectName;
    if (options.commits && artifactName && !this.skipChangelog) {
      const commits = filterCommits(options.commits, this.changelogSections);
      updates.push({
        path: 'changelog.json',
        createIfMissing: false,
        updater: new ChangelogJson({
          artifactName,
          version,
          commits,
          language: 'JULIA',
        }),
      });
    }

    return updates;
  }

  private async getJuliaProject(path: string): Promise<JuliaProject | null> {
    try {
      const content = await this.github.getFileContentsOnBranch(
        path,
        this.targetBranch
      );
      return parseJuliaProject(content.parsedContent);
    } catch (e) {
      return null;
    }
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }
}
