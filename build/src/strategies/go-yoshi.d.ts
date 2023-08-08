import { BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions } from './base';
import { Update } from '../update';
import { Commit, ConventionalCommit } from '../commit';
import { Version } from '../version';
import { TagName } from '../util/tag-name';
import { Release } from '../release';
export declare class GoYoshi extends BaseStrategy {
    constructor(options: BaseStrategyOptions);
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    protected postProcessCommits(commits: ConventionalCommit[]): Promise<ConventionalCommit[]>;
    getIgnoredSubModules(): Promise<Set<string>>;
    protected buildReleaseNotes(conventionalCommits: ConventionalCommit[], newVersion: Version, newVersionTag: TagName, latestRelease?: Release, commits?: Commit[]): Promise<string>;
    protected initialReleaseVersion(): Version;
}
