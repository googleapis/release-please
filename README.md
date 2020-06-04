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
ready to tag a release, simply merge the release PR.

## How should I write my commits?

Release Please assumes you are using [Conventional Commit messages](https://www.conventionalcommits.org/).

The most important prefixes you should have in mind are:

* `fix:` which represents bug fixes, and correlates to a [SemVer](https://semver.org/) 
  patch.
* `feat:` which represents a new feature, and correlates to a SemVer minor.
* `feat!:`,  or `fix!:`, `refactor!:`, etc., which represent a breaking change
  (indicated by the `!`) and will result in a SemVer major.

## Release types supported

Release Please automates releases for the following flavors of repositories:

| release type            | description
|-------------------|---------------------------------------------------------|
| node              | [A Node.js repository, with a package.json and CHANGELOG.md](https://github.com/yargs/yargs) |
| python            | [A Python repository, with a setup.py, setup.cfg, and CHANGELOG.md](https://github.com/googleapis/java-storage) |
| terraform-module  | [A terraform module, with a version in the README.md, and a CHANGELOG.md](https://github.com/terraform-google-modules/terraform-google-project-factory) |
| simple            | [A repository with a version.txt and a CHANGELOG.md](https://github.com/googleapis/gapic-generator) |

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
          - uses: bcoe/release-please-action@v1.0.1
            with:
              token: ${{ secrets.GITHUB_TOKEN }}
              release-type: node
              package-name: release-please-action
    ```

3. Merge the above action into your repository and make sure new commits follow
  the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  convention, [release-please](https://github.com/googleapis/release-please)
  will start creating Release PRs for you.

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
| `--package-name`  | is the name of the package to publish to publish to  an upstream registry such as npm. |
| `--repo-url`      | is the URL of the repository on GitHub.                 |
| `--token`         | a token with write access to `--repo-url`.              |

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
