import { GitHub } from './github';
import { ReleaserConfig } from './manifest';
import { PullRequest } from './pull-request';
import { Update } from './update';
interface BootstrapPullRequest extends PullRequest {
    updates: Update[];
}
export declare class Bootstrapper {
    private github;
    private targetBranch;
    private manifestFile;
    private configFile;
    private initialVersion;
    constructor(github: GitHub, targetBranch: string, manifestFile?: string, configFile?: string, initialVersionString?: string);
    bootstrap(path: string, config: ReleaserConfig): Promise<PullRequest>;
    buildPullRequest(path: string, config: ReleaserConfig): Promise<BootstrapPullRequest>;
}
export {};
