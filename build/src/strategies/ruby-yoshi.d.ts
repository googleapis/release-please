import { BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions } from './base';
import { ConventionalCommit, Commit } from '../commit';
import { Update } from '../update';
import { Release } from '../release';
import { TagName } from '../util/tag-name';
import { Version } from '../version';
export declare class RubyYoshi extends BaseStrategy {
    readonly versionFile: string;
    constructor(options: BaseStrategyOptions);
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    protected postProcessCommits(commits: ConventionalCommit[]): Promise<ConventionalCommit[]>;
    protected buildReleaseNotes(conventionalCommits: ConventionalCommit[], newVersion: Version, newVersionTag: TagName, latestRelease?: Release, commits?: Commit[]): Promise<string>;
}
