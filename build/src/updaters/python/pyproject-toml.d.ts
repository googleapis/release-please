import { Logger } from '../../util/logger';
import { DefaultUpdater } from '../default';
interface PyProjectContent {
    name: string;
    version: string;
    dynamic?: string[];
}
/**
 * A subset of the contents of a `pyproject.toml`
 */
export interface PyProject {
    project?: PyProjectContent;
    tool?: {
        poetry?: PyProjectContent;
    };
}
export declare function parsePyProject(content: string): PyProject;
/**
 * Updates a pyproject.toml file
 */
export declare class PyProjectToml extends DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content: string, logger?: Logger): string;
}
export {};
