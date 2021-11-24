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

import {Strategy, BuildUpdatesOptions} from '../strategy';
import {Update} from '../update';
import {Changelog} from '../updaters/changelog';
import {Version} from '../version';
import {SetupCfg} from '../updaters/python/setup-cfg';
import {SetupPy} from '../updaters/python/setup-py';
import {
  PyProject,
  parsePyProject,
  PyProjectToml,
} from '../updaters/python/pyproject-toml';
import {logger} from '../util/logger';
import {PythonFileWithVersion} from '../updaters/python/python-file-with-version';

export class Python extends Strategy {
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
      logger.warn(
        parsedPyProject
          ? 'invalid pyproject.toml'
          : `file ${this.addPath('pyproject.toml')} did not exist`
      );
    }

    if (!projectName) {
      logger.warn('No project/component found.');
    } else {
      updates.push({
        path: this.addPath(`${projectName}/__init__.py`),
        createIfMissing: false,
        updater: new PythonFileWithVersion({
          version,
        }),
      });
      updates.push({
        path: this.addPath(`src/${projectName}/__init__.py`),
        createIfMissing: false,
        updater: new PythonFileWithVersion({
          version,
        }),
      });
    }

    // There should be only one version.py, but foreach in case that is incorrect
    const versionPyFilesSearch = this.github.findFilesByFilename(
      'version.py',
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

    return updates;
  }

  private async getPyProject(path: string): Promise<PyProject | null> {
    try {
      const content = await this.github.getFileContentsOnBranch(
        path,
        this.targetBranch
      );
      return parsePyProject(content.parsedContent);
    } catch (e) {
      return null;
    }
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }
}
