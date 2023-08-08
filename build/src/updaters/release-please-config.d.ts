import { Updater } from '../update';
import { ReleaserConfig } from '../manifest';
export declare class ReleasePleaseConfig implements Updater {
    path: string;
    config: ReleaserConfig;
    constructor(path: string, config: ReleaserConfig);
    updateContent(content: string): string;
}
