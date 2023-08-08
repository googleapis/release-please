import { ChangelogSection } from '../changelog-notes';
import { ConventionalCommit } from '../commit';
/**
 * Given a set of conventional commits and the configured
 * changelog sections provided by the user, return the set
 * of commits that should be displayed:
 *
 * @param commits
 * @param changelogSections
 * @returns ConventionalCommit[]
 */
export declare function filterCommits(commits: ConventionalCommit[], changelogSections?: ChangelogSection[]): ConventionalCommit[];
