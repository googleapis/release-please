import { Logger } from './logger';
import { Version } from '../version';
interface PullRequestBodyOptions {
    header?: string;
    footer?: string;
    extra?: string;
    useComponents?: boolean;
}
export declare class PullRequestBody {
    header: string;
    footer: string;
    extra?: string;
    releaseData: ReleaseData[];
    useComponents: boolean;
    constructor(releaseData: ReleaseData[], options?: PullRequestBodyOptions);
    static parse(body: string, logger?: Logger): PullRequestBody | undefined;
    notes(): string;
    toString(): string;
}
export interface ReleaseData {
    component?: string;
    version?: Version;
    notes: string;
}
export {};
