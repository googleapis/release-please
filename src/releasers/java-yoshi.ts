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

import {ReleasePR, ReleasePROptions, ReleaseCandidate} from '../release-pr';
import * as semver from 'semver';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag, GitHub} from '../github';
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

type BumpType = 'major' | 'minor' | 'patch' | 'snapshot';

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

  bump(bumpType: BumpType): Version {
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
    return this;
  }

  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}${this.extra}${
      this.snapshot ? '-SNAPSHOT' : ''
    }`;
  }
}

async function delay({ms = 3000}) {
  if (process.env.ENVIRONMENT === 'test') return;
  new Promise(resolve => {
    setTimeout(() => {
      return resolve();
    }, ms);
  });
}

interface Strategy {
  getUpdates(
    candidateVersions: VersionsMap,
    candidateVersion: string,
    packageName: string,
    gh: GitHub
  ): Promise<Update[]>;
  getChangelogEntry(): Promise<string>;
  getLabels(): string[];
  getBumpType(): Promise<BumpType>;
}

class ReleaseStrategy implements Strategy {
  cc: ConventionalCommits;
  latestTag: GitHubTag | undefined;
  constructor(cc: ConventionalCommits, latestTag: GitHubTag | undefined) {
    this.cc = cc;
    this.latestTag = latestTag;
  }
  async getUpdates(
    candidateVersions: VersionsMap,
    candidateVersion: string,
    packageName: string,
    gh: GitHub
  ): Promise<Update[]> {
    let updates: Update[] = [];
    const changelogEntry = await this.getChangelogEntry();

    updates.push(
      new Changelog({
        path: 'CHANGELOG.md',
        changelogEntry,
        versions: candidateVersions,
        version: candidateVersion,
        packageName: packageName,
      })
    );

    updates.push(
      new Readme({
        path: 'README.md',
        changelogEntry,
        versions: candidateVersions,
        version: candidateVersion,
        packageName: packageName,
      })
    );

    updates.push(
      new GoogleUtils({
        // TODO(@chingor): should this use search like pom.xml?
        path:
          'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        changelogEntry,
        versions: candidateVersions,
        version: candidateVersion,
        packageName: packageName,
      })
    );

    updates.push(
      new VersionsManifest({
        path: 'versions.txt',
        changelogEntry,
        versions: candidateVersions,
        version: candidateVersion,
        packageName: packageName,
      })
    );

    const pomFiles = await gh.findFilesByFilename('pom.xml');
    pomFiles.forEach(path => {
      updates.push(
        new PomXML({
          path,
          changelogEntry,
          versions: candidateVersions,
          version: candidateVersion,
          packageName: packageName,
        })
      );
    });
    return updates;
  }
  async getChangelogEntry(): Promise<string> {
    const releaseCandidate = await ReleasePR.buildReleaseCandidate(
      this.cc,
      this.latestTag,
      '0.1.0',
      undefined
    );
    return await this.cc.generateChangelogEntry({
      version: releaseCandidate.version,
      currentTag: `v${releaseCandidate.version}`,
      previousTag: releaseCandidate.previousTag,
    });
  }
  getLabels(): string[] {
    return ['autorelease: pending'];
  }
  async getBumpType(): Promise<BumpType> {
    const bump = await this.cc.suggestBump('0.1.0');
    switch (bump.releaseType) {
      case 'major':
      case 'minor':
      case 'patch':
        return bump.releaseType;
      default:
        throw Error(`unsupported release type ${bump.releaseType}`);
    }
  }
}

class SnapshotStrategy implements Strategy {
  async getUpdates(
    candidateVersions: VersionsMap,
    candidateVersion: string,
    packageName: string,
    gh: GitHub
  ): Promise<Update[]> {
    let updates: Update[] = [];
    updates.push(
      new VersionsManifest({
        path: 'versions.txt',
        changelogEntry: 'unused',
        versions: candidateVersions,
        version: candidateVersion,
        packageName: packageName,
      })
    );

    const pomFiles = await gh.findFilesByFilename('pom.xml');
    pomFiles.forEach(path => {
      updates.push(
        new PomXML({
          path,
          changelogEntry: 'unused',
          versions: candidateVersions,
          version: candidateVersion,
          packageName: packageName,
        })
      );
    });
    return updates;
  }
  async getChangelogEntry(): Promise<string> {
    return '### Updating meta-information for bleeding-edge SNAPSHOT release.';
  }
  getLabels(): string[] {
    return ['type: process'];
  }
  async getBumpType(): Promise<BumpType> {
    return 'snapshot';
  }
}

export class JavaYoshi extends ReleasePR {
  constructor(options: ReleasePROptions) {
    super(options);
  }
  protected async _run() {
    // Load versions manifest
    // Detect snapshot
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

    const latestTag: GitHubTag | undefined = await this.gh.latestTag();

    const commits: Commit[] = await this.commits(
      latestTag ? latestTag.sha : undefined,
      100,
      true
    );
    const prSHA = commits[0].sha;

    const strategy = this.getStrategy(commits, latestTag);
    this.labels = strategy.getLabels();
    const bumpType = await strategy.getBumpType();
    const changelogEntry = await strategy.getChangelogEntry();
    const candidateVersions = this.bumpVersions(bumpType, currentVersions);

    let candidateVersion = latestTag
      ? Version.parse(latestTag.name).bump(bumpType).toString()
      : this.defaultInitialVersion();

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

    const updates = await strategy.getUpdates(
      candidateVersions,
      candidateVersion,
      this.packageName,
      this.gh
    );

    console.info(
      `attempting to open PR latestTagSha = ${latestTag!.sha} prSha = ${prSHA}`
    );
    await this.openPR(
      prSHA!,
      `${changelogEntry}\n---\n`,
      updates,
      candidateVersion
    );
  }

  protected getStrategy(
    commits: Commit[],
    latestTag: GitHubTag | undefined
  ): Strategy {
    const cc = new ConventionalCommits({
      commits,
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      changelogSections: CHANGELOG_SECTIONS,
    });
    return this.snapshot
      ? new SnapshotStrategy()
      : new ReleaseStrategy(cc, latestTag);
  }

  protected defaultInitialVersion(): string {
    return '0.1.0';
  }

  protected bumpVersions(
    bumpType: BumpType,
    currentVersions: VersionsMap
  ): VersionsMap {
    const newVersions: VersionsMap = new Map<string, string>();
    for (const [k, version] of currentVersions) {
      const newVersion = Version.parse(version);
      newVersion.bump(bumpType);
      newVersions.set(k, newVersion.toString());
    }
    return newVersions;
  }
}
