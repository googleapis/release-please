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

import { ReleasePR, ReleasePROptions, ReleaseCandidate } from '../release-pr';
import * as semver from 'semver';

import { ConventionalCommits } from '../conventional-commits';
import { GitHubTag } from '../github';
import { checkpoint, CheckpointType } from '../util/checkpoint';
import { Update, VersionsMap } from '../updaters/update';
import { Commit } from '../graphql-to-commits';

// Generic
import { Changelog } from '../updaters/changelog';
// Java
import { GoogleUtils } from '../updaters/java/google-utils';
import { PomXML } from '../updaters/java/pom-xml';
import { VersionsManifest } from '../updaters/java/versions-manifest';
import { Readme } from '../updaters/java/readme';

type BumpType = 'major' | 'minor' | 'patch' | 'snapshot';

const CHANGELOG_SECTIONS = [
  { type: 'feat', section: 'Features' },
  { type: 'fix', section: 'Bug Fixes' },
  { type: 'perf', section: 'Performance Improvements' },
  { type: 'deps', section: 'Dependencies' },
  { type: 'revert', section: 'Reverts' },
  { type: 'docs', section: 'Documentation' },
  { type: 'style', section: 'Styles', hidden: true },
  { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
  { type: 'refactor', section: 'Code Refactoring', hidden: true },
  { type: 'test', section: 'Tests', hidden: true },
  { type: 'build', section: 'Build System', hidden: true },
  { type: 'ci', section: 'Continuous Integration', hidden: true },
];

const VERSION_REGEX = /(\d+)\.(\d+)\.(\d+)(-\w+)?(-SNAPSHOT)?/;
export class Version {
  major: number;
  minor: number;
  patch: number;
  extra: string;
  snapshot: boolean;

  constructor(
    major: number,
    minor: number,
    patch: number,
    extra: string,
    snapshot: boolean
  ) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.extra = extra;
    this.snapshot = snapshot;
  }

  static parse(version: string): Version {
    const match = version.match(VERSION_REGEX);
    if (!match) {
      throw Error(`unable to parse version string: ${version}`);
    }
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);
    let extra = '';
    let snapshot = false;
    if (match[5]) {
      extra = match[4];
      snapshot = match[5] === '-SNAPSHOT';
    } else if (match[4]) {
      if (match[4] === '-SNAPSHOT') {
        snapshot = true;
      } else {
        extra = match[4];
      }
    }
    return new Version(major, minor, patch, extra, snapshot);
  }

  bump(bumpType: BumpType) {
    switch (bumpType) {
      case 'major':
        this.major += 1;
        this.minor = 0;
        this.patch = 0;
        this.snapshot = false;
        break;
      case 'minor':
        this.minor += 1;
        this.patch = 0;
        this.snapshot = false;
        break;
      case 'patch':
        this.patch += 1;
        this.snapshot = false;
        break;
      case 'snapshot':
        this.patch += 1;
        this.snapshot = true;
        break;
      default:
        throw Error(`unsupported bump type: ${bumpType}`);
    }
  }

  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}${this.extra}${
      this.snapshot ? '-SNAPSHOT' : ''
    }`;
  }
}

export class JavaYoshi extends ReleasePR {
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
    console.info('current package versions:', currentVersions);
    const candidateVersions = await this.coerceVersions(cc, currentVersions);
    let changelogEntry: string = await cc.generateChangelogEntry({
      version: candidate.version,
      currentTag: `v${candidate.version}`,
      previousTag: candidate.previousTag,
    });
    console.info('candidate package versions:', candidateVersions);

    // snapshot entries are special:
    // 1. they don't update the README or CHANGELOG.
    // 2. they always update a patch with the -SNAPSHOT suffix.
    // 3. they're haunted.
    if (this.snapshot) {
      prSHA = latestTag!.sha;
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

  protected async coerceVersions(
    cc: ConventionalCommits,
    currentVersions: VersionsMap
  ): Promise<VersionsMap> {
    const newVersions: VersionsMap = new Map<string, string>();
    for (const [k, version] of currentVersions) {
      const bump = await cc.suggestBump(version);
      const newVersion = Version.parse(version);
      newVersion.bump(this.coerceBumpType(bump.releaseType));
      newVersions.set(k, newVersion.toString());
    }
    return newVersions;
  }

  private coerceBumpType(releaseType: semver.ReleaseType): BumpType {
    if (this.snapshot) {
      return 'snapshot';
    }
    switch (releaseType) {
      case 'major':
      case 'minor':
      case 'patch':
        return releaseType;
      default:
        throw Error(`unsupported release type ${releaseType}`);
    }
  }
}
