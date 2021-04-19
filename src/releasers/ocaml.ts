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
// OCaml
import {Opam} from '../updaters/ocaml/opam';
import {EsyJson} from '../updaters/ocaml/esy-json';
import {DuneProject} from '../updaters/ocaml/dune-project';
import {ReleasePRConstructorOptions} from '..';

const notEsyLock = (path: string) => !path.startsWith('esy.lock');

const CHANGELOG_SECTIONS = [
  {type: 'feat', section: 'Features'},
  {type: 'fix', section: 'Bug Fixes'},
  {type: 'perf', section: 'Performance Improvements'},
  {type: 'revert', section: 'Reverts'},
  {type: 'docs', section: 'Documentation'},
  {type: 'chore', section: 'Miscellaneous Chores'},
  {type: 'refactor', section: 'Code Refactoring'},
  {type: 'test', section: 'Tests'},
  {type: 'build', section: 'Build System'},
  {type: 'ci', section: 'Continuous Integration'},
];

export class OCaml extends ReleasePR {
  constructor(options: ReleasePRConstructorOptions) {
    super(options);
    // FIXME: this was previously hard-coded, do allow overriding?
    this.changelogSections = CHANGELOG_SECTIONS;
  }

  protected async buildUpdates(
    changelogEntry: string,
    candidate: ReleaseCandidate,
    packageName: PackageName
  ): Promise<Update[]> {
    const updates: Update[] = [];

    const jsonPaths = await this.gh.findFilesByExtension('json', this.path);
    for (const path of jsonPaths) {
      if (notEsyLock(path)) {
        const contents: GitHubFileContents = await this.gh.getFileContents(
          this.addPath(path)
        );
        const pkg = JSON.parse(contents.parsedContent);
        if (pkg.version !== undefined) {
          updates.push(
            new EsyJson({
              path: this.addPath(path),
              changelogEntry,
              version: candidate.version,
              packageName: packageName.name,
              contents,
            })
          );
        }
      }
    }

    const opamPaths = await this.gh.findFilesByExtension('opam', this.path);
    opamPaths.filter(notEsyLock).forEach(path => {
      updates.push(
        new Opam({
          path: this.addPath(path),
          changelogEntry,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    });

    updates.push(
      new DuneProject({
        path: this.addPath('dune-project'),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    updates.push(
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );
    return updates;
  }
}
