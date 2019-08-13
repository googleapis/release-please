import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ReleasePR, ReleaseCandidate } from '../release-pr';

import { ConventionalCommits } from '../conventional-commits';
import { GitHubTag } from '../github';
import { checkpoint, CheckpointType } from '../util/checkpoint';
import { Update } from '../updaters/update';
import { Commit } from '../graphql-to-commits';
import { CommitSplit } from '../commit-split';

import { Changelog } from '../updaters/changelog';
import { VersionRB } from '../updaters/version-rb';

export class RubyYoshi extends ReleasePR {
  protected async _run() {
    const lastReleaseSha: string | undefined = this.lastPackageVersion
      ? await this.gh.getTagSha(
          `${this.packageName}/v${this.lastPackageVersion}`
        )
      : undefined;
    const commits: Commit[] = await this.commits(
      lastReleaseSha,
      100,
      false,
      this.packageName
    );
    if (commits.length === 0) {
      checkpoint(
        `no commits found since ${lastReleaseSha}`,
        CheckpointType.Failure
      );
      return;
    } else {
      const cc = new ConventionalCommits({
        commits: processCommits(commits),
        githubRepoUrl: this.repoUrl,
        bumpMinorPreMajor: this.bumpMinorPreMajor,
        commitPartial: readFileSync(
          resolve(__dirname, '../../../templates/commit.hbs'),
          'utf8'
        ),
        headerPartial: readFileSync(
          resolve(__dirname, '../../../templates/header.hbs'),
          'utf8'
        ),
        mainTemplate: readFileSync(
          resolve(__dirname, '../../../templates/template.hbs'),
          'utf8'
        ),
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
        previousTag: undefined,
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

      updates.push(
        new Changelog({
          path: `${this.packageName}/CHANGELOG.md`,
          changelogEntry,
          version: candidate.version,
          packageName: this.packageName,
        })
      );

      updates.push(
        new VersionRB({
          path: `${
            this.packageName
          }/lib/google/cloud/${this.packageName.replace(
            'google-cloud-',
            ''
          )}/version.rb`,
          changelogEntry,
          version: candidate.version,
          packageName: this.packageName,
        })
      );

      await this.openPR(
        commits[0].sha,
        `${changelogEntry}\n---\n`,
        updates,
        candidate.version,
        true
      );
    }
  }
}

function processCommits(commits: Commit[]): Commit[] {
  let hasDocs = false;
  // indent each line of the commit body, so that it looks
  // pretty in our template.
  commits.forEach(commit => {
    const message = commit.message;
    if (/^docs/.test(message)) hasDocs = true;
    commit.message = '';
    message.split('\n').forEach((line, i) => {
      if (i !== 0) line = `  ${line}`;
      commit.message += `${line}\n`;
    });
  });

  // if we saw any doc updates, add a top level note about updating
  // documents.
  commits.push({
    sha: 'abc123',
    message: 'feat: updates documentation',
    files: [],
  });

  return commits;
}
