import { Updater } from '../../update';
import { Version } from '../../version';
import { Logger } from '../../util/logger';
/**
 * Updates the apis.json format. See
 * https://github.com/googleapis/google-cloud-dotnet/blob/main/apis/README.md.
 */
export declare class Apis implements Updater {
    private version;
    private component;
    constructor(component: string, version: Version);
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
