import { Version } from '../version';
import { ConventionalCommit } from '../commit';
import { DefaultVersioningStrategy } from './default';
import { VersionUpdater } from '../versioning-strategy';
/**
 * This VersioningStrategy looks at `deps` type commits and tries to
 * mirror the semantic version bump for that dependency update. For
 * example, an update to v2, would be treated as a major version bump.
 *
 * It also respects the default commit types and will pick the
 * greatest version bump.
 */
export declare class DependencyManifest extends DefaultVersioningStrategy {
    determineReleaseType(version: Version, commits: ConventionalCommit[]): VersionUpdater;
}
