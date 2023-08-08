import { ManifestPlugin } from '../plugin';
import { GitHub } from '../github';
import { RepositoryConfig } from '../manifest';
import { ConventionalCommit } from '../commit';
/**
 * This plugin converts commit messages to sentence case, for the benefit
 * of the generated CHANGELOG.
 */
export declare class SentenceCase extends ManifestPlugin {
    specialWords: Set<string>;
    constructor(github: GitHub, targetBranch: string, repositoryConfig: RepositoryConfig, specialWords?: Array<string>);
    /**
     * Perform post-processing on commits, e.g, sentence casing them.
     * @param {Commit[]} commits The set of commits that will feed into release pull request.
     * @returns {Commit[]} The modified commit objects.
     */
    processCommits(commits: ConventionalCommit[]): ConventionalCommit[];
    toUpperCase(word: string): string;
}
