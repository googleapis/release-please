import { BaseStrategy, BuildUpdatesOptions } from './base';
import { Update } from '../update';
export declare class Elixir extends BaseStrategy {
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
}
