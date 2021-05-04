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

import chalk = require('chalk');

import {ReleasePR, ReleaseCandidate, PackageName} from '../release-pr';
import {Update} from '../updaters/update';

// Generic
import {Changelog} from '../updaters/changelog';
// Python specific.
import {SetupPy} from '../updaters/python/setup-py';
import {SetupCfg} from '../updaters/python/setup-cfg';
import {PythonFileWithVersion} from '../updaters/python/python-file-with-version';
import {ReleasePRConstructorOptions} from '..';
import {
  parsePyProject,
  PyProject,
  PyProjectToml,
} from '../updaters/python/pyproject-toml';
import {GitHubFileContents} from '../github';
import {logger} from '../util/logger';

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

export class Python extends ReleasePR {
  constructor(options: ReleasePRConstructorOptions) {
    super(options);
    this.changelogSections = options.changelogSections ?? CHANGELOG_SECTIONS;
  }

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
      new SetupCfg({
        path: this.addPath('setup.cfg'),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );
    updates.push(
      new SetupPy({
        path: this.addPath('setup.py'),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    const parsedPyProject = await this.getPyProject();
    const pyProject = parsedPyProject?.project || parsedPyProject?.tool?.poetry;
    if (pyProject) {
      updates.push(
        new PyProjectToml({
          path: this.addPath('pyproject.toml'),
          changelogEntry,
          version: candidate.version,
          packageName: packageName.name,
        })
      );

      if (pyProject.name) {
        updates.push(
          new PythonFileWithVersion({
            path: this.addPath(`${pyProject.name}/__init__.py`),
            changelogEntry,
            version: candidate.version,
            packageName: packageName.name,
          })
        );
      }
    } else {
      logger.error(
        parsedPyProject
          ? 'invalid pyproject.toml'
          : `file ${chalk.green('pyproject.toml')} did not exist`
      );
    }

    // There should be only one version.py, but foreach in case that is incorrect
    const versionPyFilesSearch = this.gh.findFilesByFilename(
      'version.py',
      this.path
    );
    const versionPyFiles = await versionPyFilesSearch;
    versionPyFiles.forEach(path => {
      updates.push(
        new PythonFileWithVersion({
          path: this.addPath(path),
          changelogEntry,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    });
    return updates;
  }

  protected async getPyProject(): Promise<PyProject | null> {
    let content: GitHubFileContents;
    try {
      content = await this.gh.getFileContents('pyproject.toml');
    } catch (e) {
      return null;
    }
    return parsePyProject(content.parsedContent);
  }

  defaultInitialVersion(): string {
    return '0.1.0';
  }
}
