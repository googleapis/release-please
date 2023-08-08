import { GitHubFileContents } from '@google-automations/git-file-utils';
import { Logger } from './util/logger';
/**
 * An update is a collection of data that represents changes to
 * a file in a repository.
 */
export interface Update {
    cachedFileContents?: GitHubFileContents;
    createIfMissing: boolean;
    path: string;
    updater: Updater;
}
/**
 * An updater is responsible for updating code for a file.
 * Given initial file contents, return updated contents.
 */
export interface Updater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string | undefined, logger?: Logger): string;
}
