import { BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions } from './base';
import { Update } from '../update';
import { ConventionalCommit } from '../commit';
import { Version } from '../version';
import { TagName } from '../util/tag-name';
import { Release } from '../release';
export declare class DotnetYoshi extends BaseStrategy {
    constructor(options: BaseStrategyOptions);
    protected buildReleaseNotes(conventionalCommits: ConventionalCommit[], newVersion: Version, newVersionTag: TagName, latestRelease?: Release): Promise<string>;
    private getApi;
    getDefaultComponent(): Promise<string | undefined>;
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
}
