import { BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions } from './base';
import { ConventionalCommit } from '../commit';
import { Update } from '../update';
export declare class Ruby extends BaseStrategy {
    readonly versionFile: string;
    constructor(options: BaseStrategyOptions);
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    protected postProcessCommits(commits: ConventionalCommit[]): Promise<ConventionalCommit[]>;
}
