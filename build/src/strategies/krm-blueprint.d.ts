import { BaseStrategy, BuildUpdatesOptions } from './base';
import { Update } from '../update';
import { Version } from '../version';
export declare class KRMBlueprint extends BaseStrategy {
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    protected initialReleaseVersion(): Version;
}
