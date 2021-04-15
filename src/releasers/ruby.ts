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

import {ReleasePRConstructorOptions} from '..';
import {
  ReleasePR,
  ReleaseCandidate,
  GetCommitsOptions,
  PackageName,
} from '../release-pr';
import {indentCommit} from '../util/indent-commit';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';

// Ruby
import {VersionRB} from '../updaters/version-rb';

export class Ruby extends ReleasePR {
  versionFile: string;
  constructor(options: ReleasePRConstructorOptions) {
    super(options);
    this.versionFile = options.versionFile ?? '';
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
      new VersionRB({
        path: this.addPath(this.versionFile),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );
    return updates;
  }

  tagSeparator(): string {
    return '/';
  }

  protected async commits(opts: GetCommitsOptions): Promise<Commit[]> {
    return postProcessCommits(await super.commits(opts));
  }
}

function postProcessCommits(commits: Commit[]): Commit[] {
  commits.forEach(commit => {
    commit.message = indentCommit(commit);
  });
  return commits;
}
