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

import {GitHubFileContents} from '@google-automations/git-file-utils';

// Generic
import {Changelog} from '../updaters/changelog';
// OCaml
import {Opam} from '../updaters/ocaml/opam';
import {EsyJson} from '../updaters/ocaml/esy-json';
import {DuneProject} from '../updaters/ocaml/dune-project';
import {BaseStrategy, BuildUpdatesOptions} from './base';
import {Update} from '../update';

const notEsyLock = (path: string) => !path.startsWith('esy.lock');

export class OCaml extends BaseStrategy {
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

    const jsonPaths = await this.github.findFilesByExtension('json', this.path);
    for (const path of jsonPaths) {
      if (notEsyLock(path)) {
        const contents: GitHubFileContents = await this.github.getFileContents(
          this.addPath(path)
        );
        const pkg = JSON.parse(contents.parsedContent);
        if (pkg.version !== undefined) {
          updates.push({
            path: this.addPath(path),
            createIfMissing: false,
            cachedFileContents: contents,
            updater: new EsyJson({
              version,
            }),
          });
        }
      }
    }

    const opamPaths = await this.github.findFilesByExtension('opam', this.path);
    opamPaths.filter(notEsyLock).forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new Opam({
          version,
        }),
      });
    });

    const opamLockedPaths = await this.github.findFilesByExtension(
      'opam.locked',
      this.path
    );
    opamLockedPaths.filter(notEsyLock).forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new Opam({
          version,
        }),
      });
    });

    updates.push({
      path: this.addPath('dune-project'),
      createIfMissing: false,
      updater: new DuneProject({
        version,
      }),
    });

    return updates;
  }
}
