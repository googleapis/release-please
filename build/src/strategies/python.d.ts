import { BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions } from './base';
import { Update } from '../update';
import { Version } from '../version';
export declare class Python extends BaseStrategy {
    constructor(options: BaseStrategyOptions);
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    private getPyProject;
    protected getNameFromSetupPy(): Promise<string | null>;
    protected getSetupPyContents(): Promise<string | null>;
    protected initialReleaseVersion(): Version;
}
