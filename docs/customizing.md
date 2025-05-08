# Customizing Releases

release-please provides several configuration options to allow customizing
your release process.

## Strategy (Language) types supported

Release Please automates releases for the following flavors of repositories:

| release type        | description |
|---------------------|---------------------------------------------------------|
| `dart`              | A repository with a pubspec.yaml and a CHANGELOG.md |
| `elixir`            | A repository with a mix.exs and a CHANGELOG.md |
| `go`                | A repository with a CHANGELOG.md |
| `helm`              | A repository with a Chart.yaml and a CHANGELOG.md |
| `java`              | [A strategy that generates SNAPSHOT version after each release](java.md) |
| `krm-blueprint`     | [A kpt package, with 1 or more KRM files and a CHANGELOG.md](https://github.com/GoogleCloudPlatform/blueprints/tree/main/catalog/project) |
| `maven`             | [Strategy for Maven projects, generates SNAPSHOT version after each release and updates `pom.xml` automatically](java.md) |
| `node`              | [A Node.js repository, with a package.json and CHANGELOG.md](https://github.com/yargs/yargs) |
| `expo`              | [An Expo based React Native repository, with a package.json, app.json and CHANGELOG.md](https://github.com/yargs/yargs) |
| `ocaml`             | [An OCaml repository, containing 1 or more opam or esy files and a CHANGELOG.md](https://github.com/grain-lang/binaryen.ml) |
| `php`               | A repository with a composer.json and a CHANGELOG.md |
| `python`            | [A Python repository, with a setup.py, setup.cfg, CHANGELOG.md](https://github.com/googleapis/python-storage) and optionally a pyproject.toml and a &lt;project&gt;/\_\_init\_\_.py |
| `ruby`              | A repository with a version.rb and a CHANGELOG.md |
| `rust`              | A Rust repository, with a Cargo.toml (either as a crate or workspace) and a CHANGELOG.md |
| `sfdx`              | A repository with a [sfdx-project.json](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm) and a CHANGELOG.md |
| `simple`            | [A repository with a version.txt and a CHANGELOG.md](https://github.com/googleapis/gapic-generator) |
| `terraform-module`  | [A terraform module, with a version in the README.md, and a CHANGELOG.md](https://github.com/terraform-google-modules/terraform-google-project-factory) |

### Adding additional strategy types

To add a new release type, simply use the existing [strategies](https://github.com/googleapis/release-please/tree/main/src/strategies) and [updaters](https://github.com/googleapis/release-please/tree/main/src/updaters)
as a starting point.

## Versioning Strategies

A versioning strategy's job is to determine how to increment a SemVer
version given a list of parsed commits.

| Versioning Strategy | Description                                                                                                 |
|---------------------|-------------------------------------------------------------------------------------------------------------|
| `default`           | Breaking changes bump the major version, features bump the minor version, bugfixes bump the patch version   |
| `always-bump-patch` | Always bump patch version. This is useful for backporting bugfixes to previous major/minor release branches |
| `always-bump-minor` | Always bump minor version |                                                                                                                                                                    |
| `always-bump-major` | Always bump major version |                                                                                  
| `service-pack`      | Designed for Java backport fixes. Uses Maven's specification for service pack versions (e.g. 1.2.3-sp.1)    |
| `prerelease`      | Bumping prerelease number (eg. 1.2.0-beta01 to 1.2.0-beta02) or if prerelease type is set, using that in the prerelease part (eg. 1.2.1 to 1.3.0-beta)  |

### Adding additional versioning strategy types

To add a new versioning strategy, create a new class that implements the
[`VersioningStrategy` interface](/src/versioning-strategy.ts).

## Subdirectories (paths) in a repository

Release Please can operate on a subdirectory of a repository. If you configure a `path`,
Release Please will only consider commits that touch files on that path. The format of the
`path` configuration option should be a simple path segment (`.`, `..`, etc are not allowed)
relative to the repository root.

To configure multiple components on different paths, configure a
[manifest release](/docs/manifest-releaser.md).

## Changelog Types

A changelog type's job is to build the CHANGELOG notes given a list
of parsed commits. This generated content is used in the release pull request body
and in release notes. By replacing the implementation, you can control how your
release notes appear.

| Changelog Type | Description |
| -------------- | ----------- |
| `default` | Default CHANGELOG notes builder. Groups by commit type and links to pull requests and commits |
| `github` | Uses the [GitHub API][release-notes-api] to generate notes |

[release-notes-api]: https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#generate-release-notes-content-for-a-release

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
`--pull-request-title-pattern` CLI option or the `pull-request-title-pattern`
option in the manifest configuration.

The pattern uses string replacement and regular expressions to build and
parse the pull request title. Note that we must be able to parse out the
component and version from the pull request (either via the pull request
title or body format).

The default pull request title uses this pattern:
`chore${scope}: release${component} ${version}` so a common release pull
request title would be `chore(main): release foo-bar v1.2.3`.  
Please note that by default `${component}` will be parsed to ` ${component}` (With space in front of). 
If you wish to avoid that, consider using `component-no-space: true`/`--component-no-space=true` parameter.

> [!WARNING]  
> Setting `component-no-space` option when release PR already exists might break the parsing
> resulting in another PR being opened.

| Pattern | Description |
| ------- | ----------- |
| `${scope}` | This pattern is used for specifying the conventional commit scope (e.g. `chore(scope): some message`). We expect that the target branch name is used for the scope value |
| `${component}` | The name of the component being released |
| `${version}` | The version of the component being released |
| `${branch?}` | The target branch of the pull request. If you have multiple release branches, this helps identify which release branch we are working on |

### Pull Request Header

If you would like to customize the pull request header, you can use the
`--pull-request-header` CLI option or the `pull-request-header`
option in the manifest configuration.

By default, the pull request header is:
`:robot: I have created a release *beep* *boop*`.

### Pull Request Footer

If you would like to customize the pull request footer, you can use the
`--pull-request-footer` CLI option or the `pull-request-footer`
option in the manifest configuration.

By default, the pull request footer is:
`This PR was generated with Release Please. See documentation.`.

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

## Updating arbitrary files

For most release strategies, you can provide additional files to update
using the [Generic](/src/updaters/generic.ts) updater. You can specify
a comma separated list of file paths with the `--extra-files` CLI option
or the `extra-files` option in the manifest configuration.

```json
{
  "extra-files": [
    "path/to/file.md"
  ]
}
```

To mark versions needing an update in those files, you will add annotations
(usually in comments).

You can annotate a line (inline) via:

* `x-release-please-version`
* `x-release-please-major`
* `x-release-please-minor`
* `x-release-please-patch`

For these annotations, we will try to replace the value on that line only.

You can annotate a block by starting with a line containing:

* `x-release-please-start-version`
* `x-release-please-start-major`
* `x-release-please-start-minor`
* `x-release-please-start-patch`

and close the block with a line containing `x-release-please-end`. Within
the block, we will attempt to replace version values.

Default updaters are applied depending on the file extension. If you want to
force the [Generic](/src/updaters/generic.ts) updater, you must use type
`"generic"`.

```json
{
  "extra-files": [
    {
      "type": "generic",
      "path": "path/to/file.yml"
    }
  ]
}
```

## Updating arbitrary JSON files

For files with the `.json` extension, the `version` property is updated.

For most release strategies, you can provide additional files to update
using the [GenericJson](/src/updaters/generic-json.ts) updater. You can
specify a configuration object in the `extra-files` option in the manifest
configuration.

```json
{
  "extra-files": [
    {
      "type": "json",
      "path": "path/to/file.json",
      "jsonpath": "$.json.path.to.field"
    }
  ]
}
```

[JSONPath](https://goessner.net/articles/JsonPath/) is a simple query syntax
for JSON that is similar to XPath for XML. The `jsonpath` configuration
informs release-please on which JSON field to update with the new version.

## Updating arbitrary XML files

For files with the `.xml` extension, the `version` element is updated.

For most release strategies, you can provide additional files to update
using the [GenericXml](/src/updaters/generic-xml.ts) updater. You can
specify a configuration object in the `extra-files` option in the manifest
configuration.

```json
{
  "extra-files": [
    {
      "type": "xml",
      "path": "path/to/file.xml",
      "xpath": "//xpath/to/field"
    }
  ]
}
```

## Updating arbitrary YAML files

For files with the `.yaml` or `.yml` extension, the `version` property is
updated.

For most release strategies, you can provide additional files to update
using the [GenericYaml](/src/updaters/generic-yaml.ts) updater. You can
specify a configuration object in the `extra-files` option in the manifest
configuration.

```json
{
  "extra-files": [
    {
      "type": "yaml",
      "path": "path/to/file.yaml",
      "jsonpath": "$.json.path.to.field"
    }
  ]
}
```

## Updating arbitrary TOML files

For files with the `.toml` extension, the `version` property is updated.

For most release strategies, you can provide additional files to update
using the [GenericToml](/src/updaters/generic-toml.ts) updater. You can
specify a configuration object in the `extra-files` option in the manifest
configuration.

```json
{
  "extra-files": [
    {
      "type": "toml",
      "path": "path/to/file.toml",
      "jsonpath": "$.json.path.to.field"
    }
  ]
}
```
