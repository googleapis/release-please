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
import {isStableArtifact} from './java/stability';
import {BranchName} from '../util/branch-name';

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

export class JavaYoshi extends ReleasePR {
  protected async _run(): Promise<number | undefined> {
    const versionsManifestContent = await this.gh.getFileContents(
      'versions.txt'
    );
    const currentVersions = VersionsManifest.parseVersions(
      versionsManifestContent.parsedContent
    );

    const snapshotNeeded = VersionsManifest.needsSnapshot(
      versionsManifestContent.parsedContent
    );
    if (!this.snapshot) {
      // if a snapshot is not explicitly requested, decided what type
      // of release based on whether a snapshot is needed or not
      this.snapshot = snapshotNeeded;
    } else if (!snapshotNeeded) {
      checkpoint(
        'release asked for a snapshot, but no snapshot is needed',
        CheckpointType.Failure
      );
      return undefined;
    }

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
      : await this.commits({
          sha: latestTag ? latestTag.sha : undefined,
          labels: true,
        });
    if (commits.length === 0) {
      checkpoint(
        `no commits found since ${
          latestTag ? latestTag.sha : 'beginning of time'
        }`,
        CheckpointType.Failure
      );
      return undefined;
    }
    let prSHA = commits[0].sha;
    // Snapshots populate a fake "fix:"" commit, so that they will always
    // result in a patch update. We still need to know the HEAD sba, so that
    // we can use this as a starting point for the snapshot PR:
    if (this.snapshot && latestTag?.sha) {
      const latestCommit = (
        await this.commits({
          sha: latestTag.sha,
          perPage: 1,
          labels: true,
        })
      )[0];
      prSHA = latestCommit ? latestCommit.sha : latestTag.sha;
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
    const candidateVersions = await this.coerceVersions(
      cc,
      currentVersions,
      candidate
    );
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
      return undefined;
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

    return await this.openPR({
      sha: prSHA!,
      changelogEntry: `${changelogEntry}\n---\n`,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
    });
  }

  protected supportsSnapshots(): boolean {
    return true;
  }

  protected defaultInitialVersion(): string {
    return '0.1.0';
  }

  protected async coerceVersions(
    cc: ConventionalCommits,
    currentVersions: VersionsMap,
    candidate: ReleaseCandidate
  ): Promise<VersionsMap> {
    const newVersions: VersionsMap = new Map<string, string>();
    for (const [k, version] of currentVersions) {
      if (candidate.version === '1.0.0' && isStableArtifact(k)) {
        newVersions.set(k, '1.0.0');
      } else {
        const bump = await cc.suggestBump(version);
        const newVersion = Version.parse(version);
        newVersion.bump(
          this.snapshot ? 'snapshot' : fromSemverReleaseType(bump.releaseType)
        );
        newVersions.set(k, newVersion.toString());
      }
    }
    return newVersions;
  }

  // Begin release configuration

  // Override this method to use static branch names
  // If you modify this, you must ensure that the releaser can parse the tag version
  // from the pull request.
  protected async buildBranchName(
    version: string,
    includePackageName: boolean
  ): Promise<BranchName> {
    const defaultBranch = await this.getDefaultBranch();
    if (includePackageName && this.packageName) {
      return BranchName.ofComponentTargetBranch(
        this.packageName,
        defaultBranch
      );
    }
    return BranchName.ofTargetBranch(defaultBranch);
  }

  // Override this method to modify the pull request title
  protected async buildPullRequestTitle(
    version: string,
    includePackageName: boolean
  ): Promise<string> {
    const defaultBranch = await this.getDefaultBranch();
    return includePackageName
      ? `chore(${defaultBranch}): release ${this.packageName} ${version}`
      : `chore(${defaultBranch}): release ${version}`;
  }

  // Override this method to detect the release version from code (if it cannot be
  // inferred from the release PR head branch)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected detectReleaseVersionFromTitle(title: string): string | undefined {
    const pattern = /^chore\((?<branch>[^(]+)\): release ?(?<component>.*) (?<version>\d+\.\d+\.\d+)$/;
    const match = title.match(pattern);
    if (match?.groups) {
      return match.groups['version'];
    }
    return undefined;
  }
}
