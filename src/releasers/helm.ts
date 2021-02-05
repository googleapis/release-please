
import {ReleasePR, ReleaseCandidate} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHub, GitHubTag, GitHubFileContents} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';


// Generic
import {Changelog} from '../updaters/changelog';
import * as yaml from 'yaml';
// helm
import {ChartYaml} from '../updaters/helm/chart-yaml'


export class Helm extends ReleasePR {
  static releaserName = 'helm';
  protected async _run(): Promise<number | undefined> {
    // Make an effort to populate packageName from the contents of
    // the package.json, rather than forcing this to be set:
    const contents: GitHubFileContents = await this.gh.getFileContents(
      this.addPath('Chart.yaml')
    );
    const pkg = yaml.parse(contents.parsedContent);
    if (pkg.name) {
      this.packageName = pkg.name;
      // we've rewritten the package name, recalculate the package prefix
      this.packagePrefix = this.coercePackagePrefix(pkg.name);
    }

    const latestTag: GitHubTag | undefined = await this.gh.latestTag(
      this.monorepoTags ? `${this.packagePrefix}-` : undefined
    );
    const commits: Commit[] = await this.commits({
      sha: latestTag ? latestTag.sha : undefined,
      path: this.path,
    });

    const cc = new ConventionalCommits({
      commits,
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      changelogSections: this.changelogSections,
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      cc,
      latestTag
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
          latestTag ? latestTag.sha : 'beginning of time'
        }`,
        CheckpointType.Failure
      );
      return undefined;
    }

    const updates: Update[] = [];

    updates.push(
      new Changelog({
        path: this.addPath('CHANGELOG.md'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    updates.push(
      new ChartYaml({
        path: this.addPath('Chart.yaml'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
        contents,
      })
    );

    return await this.openPR({
      sha: commits[0].sha!,
      changelogEntry: `${changelogEntry}\n---\n`,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
    });
  }

  // A releaser can implement this method to automatically detect
  // the release name when creating a GitHub release, for instance by returning
  // name in package.json, or setup.py.
  static async lookupPackageName(
    gh: GitHub,
    path?: string
  ): Promise<string | undefined> {
    // Make an effort to populate packageName from the contents of
    // the package.json, rather than forcing this to be set:
    const contents: GitHubFileContents = await gh.getFileContents(
      this.addPathStatic('Chart.yaml', path)
    );
    const pkg = yaml.parse(contents.parsedContent);
    if (pkg.name) return pkg.name;
    else return undefined;
  }

  // Parse the package prefix for releases from the full package name
  // The package name usually looks like `@[group]/[library]`
  protected coercePackagePrefix(packageName: string): string {
    return packageName.match(/^@[\w-]+\//)
      ? packageName.split('/')[1]
      : packageName;
  }
}
