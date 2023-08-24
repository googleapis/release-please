# Feature Request: Support Pre-Release Versions

## Problem

It is not uncommon for projects to provide "pre-release" versions with experimental or in-development functionality.  For example, the `uuidjs` project has an ["rfc4122bis" branch](https://github.com/uuidjs/uuid/pull/681) for the new UUID formats.  Rather than releasing this new feature set on the main version track ("`9.0.x`"), the team would like to release this on a "pre-release" track using versions like "`9.0.x-bis.x`".

`release-please` does not currently support this.  When bumping the version in a repo, pre-release suffixes get dropped.

## Solution

To solve the above, it's proposed that release-please change how versions are bumped, based on the existing [`prerelease`](https://github.com/google-github-actions/release-please-action#configuration) option.  Specifically, if `prerelease` is true, the behavior should be as follows:

1. Require `version` (the current release version string) to have a valid "prerelease version".  Per  [the semver specification](https://semver.org/#spec-item-9):
>  A pre-release version MAY be denoted by appending a hyphen and a series of dot separated identifiers immediately following the patch version.
I.e. `version` must contain a hyphen followed by at least one identifier.
2. Split `version` at the first hyphen ("-"), creating `normalVersion` (left side), and `prereleaseVersion` (right side).
2. Leave `normalVersion` unchanged.
3. Locate the _right-most numeric field_ in  `prereleaseVersion` and increment it by `1`.
4. If `prereleaseVersion` does not contain a numeric field, create one by appending "`.1`".
5. Create a the new version by concatenating `normalVersion`, `"-"`, and the bumped `prereleaseVersion` string.

**Examples**:
| version | bumped-version |
|---|---|
| 1.0.0-alpha | 1.0.0-alpha.1 |
| 1.0.0-alpha.1 | 1.0.0-alpha.2 |
| 1.0.0-alpha.1.omega | 1.0.0-alpha.2.omega |
| 1.0.0-0.3.7 | 1.0.0-0.3.8 |
| 1.0.0-x.7.z.92 | 1.0.0-x.7.z.93 |

### Rational for "rightmost-number bump" logic

The SemVer spec does not go into detail about the semantics of prerelease strings, other than to say they should not take precedence over normal versions:

> Pre-release versions have a lower precedence than the associated normal version

Without further guidance on how prerelease strings should be interpreted, there isn't really a good alternative to just increasing the right-most number... right?