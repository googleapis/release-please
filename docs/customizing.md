# Customizing Releases

release-please provides several configuration options to allow customizing
your release process.

## Strategy (Language) types supported

Release Please automates releases for the following flavors of repositories:

| release type            | description
|-------------------|---------------------------------------------------------|
| `dart`              | A repository with a pubspec.yaml and a CHANGELOG.md |
| `elixir`            | A repository with a mix.exs and a CHANGELOG.md |
| `go`                | A repository with a CHANGELOG.md |
| `helm`              | A repository with a Chart.yaml and a CHANGELOG.md |
| `krm-blueprint`     | [A kpt package, with 1 or more KRM files and a CHANGELOG.md](https://github.com/GoogleCloudPlatform/blueprints/tree/main/catalog/project) |
| `node`              | [A Node.js repository, with a package.json and CHANGELOG.md](https://github.com/yargs/yargs) |
| `ocaml`             | [An OCaml repository, containing 1 or more opam or esy files and a CHANGELOG.md](https://github.com/grain-lang/binaryen.ml) |
| `php`               | A repository with a composer.json and a CHANGELOG.md |
| `python`            | [A Python repository, with a setup.py, setup.cfg, CHANGELOG.md](https://github.com/googleapis/python-storage) and optionally a pyproject.toml and a &lt;project&gt;/\_\_init\_\_.py |
| `ruby`              | A repository with a version.rb and a CHANGELOG.md |
| `rust`              | A Rust repository, with a Cargo.toml (either as a crate or workspace) and a CHANGELOG.md |
| `simple`            | [A repository with a version.txt and a CHANGELOG.md](https://github.com/googleapis/gapic-generator) |
| `terraform-module`  | [A terraform module, with a version in the README.md, and a CHANGELOG.md](https://github.com/terraform-google-modules/terraform-google-project-factory) |

### Adding additional strategy types

To add a new release type, simply use the existing [strategies](https://github.com/googleapis/release-please/tree/main/src/strategies) and [updaters](https://github.com/googleapis/release-please/tree/main/src/updaters)
as a starting point.

## Versioning Strategies

A versioning strategy's job is to determine how to increment a SemVer
version given a list of parsed commits.

| Versioning Strategy | Description |
| ------------------- | ----------- |
| `default` | Breaking changes bump the major version, features bump the minor version, bugfixes bump the patch version |
| `always-bump-patch` | Always bump patch version. This is useful for backporting bugfixes to previous major/minor release branches |
| `service-pack` | Designed for Java backport fixes. Uses Maven's specification for service pack versions (e.g. 1.2.3-sp.1) |

### Adding additional versioning strategy types

To add a new versiong strategy, create a new class that implements the
[`VersioningStrategy` interface](/src/versioning-strategy.ts).

## Changelog Types

A changelog type's job is to build the CHANGELOG notes given a list
of parsed commits.

| Changelog Type | Description |
| -------------- | ----------- |
| `default` | Default CHANGELOG notes builder. Groups by commit type and links to pull requests and commits |
| `github` | Uses the GitHub API to generate notes |

### Adding additional changelog types

To add a new changelog type, create a new class that implements the
[`ChangelogNotes` interface](/src/changelog-notes.ts).

## Pull Requests

### Opening as a draft pull request

If you would like to open the release pull request as a draft, you can
use the `--draft-pull-request` CLI flag or the `draft-pull-request` option
in the manifest configuration.

### Pull Request Title

If you would like to customize the pull request title, you can use the
`--pull-request-title-pattern` CLI option of the `pull-request-title-pattern`
option in the manifest configuration.

The pattern uses string replacement and regular expressions to build and
parse the pull request title. Note that we must be able to parse out the
component and version from the pull request (either via the pull request
title or body format).

The default pull request title uses this pattern:
`chore${scope}: release${component} ${version}` so a common release pull
request title would be `chore(main): release foo-bar v1.2.3`.

| Pattern | Description |
| ------- | ----------- |
| `${scope}` | This pattern is used for specifying the conventional commit scope (e.g. `chore(scope): some message`). We expect that the target branch name is used for the scope value |
| `${component}` | The name of the component being released |
| `${vesrion}` | The version of the component being released |
| `${branch?}` | The target branch of the pull request. If you have multiple release branches, this helps identify which release branch we are working on |

## Release Lifecycle Labels

By default, we open release pull requests with the `autorelease: pending`
label. This label along with the branch name of the release pull request
helps us identify merged release pull requests that need to be tagged with a
release.

After we have tagged the release, we remove the `autorelease: pending` label
and add the `autorelease: tagged` label.

You can customize the "pending" pull request label(s) via the `--label` CLI
option or the `label` option in the manifest configuration.

You can customize the "tagged" pull request label(s) via the
`--release-label` CLI option or the `release-label` option in the manifest
configuration.
