import { BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions } from './base';
import { Update } from '../update';
export declare class Simple extends BaseStrategy {
    readonly versionFile: string;
    constructor(options: BaseStrategyOptions);
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
}
