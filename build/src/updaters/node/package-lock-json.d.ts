import { Logger } from '../../util/logger';
import { DefaultUpdater } from '../default';
/**
 * Updates a Node.js package-lock.json file's version and '' package
 * version (for a v2 lock file).
 */
export declare class PackageLockJson extends DefaultUpdater {
    updateContent(content: string, logger?: Logger): string;
}
