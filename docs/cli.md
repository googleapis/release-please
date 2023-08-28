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

## Bootstrapping

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
| `--path` | `string` | Path for changes to consider part of this component's release. Defaults to `.` Other paths should be relative to the repository root and not include `.` |
| `--package-name` | `string` | Name of the package being released. Defaults to a value determined by the configured release type |
| `--component` | `string` | Name of the component used for branch naming and release tagging. Defaults to a normalized version based on the package name |
| `--release-type` | [`ReleaseType`](/docs/customizing.md#strategy-language-types-supported) | Language strategy that determines which files to update |
| `--initial-version` | `string` | Version string to set as the last released version of this package. Defaults to `0.0.0` |
| `--versioning-strategy` | [`VersioningStrategyType`](/docs/customizing.md#versioning-strategies) | Override method of determining SemVer version bumps based on commits. Defaults to `default` |
| `--bump-minor-pre-major` | `boolean` | Configuration option for the versioning strategy. If set, will bump the minor version for breaking changes for versions < 1.0.0 |
| `--bump-patch-for-minor-pre-major` | `boolean` | Configuration option for the versioning strategy. If set, will bump the patch version for features for versions < 1.0.0 |
| `--draft` | `boolean` | If set, create releases as drafts |
| `--prerelease` | `boolean` | If set, create releases that are pre-major or pre-release version marked as pre-release on Github|
| `--draft-pull-request` | `boolean` | If set, create pull requests as drafts |
| `--label` | `string` | Comma-separated list of labels to apply to the release pull requests. Defaults to `autorelease: pending` |
| `--release-label` | `string` | Comma-separated list of labels to apply to the pull request after the release has been tagged. Defaults to `autorelease: tagged` |
| `--changelog-path` | `string` | Override the path to the managed CHANGELOG. Defaults to `CHANGELOG.md` |
| `--changelog-type` | [`ChangelogType`](/docs/customizing.md#changelog-types) | Strategy for building the changelog contents. Defaults to `default` |
| `--changelog-sections` | `string` | Comma-separated list of commit scopes to show in changelog headings |
| `--changelog-host` | `string` | Host for commit hyperlinks in the changelog. Defaults to `https://github.com` |
| `--pull-request-title-pattern` | `string` | Override the pull request title pattern. Defaults to `chore${scope}: release${component} ${version}` |
| `--pull-request-header` | `string` | Override the pull request header. Defaults to `:robot: I have created a release *beep* *boop*` |
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
| `--skip-labeling` | `boolean` | If set, labels will not be applied to pull requests |

### Without a manifest config

If you do not have a manifest config in your repository, then you will
need to specify your release options:

| Option | Type | Description |
| ------ | ---- | ----------- |
| `--path` | string | Path for changes to consider part of this component's release. Defaults to `.` Other paths should be relative to the repository root and not include `.` |
| `--package-name` | string | Name of the package being released. Defaults to a value determined by the configured release type |
| `--component` | string | Name of the component used for branch naming and release tagging. Defaults to a normalized version based on the package name |
| `--release-type` | ReleaseType | Language strategy that determines which files to update |
| `--initial-version` | string | Version string to set as the last released version of this package. Defaults to `0.0.0` |
| `--versioning-strategy` | VersioningStrategy | Override method of determining SemVer version bumps based on commits. Defaults to `default` |
| `--bump-minor-pre-major` | boolean | Configuration option for the versioning strategy. If set, will bump the minor version for breaking changes for versions < 1.0.0 |
| `--bump-patch-for-minor-pre-major` | boolean | Configuration option for the versioning strategy. If set, will bump the patch version for features for versions < 1.0.0 |
| `--draft-pull-request` | boolean | If set, create pull requests as drafts |
| `--label` | string | Comma-separated list of labels to apply to the release pull requests. Defaults to `autorelease: pending` |`autorelease: tagged` |
| `--changelog-path` | `string` | Override the path to the managed CHANGELOG. Defaults to `CHANGELOG.md` |
| `--changelog-type` | [`ChangelogType`](/docs/customizing.md#changelog-types) | Strategy for building the changelog contents. Defaults to `default` |
| `--changelog-sections` | `string` | Comma-separated list of commit scopes to show in changelog headings |
| `--changelog-host` | `string` | Host for commit hyperlinks in the changelog. Defaults to `https://github.com` |
| `--monorepo-tags` | boolean | Add prefix to tags and branches, allowing multiple libraries to be released from the same repository |
| `--pull-request-title-pattern` | `string` | Override the pull request title pattern. Defaults to `chore${scope}: release${component} ${version}` |
| `--pull-request-header` | `string` | Override the pull request header. Defaults to `:robot: I have created a release *beep* *boop*` |
| `--signoff` | string | Add [`Signed-off-by`](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---signoff) line at the end of the commit log message using the user and email provided. (format "Name \<email@example.com\>") |
| `--extra-files` | `string[]` | Extra file paths for the release strategy to consider |
| `--version-file` | `string` | Ruby only. Path to the `version.rb` file |
| `--skip-labeling` | `boolean` | If set, labels will not be applied to pull requests |
| `--include-v-in-tags` | `boolean` | Include "v" in tag versions. Defaults to `true`. |

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
| `--pull-request-header` | `string` | Override the pull request header. Defaults to `:robot: I have created a release *beep* *boop*` |
| `--draft` | `boolean` | If set, create releases as drafts |
| `--prerelease` | `boolean` | If set, create releases that are pre-major or pre-release version marked as pre-release on Github|
| `--label` | `string` | Comma-separated list of labels to apply to the release pull requests. Defaults to `autorelease: pending` |
| `--release-label` | `string` | Comma-separated list of labels to apply to the pull request after the release has been tagged. Defaults to `autorelease: tagged` |
| `--include-v-in-tags` | `boolean` | Include "v" in tag versions. Defaults to `true`. |

## Create a manifest pull request [deprecated]

This CLI command is deprecated in favor of `release-pr` which handles this path with the
same options. This command is preserved for backward compatibility and will be removed in the
next major version.

This command can be run anytime and it will create or update a release PR. It
labels the PR as `"autorelease: pending"` (used by `manifest-release`).

```bash
❯ release-please manifest-pr --help
release-please manifest-pr

create a release-PR using a manifest file

Options:
  --help                Show help                                      [boolean]
  --version             Show version number                            [boolean]
  --debug               print verbose errors (use only for local debugging).
                                                      [boolean] [default: false]
  --trace               print extra verbose errors (use only for local
                        debugging).                   [boolean] [default: false]
  --token               GitHub token with repo write permissions
  --api-url             URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --graphql-url         URL to use when making GraphQL requests
                                    [string] [default: "https://api.github.com"]
  --default-branch      The branch to open release PRs against and tag releases
                        on    [deprecated: use --target-branch instead] [string]
  --target-branch       The branch to open release PRs against and tag releases
                        on                                              [string]
  --repo-url            GitHub URL to generate release for            [required]
  --dry-run             Prepare but do not take action[boolean] [default: false]
  --label               comma-separated list of labels to add to from release PR
                                               [default: "autorelease: pending"]
  --fork                should the PR be created from a fork
                                                      [boolean] [default: false]
  --draft-pull-request  mark pull request as a draft  [boolean] [default: false]
  --signoff             Add Signed-off-by line at the end of the commit log
                        message using the user and email provided. (format "Name
                        <email@example.com>").                          [string]
  --config-file         where can the config file be found in the project?
                                         [default: "release-please-config.json"]
  --manifest-file       where can the manifest file be found in the project?
                                      [default: ".release-please-manifest.json"]
```

### Create a manifest release [deprecated]

This CLI command is deprecated in favor of `github-release` which handles this path with the
same options. This command is preserved for backward compatibility and will be removed in the
next major version.

This command should run sometime after a release PR has been merged and before
the next release PR is merged. It will create GitHub Releases based on the
last merged release PR it finds (which is why you don't want to let two release
PRs merge without running it). If successful it will remove the
`"autorelease: pending"` label and adds the `"autorelease: tagged"` label.
Creating all the releases is not transactional. If any fail to create the
command can be re-run safely to finish creating releases.

```bash
❯ release-please manifest-release --help
release-please manifest-release

create releases/tags from last release-PR using a manifest file

Options:
  --help            Show help                                          [boolean]
  --version         Show version number                                [boolean]
  --debug           print verbose errors (use only for local debugging).
                                                      [boolean] [default: false]
  --trace           print extra verbose errors (use only for local debugging).
                                                      [boolean] [default: false]
  --token           GitHub token with repo write permissions
  --api-url         URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --graphql-url     URL to use when making GraphQL requests
                                    [string] [default: "https://api.github.com"]
  --default-branch  The branch to open release PRs against and tag releases on
                              [deprecated: use --target-branch instead] [string]
  --target-branch   The branch to open release PRs against and tag releases on
                                                                        [string]
  --repo-url        GitHub URL to generate release for                [required]
  --dry-run         Prepare but do not take action    [boolean] [default: false]
  --draft           mark release as a draft. no tag is created but tag_name and
                    target_commitish are associated with the release for future
                    tag creation upon "un-drafting" the release.
                                                      [boolean] [default: false]
  --label           comma-separated list of labels to remove to from release PR
                                               [default: "autorelease: pending"]
  --release-label   set a pull request label other than "autorelease: tagged"
                                       [string] [default: "autorelease: tagged"]
  --config-file     where can the config file be found in the project?
                                         [default: "release-please-config.json"]
  --manifest-file   where can the manifest file be found in the project?
                                      [default: ".release-please-manifest.json"]
```
