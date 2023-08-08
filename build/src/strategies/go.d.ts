import { BaseStrategy, BuildUpdatesOptions } from './base';
import { Update } from '../update';
export declare class Go extends BaseStrategy {
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
}
