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

import { ReleasePR, ReleaseCandidate } from '../release-pr';

import { ConventionalCommits } from '../conventional-commits';
import { GitHubTag, GitHubFileContents } from '../github';
import { checkpoint, CheckpointType } from '../util/checkpoint';
import { Update, VersionsMap } from '../updaters/update';
import { Commit } from '../graphql-to-commits';
import { CommitSplit } from '../commit-split';
import * as semver from 'semver';

// Generic
import { Changelog } from '../updaters/changelog';
// Yoshi PHP Monorepo
import { PHPClientVersion } from '../updaters/php-client-version';
import { PHPManifest } from '../updaters/php-manifest';
import { RootComposer } from '../updaters/root-composer';
import { Version } from '../updaters/version';

interface PHPYoshiBulkUpdate {
  changelogEntry: string;
  versionUpdates: VersionsMap;
}

export class PHPYoshi extends ReleasePR {
  protected async _run() {
    const latestTag: GitHubTag | undefined = await this.gh.latestTag();
    const commits: Commit[] = await this.commits(
      latestTag ? latestTag.sha : undefined
    );

    // we create an instance of conventional CHANGELOG for bumping the
    // top-level tag version we maintain on the mono-repo itself.
    const ccb = new ConventionalCommits({
      commits,
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: true,
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      ccb,
      latestTag
    );

    // partition a set of packages in the mono-repo that need to be
    // updated since our last release -- the set of string keys
    // is sorted to ensure consistency in the CHANGELOG.
    const updates: Update[] = [];
    let changelogEntry = `## ${candidate.version}`;

    const bulkUpdate: PHPYoshiBulkUpdate = await this.releaseAllPHPLibraries(
      commits,
      updates,
      changelogEntry
    );
    changelogEntry = bulkUpdate.changelogEntry;

    // update the aggregate package information in the root
    // composer.json and manifest.json.
    updates.push(
      new RootComposer({
        path: 'composer.json',
        changelogEntry,
        version: candidate.version,
        versions: bulkUpdate.versionUpdates,
        packageName: this.packageName,
      })
    );

    updates.push(
      new PHPManifest({
        path: 'docs/manifest.json',
        changelogEntry,
        version: candidate.version,
        versions: bulkUpdate.versionUpdates,
        packageName: this.packageName,
      })
    );

    updates.push(
      new Changelog({
        path: 'CHANGELOG.md',
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    ['src/Version.php', 'src/ServiceBuilder.php'].forEach((path: string) => {
      updates.push(
        new PHPClientVersion({
          path,
          changelogEntry,
          version: candidate.version,
          packageName: this.packageName,
        })
      );
    });

    await this.openPR(
      commits[0].sha!,
      changelogEntry,
      updates,
      candidate.version
    );
  }

  private async releaseAllPHPLibraries(
    commits: Commit[],
    updates: Update[],
    changelogEntry: string
  ): Promise<PHPYoshiBulkUpdate> {
    const cs = new CommitSplit();
    const commitLookup: { [key: string]: Commit[] } = cs.split(commits);
    const pkgKeys: string[] = Object.keys(commitLookup).sort();
    // map of library names that need to be updated in the top level
    // composer.json and manifest.json.
    const versionUpdates: VersionsMap = new Map<string, string>();

    // walk each individual library updating the VERSION file, and
    // if necessary the `const VERSION` in the client library.
    for (let i = 0; i < pkgKeys.length; i++) {
      const pkgKey: string = pkgKeys[i];
      const cc = new ConventionalCommits({
        commits: commitLookup[pkgKey],
        githubRepoUrl: this.repoUrl,
        bumpMinorPreMajor: this.bumpMinorPreMajor,
      });

      // some packages in the mono-repo might have only had chores,
      // build updates, etc., applied.
      if (
        !this.changelogEmpty(
          await cc.generateChangelogEntry({ version: '0.0.0' })
        )
      ) {
        try {
          const contents: GitHubFileContents = await this.gh.getFileContents(
            `${pkgKey}/VERSION`
          );
          const bump = await cc.suggestBump(contents.parsedContent);
          const candidate: string | null = semver.inc(
            contents.parsedContent,
            bump.releaseType
          );
          if (!candidate) {
            checkpoint(
              `failed to update ${pkgKey} version`,
              CheckpointType.Failure
            );
            continue;
          }

          const meta = JSON.parse(
            (await this.gh.getFileContents(`${pkgKey}/composer.json`))
              .parsedContent
          );
          versionUpdates.set(meta.name, candidate);

          changelogEntry = updatePHPChangelogEntry(
            `${meta.name} ${candidate}`,
            changelogEntry,
            await cc.generateChangelogEntry({ version: candidate })
          );

          updates.push(
            new Version({
              path: `${pkgKey}/VERSION`,
              changelogEntry,
              version: candidate,
              packageName: this.packageName,
              contents,
            })
          );

          // extra.component indicates an entry-point class file
          // that must have its version # updatd.
          if (
            meta.extra &&
            meta.extra.component &&
            meta.extra.component.entry
          ) {
            updates.push(
              new PHPClientVersion({
                path: `${pkgKey}/${meta.extra.component.entry}`,
                changelogEntry,
                version: candidate,
                packageName: this.packageName,
              })
            );
          }
        } catch (err) {
          if (err.status === 404) {
            // if the updated path has no VERSION, assume this isn't a
            // module that needs updating.
            continue;
          } else {
            throw err;
          }
        }
      }
    }

    return { changelogEntry, versionUpdates };
  }
}

function updatePHPChangelogEntry(
  pkgKey: string,
  changelogEntry: string,
  entryUpdate: string
) {
  {
    // Remove the first line of the entry, in favor of <summary>.
    // This also allows us to use the same regex for extracting release
    // notes (since the string "## v0.0.0" doesn't show up multiple times).
    const entryUpdateSplit: string[] = entryUpdate.split(/\r?\n/);
    entryUpdateSplit.shift();
    entryUpdate = entryUpdateSplit.join('\n');
  }
  return `${changelogEntry}

<details><summary>${pkgKey}</summary>

${entryUpdate}

</details>`;
}
