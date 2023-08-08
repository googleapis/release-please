import { Version, VersionsMap } from '../../version';
import { BaseXml } from '../base-xml';
/**
 * Updates version pom.xml files.
 *
 * If present it updates project.version element.
 * If project.version is not present, it updates project.parent.version.
 */
export declare class PomXml extends BaseXml {
    private readonly version;
    private readonly dependencyVersions?;
    constructor(version: Version, dependencyVersions?: VersionsMap);
    protected updateDocument(document: Document): boolean;
    dependencyUpdates(document: Document, updatedVersions: VersionsMap): {
        name: string;
        nodes: Node[];
        version: Version;
    }[];
    private static updateNodes;
}
interface DependencyNode {
    groupId: string;
    artifactId: string;
    version?: string;
    scope?: string;
    versionNode?: Node;
}
export declare function parseDependencyNode(node: Node): DependencyNode;
export {};
