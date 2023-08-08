import { BaseStrategy, BuildUpdatesOptions } from './base';
import { Update } from '../update';
import { GitHubFileContents } from '@google-automations/git-file-utils';
export declare class Node extends BaseStrategy {
    private pkgJsonContents?;
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    getDefaultPackageName(): Promise<string | undefined>;
    protected normalizeComponent(component: string | undefined): string;
    protected getPkgJsonContents(): Promise<GitHubFileContents>;
}
