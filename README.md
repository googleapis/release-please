<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [Release Please](https://github.com/googleapis/release-please)

[![npm version](https://img.shields.io/npm/v/release-please.svg)](https://www.npmjs.org/package/release-please)
[![codecov](https://img.shields.io/codecov/c/github/googleapis/release-please/master.svg?style=flat)](https://codecov.io/gh/googleapis/release-please)

Release Please automates CHANGELOG generation, the creation of GitHub releases,
and version bumps for your projects.

It does so by parsing your
git history, looking for [Conventional Commit messages](https://www.conventionalcommits.org/),
and creating release PRs.

## What's a Release PR?

Rather than continuously releasing what's landed to your default branch,
release-please maintains Release PRs:

<img width="400" src="/screen.png">

These Release PRs are kept up-to-date as additional work is merged. When you're
ready to tag a release, simply merge the release PR. Both squash-merge and
merge commits work with Release PRs.

When the Release PR is merged, release-please takes the following steps:

1. Updates your changelog file (for example `CHANGELOG.md`), along with other language specific files (for example `package.json`).
2. Tags the commit with the version number
3. Creates a GitHub Release based on the tag

You can tell where the Release PR is its lifecycle by the status label on the
PR itself:

- `autorelease:pending` is the initial state of the Release PR before it is merged
- `autorelease:tagged` means that the Release PR has been merged and the release has been tagged in GitHub
- `autorelease:published` means that a GitHub release has been published based on the Release PR (_release-please does not automatically add this tag, but we recommend it as a convention for publication tooling_).

## How should I write my commits?

Release Please assumes you are using [Conventional Commit messages](https://www.conventionalcommits.org/).

The most important prefixes you should have in mind are:

* `fix:` which represents bug fixes, and correlates to a [SemVer](https://semver.org/)
  patch.
* `feat:` which represents a new feature, and correlates to a SemVer minor.
* `feat!:`,  or `fix!:`, `refactor!:`, etc., which represent a breaking change
  (indicated by the `!`) and will result in a SemVer major.

### What if my PR contains multiple fixes or features?

Release Please allows you to represent multiple changes in a single commit,
using footers:

```txt
feat: adds v4 UUID to crypto

This adds support for v4 UUIDs to the library.

fix(utils): unicode no longer throws exception
  PiperOrigin-RevId: 345559154
  BREAKING-CHANGE: encode method no longer throws.
  Source-Link: googleapis/googleapis@5e0dcb2

feat(utils): update encode to support unicode
  PiperOrigin-RevId: 345559182
  Source-Link: googleapis/googleapis@e5eef86
```

The above commit message will contain:

1. an entry for the **"adds v4 UUID to crypto"** feature.
2. an entry for the fix **"unicode no longer throws exception"**, along with a note
  that it's a breaking change.
3. an entry for the feature **"update encode to support unicode"**.

## How do I change the version number?

When a commit to the main branch has `Release-As: x.x.x`(case insensitive) in the **commit body**, Release Please will open a new pull request for the specified version.

**Empty commit example:**

`git commit --allow-empty -m "chore: release 2.0.0" -m "Release-As: 2.0.0"` results in the following commit message:

```txt
chore: release 2.0.0

Release-As: 2.0.0
```

## Release types supported

Release Please automates releases for the following flavors of repositories:

| release type            | description
|-------------------|---------------------------------------------------------|
| node              | [A Node.js repository, with a package.json and CHANGELOG.md](https://github.com/yargs/yargs) |
| python            | [A Python repository, with a setup.py, setup.cfg, and CHANGELOG.md](https://github.com/googleapis/python-storage) |
| terraform-module  | [A terraform module, with a version in the README.md, and a CHANGELOG.md](https://github.com/terraform-google-modules/terraform-google-project-factory) |
| rust              | A Rust repository, with a Cargo.toml (either as a crate or workspace) and a CHANGELOG.md |
| ocaml             | [An OCaml repository, containing 1 or more opam or esy files and a CHANGELOG.md](https://github.com/grain-lang/binaryen.ml) |
| simple            | [A repository with a version.txt and a CHANGELOG.md](https://github.com/googleapis/gapic-generator) |
| helm              | A repository with a Chart.yaml and a CHANGELOG.md |

## Adding additional release types

To add a new release type, simply use the existing [releasers](https://github.com/googleapis/release-please/tree/master/src/releasers) and [updaters](https://github.com/googleapis/release-please/tree/master/src/updaters)
as a starting point.

**releasers** describe the files that should be updated for a release.

**updaters** describe how to update the version in these files.

## Setting up Release Please

There are a variety of ways you can deploy release-please: 

### GitHub Action (recommended)

The easiest way to run release please is as a GitHub action:

1. If you haven't already done so, create a `.github/workflows` folder in your
  repository (_this is where your actions will live_).
2. Now create a `.github/workflows/release-please.yml` file with these contents:

   ```yaml
    on:
      push:
        branches:
          - master
    name: release-please
    jobs:
      release-please:
        runs-on: ubuntu-latest
        steps:
          - uses: GoogleCloudPlatform/release-please-action@v2
            with:
              token: ${{ secrets.GITHUB_TOKEN }}
              release-type: node
              package-name: release-please-action
    ```

3. Merge the above action into your repository and make sure new commits follow
  the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  convention, [release-please](https://github.com/googleapis/release-please)
  will start creating Release PRs for you.

#### Automating publication to npm

With a few additions, the Release Please action can be made to publish to
npm when a Release PR is merged:

```yaml
on:
  push:
    branches:
      - master
name: release-please
jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: GoogleCloudPlatform/release-please-action@v2
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          release-type: node
          package-name: test-release-please
      # The logic below handles the npm publication:
      - uses: actions/checkout@v2
        # these if statements ensure that a publication only occurs when
        # a new release is created:
        if: ${{ steps.release.outputs.release_created }}
      - uses: actions/setup-node@v1
        with:
          node-version: 12
          registry-url: 'https://registry.npmjs.org'
        if: ${{ steps.release.outputs.release_created }}
      # if you are using Yarn, substitute the command below with `yarn install --frozen-lockfile`
      - run: npm ci
        if: ${{ steps.release.outputs.release_created }}
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
        if: ${{ steps.release.outputs.release_created }}
```

> So that you can keep 2FA enabled for npm publications, we recommend setting
`registry-url` to your own [Wombat Dressing Room](https://github.com/GoogleCloudPlatform/wombat-dressing-room) deployment.

### Running as CLI

Install release-please globally:

```bash
npm i release-please -g
```

### Creating/updating release PRs

```bash
release-please release-pr --package-name=@google-cloud/firestore" \
  --repo-url=googleapis/nodejs-firestore \
  --token=$GITHUB_TOKEN
```

| option            | description                                             |
|-------------------|---------------------------------------------------------|
| `--package-name`  | is the name of the package to publish to publish to an upstream registry such as npm. |
| `--repo-url`      | is the URL of the repository on GitHub.                 |
| `--token`         | a token with write access to `--repo-url`.              |
| `--default-branch`| branch to open pull release PR against (detected by default). |
| `--path`          | create a release from a path other than the repository's root |
| `--monorepo-tags` | add prefix to tags and branches, allowing multiple libraries to be released from the same repository. |
| `--pull-request-title-pattern` | add title pattern to make release PR, defaults to using `chore${scope}: release${component} ${version}`. |

### Creating a release on GitHub

```bash
release-please github-release --repo-url=googleapis/nodejs-firestore \
  --token=$GITHUB_TOKEN
```

| option            | description                                             |
|-------------------|---------------------------------------------------------|
| `--package-name`  | is the name of the package to publish to publish to  an upstream registry such as npm. |
| `--repo-url`      | is the URL of the repository on GitHub.                 |
| `--token`         | a token with write access to `--repo-url`.              |
| `--path`          | create a release from a path other than the repository's root |

### Running as a GitHub App

There is a probot application available, which allows you to deploy Release
Please as a GitHub App:

* [github.com/googleapis/repo-automation-bots](https://github.com/googleapis/repo-automation-bots/tree/master/packages/release-please).

## Supported Node.js Versions

Our client libraries follow the [Node.js release schedule](https://nodejs.org/en/about/releases/).
Libraries are compatible with all current _active_ and _maintenance_ versions of
Node.js.

Client libraries targeting some end-of-life versions of Node.js are available, and
can be installed via npm [dist-tags](https://docs.npmjs.com/cli/dist-tag).
The dist-tags follow the naming convention `legacy-(version)`.

_Legacy Node.js versions are supported as a best effort:_

* Legacy versions will not be tested in continuous integration.
* Some security patches may not be able to be backported.
* Dependencies will not be kept up-to-date, and features will not be backported.

#### Legacy tags available

* `legacy-8`: install client libraries from this dist-tag for versions
  compatible with Node.js 8.

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/googleapis/release-please/blob/master/CONTRIBUTING.md).

Please note that this `README.md`, the `samples/README.md`,
and a variety of configuration files in this repository (including `.nycrc` and `tsconfig.json`)
are generated from a central template. To edit one of these files, make an edit
to its template in this
[directory](https://github.com/googleapis/synthtool/tree/master/synthtool/gcp/templates/node_library).

## License

Apache Version 2.0

See [LICENSE](https://github.com/googleapis/release-please/blob/master/LICENSE)
