import { JavaUpdate } from './java-update';
import { VersionsMap } from '../../version';
import { Logger } from '../../util/logger';
/**
 * Updates a versions.txt file which contains current versions of
 * components within a Java repo.
 * @see https://github.com/googleapis/java-asset/blob/main/versions.txt
 */
export declare class VersionsManifest extends JavaUpdate {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
    protected updateSingleVersion(content: string, packageName: string, version: string): string;
    static parseVersions(content: string): VersionsMap;
    static needsSnapshot(content: string): boolean;
}
