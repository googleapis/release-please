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

import {ReleasePR, ReleaseCandidate} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update, VersionsMap} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';
// Java
import {GoogleUtils} from '../updaters/java/google-utils';
import {PomXML} from '../updaters/java/pom-xml';
import {VersionsManifest} from '../updaters/java/versions-manifest';
import {Readme} from '../updaters/java/readme';
import {Version} from './java/version';
import {fromSemverReleaseType} from './java/bump_type';
import {JavaUpdate} from '../updaters/java/java_update';

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

async function delay({ms = 3000}) {
  if (process.env.ENVIRONMENT === 'test') return;
  new Promise(resolve => {
    setTimeout(() => {
      return resolve();
    }, ms);
  });
}

export class JavaYoshi extends ReleasePR {
  static releaserName = 'java-yoshi';
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
    const commits: Commit[] = this.snapshot
      ? [
          {
            sha: 'abc123',
            message: 'fix: ',
            files: [],
          },
        ]
      : await this.commits(latestTag ? latestTag.sha : undefined, 100, true);
    let prSHA = commits[0].sha;
    // Snapshots populate a fake "fix:"" commit, so that they will always
    // result in a patch update. We still need to know the HEAD sba, so that
    // we can use this as a starting point for the snapshot PR:
    if (this.snapshot) {
      const latestCommit = (
        await this.commits(latestTag ? latestTag.sha : undefined, 1, true)
      )[0];
      prSHA = latestCommit.sha;
    }

    const cc = new ConventionalCommits({
      commits,
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      changelogSections: CHANGELOG_SECTIONS,
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      cc,
      latestTag
    );
    const candidateVersions = await this.coerceVersions(cc, currentVersions);
    let changelogEntry: string = await cc.generateChangelogEntry({
      version: candidate.version,
      currentTag: `v${candidate.version}`,
      previousTag: candidate.previousTag,
    });

    // snapshot entries are special:
    // 1. they don't update the README or CHANGELOG.
    // 2. they always update a patch with the -SNAPSHOT suffix.
    // 3. they're haunted.
    if (this.snapshot) {
      candidate.version = `${candidate.version}-SNAPSHOT`;
      changelogEntry =
        '### Updating meta-information for bleeding-edge SNAPSHOT release.';
    }

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

      updates.push(
        new GoogleUtils({
          // TODO(@chingor): should this use search like pom.xml?
          path:
            'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: this.packageName,
          contents: versionsManifestContent,
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

    const pomFilesSearch = this.gh.findFilesByFilename('pom.xml');
    const buildFilesSearch = this.gh.findFilesByFilename('build.gradle');
    const dependenciesSearch = this.gh.findFilesByFilename(
      'dependencies.properties'
    );

    const pomFiles = await pomFilesSearch;
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

    const buildFiles = await buildFilesSearch;
    buildFiles.forEach(path => {
      updates.push(
        new JavaUpdate({
          path,
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: this.packageName,
        })
      );
    });

    const dependenciesFiles = await dependenciesSearch;
    dependenciesFiles.forEach(path => {
      updates.push(
        new JavaUpdate({
          path,
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: this.packageName,
        })
      );
    });

    console.info(
      `attempting to open PR latestTagSha = ${
        latestTag ? latestTag.sha : 'none'
      } prSha = ${prSHA}`
    );
    await this.openPR(
      prSHA!,
      `${changelogEntry}\n---\n`,
      updates,
      candidate.version
    );
  }

  protected supportsSnapshots(): boolean {
    return true;
  }

  protected defaultInitialVersion(): string {
    return '0.1.0';
  }

  protected async coerceVersions(
    cc: ConventionalCommits,
    currentVersions: VersionsMap
  ): Promise<VersionsMap> {
    const newVersions: VersionsMap = new Map<string, string>();
    for (const [k, version] of currentVersions) {
      const bump = await cc.suggestBump(version);
      const newVersion = Version.parse(version);
      newVersion.bump(
        this.snapshot ? 'snapshot' : fromSemverReleaseType(bump.releaseType)
      );
      newVersions.set(k, newVersion.toString());
    }
    return newVersions;
  }
}
