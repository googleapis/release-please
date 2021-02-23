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

import {ReleasePR, ReleaseCandidate} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag, GitHubFileContents} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';
// OCaml
import {Opam} from '../updaters/ocaml/opam';
import {EsyJson} from '../updaters/ocaml/esy-json';

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
  protected async _run(): Promise<number | undefined> {
    const packageName = await this.getPackageName();
    const latestTag: GitHubTag | undefined = await this.latestTag(
      this.monorepoTags ? `${packageName.getComponent()}-` : undefined
    );
    const commits: Commit[] = await this.commits({
      sha: latestTag ? latestTag.sha : undefined,
      path: this.path,
    });

    const cc = new ConventionalCommits({
      commits,
      owner: this.gh.owner,
      repository: this.gh.repo,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      // TODO: Is this configurable?
      changelogSections: CHANGELOG_SECTIONS,
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      cc,
      latestTag
    );
    const changelogEntry: string = await cc.generateChangelogEntry({
      version: candidate.version,
      currentTag: `v${candidate.version}`,
      previousTag: candidate.previousTag,
    });

    // don't create a release candidate until user facing changes
    // (fix, feat, BREAKING CHANGE) have been made; a CHANGELOG that's
    // one line is a good indicator that there were no interesting commits.
    if (this.changelogEmpty(changelogEntry)) {
      checkpoint(
        `no user facing commits found since ${
          latestTag ? latestTag.sha : 'beginning of time'
        }`,
        CheckpointType.Failure
      );
      return undefined;
    }

    const updates: Update[] = [];

    const jsonPaths = await this.gh.findFilesByExtension('json');
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

    const opamPaths = await this.gh.findFilesByExtension('opam');
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
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    return await this.openPR({
      sha: commits[0].sha!,
      changelogEntry: `${changelogEntry}\n---\n`,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
    });
  }
}
