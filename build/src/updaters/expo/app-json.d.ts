import { Logger } from '../../util/logger';
import { DefaultUpdater, UpdateOptions } from '../default';
import { Version } from '../../version';
export interface AppJson {
    expo: {
        version: string;
        ios?: {
            buildNumber?: string;
        };
        android?: {
            versionCode?: number;
        };
    };
}
export interface AppJsonOptions extends UpdateOptions {
    expoSDKVersion: Version;
}
/**
 * This updates a React Natve Expo project app.json file's main, ios and android
 * versions. All values except the `android.versionCode` are standard semver
 * version numbers. For the `android.versionCode`, the semver number is used as
 * the basis for the `versionCode`.
 */
export declare class AppJson extends DefaultUpdater {
    expoSDKVersion: Version;
    constructor(options: AppJsonOptions);
    /**
     * Given initial file contents, return updated contents.
     */
    updateContent(content: string, logger?: Logger): string;
}
