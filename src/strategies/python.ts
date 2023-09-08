// Copyright 2019 Google LLC
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
import {SetupCfg} from '../updaters/python/setup-cfg';
import {SetupPy} from '../updaters/python/setup-py';
import {
  PyProject,
  parsePyProject,
  PyProjectToml,
} from '../updaters/python/pyproject-toml';
import {PythonFileWithVersion} from '../updaters/python/python-file-with-version';
import {FileNotFoundError} from '../errors';
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

export class Python extends BaseStrategy {
  constructor(options: BaseStrategyOptions) {
    options.changelogSections = options.changelogSections ?? CHANGELOG_SECTIONS;
    super(options);
  }

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
      path: this.addPath('setup.cfg'),
      createIfMissing: false,
      updater: new SetupCfg({
        version,
      }),
    });

    updates.push({
      path: this.addPath('setup.py'),
      createIfMissing: false,
      updater: new SetupPy({
        version,
      }),
    });

    const parsedPyProject = await this.getPyProject(
      this.addPath('pyproject.toml')
    );
    const pyProject = parsedPyProject?.project || parsedPyProject?.tool?.poetry;
    let projectName = this.component;
    if (pyProject) {
      updates.push({
        path: this.addPath('pyproject.toml'),
        createIfMissing: false,
        updater: new PyProjectToml({
          version,
        }),
      });
      projectName = pyProject.name;
    } else {
      this.logger.warn(
        parsedPyProject
          ? 'invalid pyproject.toml'
          : `file ${this.addPath('pyproject.toml')} did not exist`
      );
    }

    if (!projectName) {
      this.logger.warn('No project/component found.');
    } else {
      [projectName, projectName.replace(/-/g, '_')]
        .flatMap(packageName => [
          `${packageName}/__init__.py`,
          `src/${packageName}/__init__.py`,
        ])
        .forEach(packagePath =>
          updates.push({
            path: this.addPath(packagePath),
            createIfMissing: false,
            updater: new PythonFileWithVersion({version}),
          })
        );
    }

    // There should be only one version.py, but foreach in case that is incorrect
    const versionPyFilesSearch = this.github.findFilesByFilenameAndRef(
      'version.py',
      this.changesBranch,
      this.path
    );
    const versionPyFiles = await versionPyFilesSearch;
    versionPyFiles.forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new PythonFileWithVersion({
          version,
        }),
      });
    });

    // If a machine readable changelog.json exists update it:
    const artifactName = projectName ?? (await this.getNameFromSetupPy());
    if (options.commits && artifactName) {
      const commits = filterCommits(options.commits, this.changelogSections);
      updates.push({
        path: 'changelog.json',
        createIfMissing: false,
        updater: new ChangelogJson({
          artifactName,
          version,
          commits,
          language: 'PYTHON',
        }),
      });
    }

    return updates;
  }

  private async getPyProject(path: string): Promise<PyProject | null> {
    try {
      const content = await this.github.getFileContentsOnBranch(
        path,
        this.changesBranch
      );
      return parsePyProject(content.parsedContent);
    } catch (e) {
      return null;
    }
  }

  protected async getNameFromSetupPy(): Promise<string | null> {
    const ARTIFACT_NAME_REGEX = /name *= *['"](?<name>.*)['"](\r|\n|$)/;
    const setupPyContents = await this.getSetupPyContents();
    if (setupPyContents) {
      const match = setupPyContents.match(ARTIFACT_NAME_REGEX);
      if (match && match?.groups?.name) {
        return match.groups.name;
      }
    }
    return null;
  }

  protected async getSetupPyContents(): Promise<string | null> {
    try {
      return (
        await this.github.getFileContentsOnBranch(
          this.addPath('setup.py'),
          this.changesBranch
        )
      ).parsedContent;
    } catch (e) {
      if (e instanceof FileNotFoundError) {
        return null;
      } else {
        throw e;
      }
    }
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.0.1');
  }
}
