import { ConventionalCommit } from '../commit';
import { Logger } from '../util/logger';
import { DefaultUpdater, UpdateOptions } from './default';
interface ChangelogJsonOptions extends UpdateOptions {
    artifactName: string;
    language: string;
    commits: ConventionalCommit[];
}
/**
 * Maintians a machine readable CHANGELOG in chnagelog.json.
 * See: https://gist.github.com/bcoe/50ef0a0024bbf107cd5bc0adbdc04758
 */
export declare class ChangelogJson extends DefaultUpdater {
    artifactName: string;
    language: string;
    commits: ConventionalCommit[];
    /**
     * Instantiate a new SamplesPackageJson updater
     * @param options
     */
    constructor(options: ChangelogJsonOptions);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
export {};
