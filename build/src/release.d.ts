import { TagName } from './util/tag-name';
export interface Release {
    readonly name?: string;
    readonly tag: TagName;
    readonly sha: string;
    readonly notes: string;
}
