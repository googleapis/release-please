import { Java, JavaBuildUpdatesOption } from './java';
import { Update } from '../update';
/**
 * Strategy for Maven projects. It generates SNAPSHOT version after each release, and updates all found
 * pom.xml files automatically.
 */
export declare class Maven extends Java {
    protected buildUpdates(options: JavaBuildUpdatesOption): Promise<Update[]>;
}
