import { BuildUpdatesOptions } from './base';
import { Node } from './node';
import { Update } from '../update';
import { Version } from '../version';
/**
 * Strategy for building Expo based React Native projects. This strategy extends
 * the Node strategy to additionally update the `app.json` file of a project.
 */
export declare class Expo extends Node {
    protected buildUpdates(options: BuildUpdatesOptions): Promise<Update[]>;
    /**
     * Determine the Expo SDK version by parsing the package.json dependencies.
     */
    getExpoSDKVersion(): Promise<Version>;
}
