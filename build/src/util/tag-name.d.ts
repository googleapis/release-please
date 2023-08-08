import { Version } from '../version';
export declare class TagName {
    component?: string;
    version: Version;
    separator: string;
    includeV: boolean;
    constructor(version: Version, component?: string, separator?: string, includeV?: boolean);
    static parse(tagName: string): TagName | undefined;
    toString(): string;
}
