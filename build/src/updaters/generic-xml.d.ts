import { Version } from '../version';
import { BaseXml } from './base-xml';
export declare class GenericXml extends BaseXml {
    private readonly xpath;
    private readonly version;
    constructor(xpath: string, version: Version);
    protected updateDocument(document: Document): boolean;
}
