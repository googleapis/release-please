import {describe, it} from 'mocha';
import {SemverVersioningStrategy} from '../../src/versioning-strategies/semver';
import {ConventionalCommit} from '../../src';
import {Version} from '../../src/version';
import {expect} from 'chai';

const commit: ConventionalCommit = {
  type: 'chore',
  breaking: false,
  notes: [],
  references: [],
  scope: '',
  bareMessage: '',
  sha: '',
  message: '',
};

const g = (v: Partial<ConventionalCommit>) => ({...commit, ...v});

const COMMITS = {
  major: [{type: 'feat'}, {}, {}, {breaking: true}].map(g),
  minor: [{}, {}, {type: 'feat'}].map(g),
  patch: [{}, {type: 'chore'}, {type: 'fix'}].map(g),
};

const checks = [
  // Normal releases
  ['2.0.0', 'major', false, undefined, '3.0.0'],
  ['2.0.0', 'minor', false, undefined, '2.1.0'],
  ['2.0.0', 'patch', false, undefined, '2.0.1'],
  // premajor -> normal
  ['2.0.0-pre.1', 'major', false, undefined, '2.0.0'],
  ['2.0.0-pre.5', 'minor', false, undefined, '2.0.0'],
  ['2.0.0-pre.4', 'patch', false, undefined, '2.0.0'],
  // preminor -> normal
  ['2.1.0-pre.1', 'major', false, undefined, '3.0.0'],
  ['2.1.0-pre.5', 'minor', false, undefined, '2.1.0'],
  ['2.1.0-pre.4', 'patch', false, undefined, '2.1.0'],
  // prepatch -> normal
  ['2.0.1-pre.1', 'major', false, undefined, '3.0.0'],
  ['2.0.1-pre.5', 'minor', false, undefined, '2.1.0'],
  ['2.0.1-pre.4', 'patch', false, undefined, '2.0.1'],
  // Prereleases
  ['2.0.0', 'major', true, 'pre', '3.0.0-pre.0'],
  ['2.0.0', 'minor', true, 'pre', '2.1.0-pre.0'],
  ['2.0.0', 'patch', true, 'pre', '2.0.1-pre.0'],
  // premajor - prereleases
  ['2.0.0-pre.1', 'major', true, undefined, '2.0.0-pre.2'],
  ['2.0.0-pre.1', 'minor', true, undefined, '2.0.0-pre.2'],
  ['2.0.0-pre.1', 'patch', true, undefined, '2.0.0-pre.2'],
  // preminor - prereleases
  ['2.1.0-pre.1', 'major', true, undefined, '3.0.0-pre.0'],
  ['2.1.0-pre.1', 'minor', true, undefined, '2.1.0-pre.2'],
  ['2.1.0-pre.1', 'patch', true, undefined, '2.1.0-pre.2'],
  // prepatch - prereleases
  ['2.0.1-pre.1', 'major', true, undefined, '3.0.0-pre.0'],
  ['2.0.1-pre.1', 'minor', true, undefined, '2.1.0-pre.0'],
  ['2.0.1-pre.1', 'patch', true, undefined, '2.0.1-pre.2'],
  // different prerelease identifiers
  ['2.0.0-beta.1', 'major', true, undefined, '2.0.0-beta.2'],
  ['2.0.0-alpha.1', 'major', true, undefined, '2.0.0-alpha.2'],
  ['2.0.0-rc.1', 'major', true, undefined, '2.0.0-rc.2'],
  ['2.0.0-0', 'major', true, undefined, '2.0.0-1'],
  // leaves prerelease
  ['2.0.0-beta.1', 'major', false, undefined, '2.0.0'],
  ['2.0.0-alpha.1', 'major', false, undefined, '2.0.0'],
  ['2.0.0-rc.1', 'major', false, undefined, '2.0.0'],
  ['2.0.0-0', 'major', false, undefined, '2.0.0'],
] satisfies [
  string,
  keyof typeof COMMITS,
  boolean,
  string | undefined,
  string
][];

describe('SemverVersioningStrategy', () => {
  for (const [
    version,
    commits,
    prerelease,
    prereleaseType,
    expected,
  ] of checks) {
    const name = [version, commits, prerelease, prereleaseType, expected];
    const id = name
      .map(v => (typeof v === 'undefined' ? 'undefined' : v))
      .join(',');
    it(`${id}`, () => {
      const r = new SemverVersioningStrategy({prerelease, prereleaseType}).bump(
        Version.parse(version),
        COMMITS[commits]
      );
      expect(
        `${r.major}.${r.minor}.${r.patch}${
          r.preRelease ? `-${r.preRelease}` : ''
        }`
      ).to.equal(expected, id);
    });
  }
});
