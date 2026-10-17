// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  VersioningStrategy,
  MinorVersionUpdate,
  VersionUpdater,
  MajorVersionUpdate,
  PatchVersionUpdate,
  CustomVersionUpdate,
  NoVersionUpdate,
} from '../versioning-strategy';
import {ConventionalCommit} from '../commit';
import {Version} from '../version';
import {logger as defaultLogger, Logger} from '../util/logger';
import {ChangelogSection} from '../changelog-notes';

export interface DefaultVersioningStrategyOptions {
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;
  logger?: Logger;
  /**
   * The configured changelog sections, used to look up a per-type `bump`
   * override (see `ChangelogSection.bump`). Optional: when a commit's type
   * has no configured override (or this is unset entirely), that commit is
   * classified exactly as before -- feat bumps minor, a breaking change
   * bumps major, anything else bumps patch.
   */
  changelogSections?: ChangelogSection[];
}

/**
 * This is the default VersioningStrategy for release-please. Breaking
 * changes should bump the major, features should bump the minor, and other
 * significant changes should bump the patch version.
 */
export class DefaultVersioningStrategy implements VersioningStrategy {
  readonly bumpMinorPreMajor: boolean;
  readonly bumpPatchForMinorPreMajor: boolean;
  protected logger: Logger;
  private changelogSections?: ChangelogSection[];
  /**
   * Create a new DefaultVersioningStrategy
   * @param {DefaultVersioningStrategyOptions} options Configuration options
   * @param {boolean} options.bumpMinorPreMajor If the current version is less than 1.0.0,
   *   then bump the minor version for breaking changes
   * @param {boolean} options.bumpPatchForMinorPreMajor If the current version is less than
   *   1.0.0, then bump the patch version for features
   * @param {ChangelogSection[]} options.changelogSections Configured changelog sections,
   *   consulted for a per-type `bump` override
   */
  constructor(options: DefaultVersioningStrategyOptions = {}) {
    this.bumpMinorPreMajor = options.bumpMinorPreMajor === true;
    this.bumpPatchForMinorPreMajor = options.bumpPatchForMinorPreMajor === true;
    this.logger = options.logger ?? defaultLogger;
    this.changelogSections = options.changelogSections;
  }

  /**
   * Look up the configured `bump` override for a commit type, if any.
   *
   * @param {string} type The commit's conventional-commit type, e.g. "ci"
   * @returns {string|undefined} The configured override, or undefined when
   *   this type has no `changelog-sections` entry, or that entry has no
   *   `bump` field.
   */
  private bumpOverrideFor(type: string): ChangelogSection['bump'] | undefined {
    return this.changelogSections?.find(section => section.type === type)?.bump;
  }

  /**
   * Given the current version of an artifact and a list of commits,
   * return a VersionUpdater that knows how to bump the version.
   *
   * This is useful for chaining together versioning strategies.
   *
   * @param {Version} version The current version
   * @param {ConventionalCommit[]} commits The list of commits to consider
   * @returns {VersionUpdater} Updater for bumping the next version.
   */
  determineReleaseType(
    version: Version,
    commits: ConventionalCommit[]
  ): VersionUpdater {
    // iterate through list of commits and find biggest commit type
    let breaking = 0;
    let features = 0;
    let patches = 0;
    let excluded = 0;
    for (const commit of commits) {
      const releaseAs = commit.notes.find(note => note.title === 'RELEASE AS');
      if (releaseAs) {
        // commits are handled newest to oldest, so take the first one (newest) found
        this.logger.debug(
          `found Release-As: ${releaseAs.text}, forcing version`
        );
        return new CustomVersionUpdate(
          Version.parse(releaseAs.text).toString()
        );
      }

      // A configured `bump` override on this commit's changelog-sections
      // entry takes precedence over the default feat/breaking/patch
      // classification below. Unset (the default for every built-in type,
      // and for any type without a changelog-sections entry at all) falls
      // straight through to that same default classification, so a repo
      // that never sets `bump` sees no change in behavior.
      const bumpOverride = this.bumpOverrideFor(commit.type);
      if (bumpOverride === 'none') {
        // Configured to never affect the version, e.g. a lone `ci:` commit
        // under Conventional Commits, which reserves version bumps for
        // feat/fix/breaking. Still eligible below for BREAKING CHANGE/! or a
        // Release-As footer -- opting a type out of its default bump does
        // not opt it out of an explicit breaking change it happens to carry.
        if (commit.breaking) {
          breaking++;
        } else {
          excluded++;
        }
        continue;
      }
      if (
        commit.breaking ||
        bumpOverride === 'major' ||
        bumpOverride === 'breaking'
      ) {
        breaking++;
      } else if (
        commit.type === 'feat' ||
        commit.type === 'feature' ||
        bumpOverride === 'minor'
      ) {
        features++;
      } else {
        patches++;
      }
    }

    if (breaking > 0) {
      if (version.isPreMajor && this.bumpMinorPreMajor) {
        return new MinorVersionUpdate();
      } else {
        return new MajorVersionUpdate();
      }
    } else if (features > 0) {
      if (version.isPreMajor && this.bumpPatchForMinorPreMajor) {
        return new PatchVersionUpdate();
      } else {
        return new MinorVersionUpdate();
      }
    } else if (patches > 0) {
      return new PatchVersionUpdate();
    } else if (excluded > 0) {
      // At least one commit was considered and explicitly excluded via
      // `bump: "none"`, and nothing else present (no breaking change, no
      // feat, no unconfigured/default-classified commit either) warrants a
      // release -- unlike the empty-commits case below, this is a real,
      // deliberate "nothing to release" rather than the absence of input.
      return new NoVersionUpdate();
    }
    // No commits were considered at all (e.g. a caller intentionally
    // forcing a version bump with an empty commit list, such as a
    // workspace/monorepo plugin propagating a dependency update). Preserve
    // the historical unconditional patch bump here -- only an explicit
    // `bump: "none"` (handled above) opts a *commit* out of this default.
    return new PatchVersionUpdate();
  }

  /**
   * Given the current version of an artifact and a list of commits,
   * return the next version.
   *
   * @param {Version} version The current version
   * @param {ConventionalCommit[]} commits The list of commits to consider
   * @returns {Version} The next version
   */
  bump(version: Version, commits: ConventionalCommit[]): Version {
    return this.determineReleaseType(version, commits).bump(version);
  }
}
