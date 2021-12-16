# Running release-please CLI

Install release-please globally:

```bash
npm i release-please -g
```

## Global options

These options are available on all commands.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `--token` | string |REQUIRED. GitHub token with repo write permissions |
| `--repo-url` | string | REQUIRED. GitHub repository in the format of `<owner>/<repo>` |
| `--api-url` | string | Base URI for making REST API requests. Defaults to `https://api.github.com` |
| `--graphql-url` | string | Base URI for making GraphQL requests. Defaults to `https://api.github.com` |
| `--target-branch` | string |The branch to open release PRs against and tag releases on. Defaults to the default branch of the repository |
| `--dry-run` | boolean | If set, reports the activity that would happen without taking effect |
| `--debug` | boolean | If set, sets log level to >=DEBUG |
| `--trace` | boolean | If set, sets log level to >=TRACE |

## Bootstrapping a repository's manifest configuration

This command is used to generate the initial `release-please-config.json`
and `.release-please-manifest.json` files or update
them with additional configs.

It will open a pull request against the target branch with the new
configuration options.

```bash
release-please bootstrap \
  --token=$GITHUB_TOKEN \
  --repo-url=<owner>/<repo> \
  --release-type=<release-type> [extra options]
```

Extra options:

| Option | Type | Description |
| ------ | ---- | ----------- |
| `--config-file` | `string` | Override the path to the release-please config file. Defaults to `release-please-config.json` |
| `--manifest-file` | `string` | Override the path to the release-please manifest file. Defaults to `.release-please-manifest.json` |
| `--path` | `string` | Path for changes to consider part of this component's release. Defaults to `.` |
| `--package-name` | `string` | Name of the package being released. Defaults to a value determined by the configured release type |
| `--component` | `string` | Name of the component used for branch naming and release tagging. Defaults to a normalized version based on the package name |
| `--release-type` | [`ReleaseType`](/docs/customizing.md#strategy-language-types-supported) | Language strategy that determines which files to update |
| `--initial-version` | `string` | Version string to set as the last released version of this package. Defaults to `0.0.0` |
| `--versioning-strategy` | [`VersioningStrategyType`](/docs/customizing.md#versioning-strategies) | Override method of determining SemVer version bumps based on commits. Defaults to `default` |
| `--bump-minor-pre-major` | `boolean` | Configuration option for the versioning strategy. If set, will bump the minor version for breaking changes for versions < 1.0.0 |
| `--bump-patch-for-minor-pre-major` | `boolean` | Configuration option for the versioning strategy. If set, will bump the patch version for features for versions < 1.0.0 |
| `--draft` | `boolean` | If set, create releases as drafts |
| `--draft-pull-request` | `boolean` | If set, create pull requests as drafts |
| `--label` | `string` | Comma-separated list of labels to apply to the release pull requests. Defaults to `autorelease: pending` |
| `--release-label` | `string` | Comma-separated list of labels to apply to the pull request after the release has been tagged. Defaults to `autorelease: tagged` |
| `--changelog-path` | `string` | Override the path to the managed CHANGELOG. Defaults to `CHANGELOG.md` |
| `--changelog-type` | [`ChangelogType`](/docs/customizing.md#changelog-types) | Strategy for building the changelog contents. Defaults to `default` |
| `--pull-request-title-pattern` | `string` | Override the pull request title pattern. Defaults to `chore${scope}: release${component} ${version}` |
| `--extra-files` | `string[]` | Extra file paths for the release strategy to consider |
| `--version-file` | `string` | Ruby only. Path to the `version.rb` file |

## Creating/updating release PRs

```bash
release-please release-pr 
  --token=$GITHUB_TOKEN \
  --repo-url=<owner>/<repo> [extra options]
```

### With a manifest config

If you have a manifest config in your repository, then the release
configurations are pulled from the manifest config file.

Extra options:

| Option | Type | Description |
| ------ | ---- | ----------- |
| `--config-file` | string | Override the path to the release-please config file. Defaults to `release-please-config.json` |
| `--manifest-file` | string | Override the path to the release-please manifest file. Defaults to `.release-please-manifest.json` |

### Without a manifest config

If you do not have a manifest config in your repository, then you will
need to specify your release options:

| Option | Type | Description |
| ------ | ---- | ----------- |
| `--path` | string | Path for changes to consider part of this component's release. Defaults to `.` |
| `--package-name` | string | Name of the package being released. Defaults to a value determined by the configured release type |
| `--component` | string | Name of the component used for branch naming and release tagging. Defaults to a normalized version based on the package name |
| `--release-type` | ReleaseType | Language strategy that determines which files to update |
| `--initial-version` | string | Version string to set as the last released version of this package. Defaults to `0.0.0` |
| `--versioning-strategy` | VersioningStrategy | Override method of determining SemVer version bumps based on commits. Defaults to `default` |
| `--bump-minor-pre-major` | boolean | Configuration option for the versioning strategy. If set, will bump the minor version for breaking changes for versions < 1.0.0 |
| `--bump-patch-for-minor-pre-major` | boolean | Configuration option for the versioning strategy. If set, will bump the patch version for features for versions < 1.0.0 |
| `--draft-pull-request` | boolean | If set, create pull requests as drafts |
| `--label` | string | Comma-separated list of labels to apply to the release pull requests. Defaults to `autorelease: pending` |`autorelease: tagged` |
| `--monorepo-tags` | boolean | Add prefix to tags and branches, allowing multiple libraries to be released from the same repository |
| `--pull-request-title-pattern` | `string` | Override the pull request title pattern. Defaults to `chore${scope}: release${component} ${version}` |
| `--signoff` | string | Add [`Signed-off-by`](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---signoff) line at the end of the commit log message using the user and email provided. (format "Name \<email@example.com\>") |
| `--extra-files` | `string[]` | Extra file paths for the release strategy to consider |
| `--version-file` | `string` | Ruby only. Path to the `version.rb` file |

## Creating a release on GitHub

```bash
release-please github-release \
  --token=$GITHUB_TOKEN
  --repo-url=<owner>/<repo> [extra options]
```

### With a manifest config

If you have a manifest config in your repository, then the release
configurations are pulled from the manifest config file.

Extra options:

| Option | Type | Description |
| ------ | ---- | ----------- |
| `--config-file` | string | Override the path to the release-please config file. Defaults to `release-please-config.json` |
| `--manifest-file` | string | Override the path to the release-please manifest file. Defaults to `.release-please-manifest.json` |

### Without a manifest config

If you do not have a manifest config in your repository, then you will
need to specify your release options:

| Option | Type | Description |
| ------ | ---- | ----------- |
| `--path` | string | Path for changes to consider part of this component's release. Defaults to `.` |
| `--package-name` | string | Name of the package being released. Defaults to a value determined by the configured release type |
| `--component` | string | Name of the component used for branch naming and release tagging. Defaults to a normalized version based on the package name |
| `--release-type` | ReleaseType | Language strategy that determines which files to update |
| `--monorepo-tags` | boolean | Add prefix to tags and branches, allowing multiple libraries to be released from the same repository |
| `--pull-request-title-pattern` | `string` | Override the pull request title pattern. Defaults to `chore${scope}: release${component} ${version}` |
| `--draft` | `boolean` | If set, create releases as drafts |
| `--label` | `string` | Comma-separated list of labels to apply to the release pull requests. Defaults to `autorelease: pending` |
| `--release-label` | `string` | Comma-separated list of labels to apply to the pull request after the release has been tagged. Defaults to `autorelease: tagged` |
