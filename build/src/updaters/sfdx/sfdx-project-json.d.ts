import { Logger } from '../../util/logger';
import { DefaultUpdater } from '../default';
export type PackageDirectory = {
    versionNumber: string;
    default: boolean;
};
export type SfdxProjectFile = {
    packageDirectories: PackageDirectory[];
    name: string;
};
/**
 * This updates a sfdx sfdx-project.json file's main version.
 */
export declare class SfdxProjectJson extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
