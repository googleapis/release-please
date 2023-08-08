import { BaseStrategy, BuildUpdatesOptions } from './base';
import { Update } from '../update';
export declare class Helm extends BaseStrategy {
    private chartYmlContents?;
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    getDefaultPackageName(): Promise<string | undefined>;
    private getChartYmlContents;
}
