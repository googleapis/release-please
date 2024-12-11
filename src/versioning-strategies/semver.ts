import * as semver from 'semver';
import {Version} from '../version';
import {VersionUpdater} from '../versioning-strategy';

interface Commit {
  type: string;
  breaking: boolean;
}

const inc = (version: string, type: semver.ReleaseType, _tag?: string) => {
  const parsed = new semver.SemVer(version);
  const implicitTag =
    parsed.prerelease.length > 1 ? parsed.prerelease[0]?.toString() : undefined;
  const tag = _tag || implicitTag;
  const next = new semver.SemVer(version).inc(type, tag);
  const isFreshMajor = parsed.minor === 0 && parsed.patch === 0;
  const isFreshMinor = parsed.patch === 0;
  if (
    parsed.prerelease.length &&
    next.prerelease.length &&
    ((type === 'premajor' && isFreshMajor) ||
      (type === 'preminor' && isFreshMinor) ||
      type === 'prepatch')
  ) {
    return semver.inc(version, 'prerelease', tag);
  }
  return semver.inc(version, type, tag);
};

const parseCommits = (commits: Commit[]) => {
  let release: semver.ReleaseType = 'patch';
  for (const commit of commits) {
    if (commit.breaking) {
      release = 'major';
      break;
    } else if (['feat', 'feature'].includes(commit.type)) {
      release = 'minor';
    }
  }
  return release;
};

class SemverVersioningStrategy {
  options: {prerelease?: boolean; prereleaseType?: string};

  constructor(options: {prerelease?: boolean; prereleaseType?: string}) {
    this.options = options;
  }

  determineReleaseType(_version: Version, _commits: Commit[]): VersionUpdater {
    const options = this.options;
    class Shell implements VersionUpdater {
      bump(_version: Version) {
        return new SemverVersioningStrategy(options).bump(_version, _commits);
      }
    }
    return new Shell();
  }

  bump(currentVersion: Version, commits: Commit[]): Version {
    const prerelease = this.options.prerelease;
    const tag = this.options.prereleaseType;
    const releaseType = parseCommits(commits);
    const addPreIfNeeded: semver.ReleaseType = prerelease
      ? `pre${releaseType}`
      : releaseType;
    const version = inc(currentVersion.toString(), addPreIfNeeded, tag);
    if (!version) {
      throw new Error('Could not bump version');
    }
    return Version.parse(version);
  }
}

export {SemverVersioningStrategy};
