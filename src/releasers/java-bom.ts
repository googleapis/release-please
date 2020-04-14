// Copyright 2020 Google LLC
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

import {ReleasePR} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update, VersionsMap} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';
// Java
import {PomXML} from '../updaters/java/pom-xml';
import {VersionsManifest} from '../updaters/java/versions-manifest';
import {Readme} from '../updaters/java/readme';
import {BumpType, maxBumpType, fromSemverReleaseType} from './java/bump_type';
import {Version} from './java/version';

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
const DEPENDENCY_UPDATE_REGEX = /^deps: update dependency (.*) to (v.*)(\s\(#\d+\))?$/m;
const DEPENDENCY_PATCH_VERSION_REGEX = /^v\d+\.\d+\.[1-9]\d*(-.*)?/;

async function delay({ms = 3000}) {
  if (process.env.ENVIRONMENT === 'test') return;
  new Promise(resolve => {
    setTimeout(() => {
      return resolve();
    }, ms);
  });
}

export class JavaBom extends ReleasePR {
  protected async _run() {
    const versionsManifestContent = await this.gh.getFileContents(
      'versions.txt'
    );
    console.info('version.txt content', versionsManifestContent.parsedContent);
    const currentVersions = VersionsManifest.parseVersions(
      versionsManifestContent.parsedContent
    );
    this.snapshot = VersionsManifest.needsSnapshot(
      versionsManifestContent.parsedContent
    );
    if (this.snapshot) {
      this.labels = ['type: process'];
      // TODO: this temporarily resolves a race condition between creating a release
      // and updating tags on the release PR. This should be replaced by a queuing
      // mechanism to delay/retry this request.
      if (this.snapshot) {
        checkpoint(
          'snapshot: sleeping for 15 seconds...',
          CheckpointType.Success
        );
        await delay({ms: 15000});
        checkpoint('snapshot: finished sleeping', CheckpointType.Success);
      }
    }

    const latestTag: GitHubTag | undefined = await this.gh.latestTag();

    const commits = await this.commits(
      latestTag ? latestTag.sha : undefined,
      this.snapshot ? 1 : 100,
      true
    );
    const prSHA = commits[0].sha;
    const cc = new ConventionalCommits({
      commits,
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      changelogSections: CHANGELOG_SECTIONS,
    });

    const bumpType = this.snapshot
      ? 'snapshot'
      : maxBumpType([
          JavaBom.determineBumpType(commits),
          fromSemverReleaseType(
            (
              await cc.suggestBump(
                latestTag?.sha || this.defaultInitialVersion()
              )
            ).releaseType
          ),
        ]);

    const candidate = {
      version: latestTag
        ? Version.parse(latestTag.version).bump(bumpType).toString()
        : this.defaultInitialVersion(),
      previousTag: latestTag?.version,
    };
    const changelogEntry = this.snapshot
      ? '### Updating meta-information for bleeding-edge SNAPSHOT release.'
      : await cc.generateChangelogEntry({
          version: candidate.version,
          currentTag: `v${candidate.version}`,
          previousTag: candidate.previousTag,
        });

    // don't create a release candidate until user facing changes
    // (fix, feat, BREAKING CHANGE) have been made; a CHANGELOG that's
    // one line is a good indicator that there were no interesting commits.
    if (this.changelogEmpty(changelogEntry) && !this.snapshot) {
      checkpoint(
        `no user facing commits found since ${
          latestTag ? latestTag.sha : 'beginning of time'
        }`,
        CheckpointType.Failure
      );
      return;
    }

    const candidateVersions = JavaBom.bumpAllVersions(
      bumpType,
      currentVersions
    );

    const updates: Update[] = [];

    if (!this.snapshot) {
      updates.push(
        new Changelog({
          path: 'CHANGELOG.md',
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: this.packageName,
        })
      );

      updates.push(
        new Readme({
          path: 'README.md',
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: this.packageName,
        })
      );
    }

    updates.push(
      new VersionsManifest({
        path: 'versions.txt',
        changelogEntry,
        versions: candidateVersions,
        version: candidate.version,
        packageName: this.packageName,
        contents: versionsManifestContent,
      })
    );

    const pomFiles = await this.gh.findFilesByFilename('pom.xml');
    pomFiles.forEach(path => {
      updates.push(
        new PomXML({
          path,
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: this.packageName,
        })
      );
    });

    console.info(
      `attempting to open PR latestTagSha = ${latestTag!.sha} prSha = ${prSHA}`
    );
    await this.openPR(
      prSHA!,
      `${changelogEntry}\n---\n`,
      updates,
      candidate.version
    );
  }

  protected defaultInitialVersion(): string {
    return '0.1.0';
  }

  static bumpAllVersions(
    bumpType: BumpType,
    currentVersions: VersionsMap
  ): VersionsMap {
    const newVersions: VersionsMap = new Map<string, string>();
    for (const [k, version] of currentVersions) {
      newVersions.set(k, Version.parse(version).bump(bumpType).toString());
    }
    return newVersions;
  }

  static dependencyUpdates(commits: Commit[]): VersionsMap {
    const versionsMap = new Map();
    commits.forEach(commit => {
      const match = commit.message.match(DEPENDENCY_UPDATE_REGEX);
      if (!match) return;

      // commits are sorted by latest first, so if there is a collision,
      // then we've already recorded the latest version
      if (versionsMap.has(match[1])) return;

      versionsMap.set(match[1], match[2]);
    });
    return versionsMap;
  }

  static isNonPatchVersion(commit: Commit) {
    let match = commit.message.match(DEPENDENCY_UPDATE_REGEX);
    if (!match) return false;

    match = match[2].match(DEPENDENCY_PATCH_VERSION_REGEX);
    if (!match) return true;

    return false;
  }

  static determineBumpType(commits: Commit[]): BumpType {
    if (commits.some(this.isNonPatchVersion)) {
      return 'minor';
    }
    return 'patch';
  }
}
