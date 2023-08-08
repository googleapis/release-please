import { BaseStrategy, BuildUpdatesOptions } from './base';
import { Update } from '../update';
import { GitHubFileContents } from '@google-automations/git-file-utils';
export declare class Sfdx extends BaseStrategy {
    private sfdxProjectJsonContents?;
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    getDefaultPackageName(): Promise<string | undefined>;
    protected getSfdxProjectJsonContents(): Promise<GitHubFileContents>;
}
