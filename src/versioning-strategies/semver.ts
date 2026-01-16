import * as semver from 'semver';
import {Version} from '../version';
import {VersionUpdater} from '../versioning-strategy';
import {ConventionalCommit} from '../commit';

const inc = (version: string, release: semver.ReleaseType, _preid?: string) => {
  const parsed = new semver.SemVer(version);
  const implicitPreid =
    parsed.prerelease.length > 1 ? parsed.prerelease[0]?.toString() : undefined;
  const preid = _preid || implicitPreid;
  const next = new semver.SemVer(version).inc(release, preid);
  if (!parsed.prerelease.length) {
    return next.format();
  }
  const isFreshMajor = parsed.minor === 0 && parsed.patch === 0;
  const isFreshMinor = parsed.patch === 0;
  const shouldPrerelease =
    (release === 'premajor' && isFreshMajor) ||
    (release === 'preminor' && isFreshMinor) ||
    release === 'prepatch';
  if (shouldPrerelease) {
    return semver.inc(version, 'prerelease', preid);
  }
  return next.format();
};

const parseCommits = (commits: ConventionalCommit[]) => {
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

type SemverOptions = {prerelease?: boolean; prereleaseType?: string};

class SemverVersioningStrategyNested {
  constructor(
    public options: SemverOptions,
    public version: Version,
    public commits: ConventionalCommit[]
  ) {}

  bump() {
    return new SemverVersioningStrategy(this.options).bump(
      this.version,
      this.commits
    );
  }
}

class SemverVersioningStrategy {
  options: SemverOptions;

  constructor(options: {prerelease?: boolean; prereleaseType?: string}) {
    this.options = options;
  }

  determineReleaseType(
    version: Version,
    commits: ConventionalCommit[]
  ): VersionUpdater {
    return new SemverVersioningStrategyNested(this.options, version, commits);
  }

  bump(currentVersion: Version, commits: ConventionalCommit[]): Version {
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
