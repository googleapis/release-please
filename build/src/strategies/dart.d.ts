import { BaseStrategy, BuildUpdatesOptions } from './base';
import { Update } from '../update';
export declare class Dart extends BaseStrategy {
    private pubspecYmlContents?;
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    getDefaultPackageName(): Promise<string | undefined>;
    private getPubspecYmlContents;
}
