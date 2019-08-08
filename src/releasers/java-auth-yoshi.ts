import { ReleasePR, ReleaseCandidate } from '../release-pr';

import { ConventionalCommits } from '../conventional-commits';
import { GitHubTag } from '../github';
import { checkpoint, CheckpointType } from '../util/checkpoint';
import { Update } from '../updaters/update';
import { Commit } from '../graphql-to-commits';

// Generic
import { Changelog } from '../updaters/changelog';
// Java
import { PomXML } from '../updaters/pom-xml';
// Yoshi Java Auth Library
import { JavaAuthVersions } from '../updaters/java-auth-versions';
import { JavaAuthReadme } from '../updaters/java-auth-readme';

export class JavaAuthYoshi extends ReleasePR {
  protected async _run() {
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
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      cc,
      latestTag
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
          version: candidate.version,
          packageName: this.packageName,
        })
      );

      updates.push(
        new JavaAuthReadme({
          path: 'README.md',
          changelogEntry,
          version: candidate.version,
          packageName: this.packageName,
        })
      );
    }

    updates.push(
      new JavaAuthVersions({
        path: 'versions.txt',
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    [
      'appengine/pom.xml',
      'bom/pom.xml',
      'credentials/pom.xml',
      'oauth2_http/pom.xml',
      'pom.xml',
    ].forEach(path => {
      updates.push(
        new PomXML({
          path,
          changelogEntry,
          version: candidate.version,
          packageName: this.packageName,
        })
      );
    });

    await this.openPR(
      prSHA,
      `${changelogEntry}\n---\n`,
      updates,
      candidate.version
    );
  }
}
