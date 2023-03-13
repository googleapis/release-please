import {Commit} from '../commit';
import {ReleaserConfig} from '../manifest';
import {normalizePaths} from './commit-utils';

export type CommitExcludeConfig = Pick<ReleaserConfig, 'excludePaths'>;

export class CommitExclude {
  private excludePaths: Record<string, string[]> = {};

  constructor(config: Record<string, CommitExcludeConfig>) {
    Object.entries(config).forEach(([path, releaseConfig]) => {
      if (releaseConfig.excludePaths) {
        this.excludePaths[path] = normalizePaths(releaseConfig.excludePaths);
      }
    });
  }

  excludeCommits<T extends Commit>(
    commitsPerPath: Record<string, T[]>
  ): Record<string, T[]> {
    const filteredCommitsPerPath: Record<string, T[]> = {};
    Object.entries(commitsPerPath).forEach(([path, commits]) => {
      if (this.excludePaths[path]) {
        commits = commits.filter(commit =>
          this.shouldInclude(commit, this.excludePaths[path])
        );
      }
      filteredCommitsPerPath[path] = commits;
    });
    return filteredCommitsPerPath;
  }

  private shouldInclude(commit: Commit, excludePaths: string[]): boolean {
    return (
      !commit.files ||
      !commit.files.every(file =>
        excludePaths.some(path => file.indexOf(`${path}/`) === 0)
      )
    );
  }
}
