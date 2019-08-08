import { ReleasePR, ReleaseCandidate } from '../release-pr';

import { ConventionalCommits } from '../conventional-commits';
import { GitHubTag } from '../github';
import { checkpoint, CheckpointType } from '../util/checkpoint';
import { Update } from '../updaters/update';
import { Commit } from '../graphql-to-commits';
import { CommitSplit } from '../commit-split';

export class RubyYoshi extends ReleasePR {
  protected async _run() {
    if (!this.lastPackageVersion)
      throw Error(
        'last library version must be provided for ruby-yoshi release type'
      );
    const lastReleaseSha = await this.gh.getTagSha(
      `${this.packageName}/v${this.lastPackageVersion}`
    );
    const commits: Commit[] = await this.commits(lastReleaseSha);
    const cs = new CommitSplit();
    const commitLookup: { [key: string]: Commit[] } = cs.split(commits);
    if (commitLookup[this.packageName] === undefined) {
      checkpoint(
        `no commits found since ${lastReleaseSha}`,
        CheckpointType.Failure
      );
    } else {
      const pkgCommits = commitLookup[this.packageName];
      const cc = new ConventionalCommits({
        commits: pkgCommits,
        githubRepoUrl: this.repoUrl,
        bumpMinorPreMajor: this.bumpMinorPreMajor,
      });
      const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
        cc,
        {
          version: this.lastPackageVersion,
          name: this.lastPackageVersion,
        } as GitHubTag
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
            lastReleaseSha ? lastReleaseSha : 'beginning of time'
          }`,
          CheckpointType.Failure
        );
        return;
      }

      const updates: Update[] = [];
    }
  }
}
