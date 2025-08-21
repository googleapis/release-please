# Manifest Driven release-please

release-please can be setup to use source-controlled files containing releaser
specific configuration (the `release-please-config.json`) as well package
version tracking (the `.release-please-manifest.json`).

The motivation of the manifest-based releaser is support for monorepos:

* a combined [Release PR](https://github.com/googleapis/release-please#whats-a-release-pr) will be created for all configured packages.
* release configuration for potentially hundreds of libraries is combined in two configuration files.

Although originally designed for repositories that contain multiple releasable artifacts, it also
supports single artifact workflows just as easily.

## Quick Start

### Bootstrap with CLI

Step 1: Install release-please CLI

```bash
npm i release-please -g
```

Step 2: Bootstrap a release configuration

```bash
release-please bootstrap \
  --token=$GITHUB_TOKEN \
  --repo-url=<owner>/<repo> \
  --release-type=<release-type> [extra options]
```

This will open a pull request that configures the initial
`release-please-config.json` and `.release-please-manifest.json` files.

For the full options, see the [CLI documentation](/docs/cli.md#bootstrapping).

### Bootstrap manually

Create a minimal `release-please-config.json`, e.g., for a single JS package:
```js
{
  "packages": {
    "path/to/pkg": {}
  }
}
```

> Note: `path/to/pkg` should be a directory and not a file.

Create an empty `.release-please-manifest.json`. For example:
```shell
echo "{}" > .release-please-manifest.json
```


Commit/push/merge these to your remote GitHub repo (using either the repo's
default branch or a test branch in which case you'll use the `--target-branch`
flag in the next step).

Run release-please:
```sh
release-please [--token=your/apikey.txt] --repo-url=<owner>/<repo> [--target-branch=testing] release-pr
```

The resulting PR will assume a default starting version for your package
(currently 0.1.0 for "node") and will collect all the commits (in the history
of the default/configured branch) to parse out conventional commits for
changelog generation.

If that is not the desired behavior for your first release PR, read on!

#### Bootstrapping

There are two items to consider when running release-please for the first time:
1. which commit to start at (i.e. how much to include in your next changelog entry)
2. what version release-please should propose in this first release PR

##### Starting commit

You can add a top level `"bootstrap-sha": <full sha value>` key/value entry to
the config which will cause release-please to stop there for collecting
changelog commits (so choose one commit earlier than the first commit you want
to include). Note: once a release-please generated PR has been merged,
this config value will be ignored for all subsequent runs and can be removed.

##### Initial Version

The simplest way to tell release-please the current version for a package
it has never released before is to manually add an entry into
`.release-please-manifest.json`. This change should be made directly on the
default/configured branch or on a separate, user-created branch/PR which is then
merged into the default/configured branch.

```js
{
  "path/to/pkg": "1.1.1"
}

```
release-please will now use "1.1.1" as the last-released/current version for
"path/to/pkg" and suggest the next version according to coventional commits it
has found since the last merged release PR (or "bootstrap-sha" if this is the
first run).

## Configfile

Some example configs below illustrate usage (comments for illustration purposes
only, not supported in actual configs).

A config file must exist at the tip of the default/configured branch and the
minimal content required defines at least one package:
```js
{
  "packages": {
    // defaults to the "node" type which also implements package-name lookup
    // so no need to specify that here.
    "path/to/pkg": {}
  }
}
```
The following example shows most of the available options. See the documented
[JSON schema](/schemas/config.json) for the complete configuration definition.
Note: for illustration purposes the top level values set here are **NOT** the
defaults (those are documented in comments)
```js
{
  // if this is the first time running `manifest-pr` on a repo
  // this key will limit how far back (exclusive) to pull commits
  // for conventional commit parsing. Once release-please has generated
  // at least one release PR, this setting will subsequently be ignored.
  // release-please will check for a manifest file at the bootstrap-sha
  // and if it doesn't find one it will fallback to checking at HEAD.
  // Notes:
  //   - full sha required.
  //   - only applicable at top-level config.
  "bootstrap-sha": "6fc119838885b0cb831e78ddd23ac01cb819e585",

  // release-please's normal behavior is to find the last merged release PR
  // and use the associated commit sha as the previous marker from which to
  // gather commits for the new release. With this setting you can manually
  // set the commit sha release-please will use from which to gather commits
  // for the current release.
  // This can be useful when you've accidentally merged a bad release PR.
  // While you can revert the changes from that PR and delete tags/releases
  // GitHub does not allow you to delete PRs so release-please will find
  // that last PR.
  // Notes:
  //   - full sha required.
  //   - only applicable at top-level config.
  //   - never ignored: remove/change it once a good release PR is merged
  "last-release-sha": "7td2b9838885b3adf52e78ddd23ac01cb819e631",

  // see Plugins section below
  // absence defaults to [] (i.e. no plugins)
  "plugins": ["node-workspace", "cargo-workspace"],

  // optional top-level defaults that can be overridden per package:

  // set default package release-type to "python"
  // absence defaults to "node"
  "release-type": "python",

  // manually set next version to be "1.2.3" ignoring conventional commits.
  // absence defaults to conventional commits derived next version.
  // Note: once the release PR is merged you should either remove this or
  // update it to a higher version. Otherwise subsequent `manifest-pr` runs
  // will continue to use this version even though it was already set in the
  // last release.
  "release-as": "1.2.3",

  // BREAKING CHANGE only bumps semver minor if version < 1.0.0
  // absence defaults to false
  "bump-minor-pre-major": true,

  // feat commits bump semver patch instead of minor if version < 1.0.0
  // absence defaults to false
  "bump-patch-for-minor-pre-major": true,

  // setting the type of prerelease in case of prerelease strategy
  "prerelease-type": "beta",

  // set default conventional commit => changelog sections mapping/appearance.
  // absence defaults to https://git.io/JqCZL
  "changelog-sections": [...],

  // set default github host in changelog
  // absence defaults to https://github.com
  "changelog-host": "https://example.com",

  // when `manifest-release` creates GitHub Releases per package, create
  // those as "Draft" releases (which can later be manually published).
  // absence defaults to false and Releases are created as already Published.
  "draft": true,

  // when `manifest-release` creates GitHub Releases per package, create
  // those as "Prerelease" releases that have pre-major or prerelease versions.
  // absence defaults to false and all versions are fully Published.
  "prerelease": true

  // Skip creating GitHub Releases
  // Absence defaults to false and Releases will be created. Release-Please still
  // requires releases to be tagged, so this option should only be used if you
  // have existing infrastructure to tag these releases.
  "skip-github-release": true,

  // Skip updating the changelog.
  // Absence defaults to false and the changelog will still be updated.
  "skip-changelog"

  // when using the `node-workspace` plugin, package discovery forces all
  // local dependencies to be linked, even if the SemVer ranges don't match.
  // this allows breaking version bumps to update during a release.
  // setting to false will only bump your local dependencies within the SemVer range.
  // see Breaking Changes section below
  // absence defaults to true
  "always-link-local": false,

  // if true, create separate pull requests for each package instead of a
  // single manifest release pull request
  // absence defaults to false and one pull request will be raised
  "separate-pull-requests": false,

  // if true, always update existing pull requests when changes are added,
  // instead of only when the release notes change.
  // This option may increase the number of API calls used, but can be useful
  // if pull requests must not be out-of-date with the base branch.
  // absence defaults to false
  "always-update": true,

  // sets the manifest pull request title for when releasing multiple packages
  // grouped together in the one pull request.
  // This option has no effect when `separate-pull-requests` is `true`.
  // Template values (i.e. ${scope}, ${component} and ${version}) are inherited
  // from the root path's (i.e. '.') package, if present
  // absence defaults to "chore: release ${branch}"
  "group-pull-request-title-pattern": "chore: release ${branch}",

  // When searching for the latest release SHAs, only consider the last N releases.
  // This option prevents paginating through all releases in history when we
  // expect to find the release within the last N releases. For repositories with
  // a large number of individual packages, you may want to consider raising this
  // value, but it will increase the number of API calls used.
  "release-search-depth": 400,

  // When fetching the list of commits to consider, only consider the last N commits.
  // This option limits paginating through every commit in history when we may not
  // find the release SHA of the last release (there may not be one). We expect to
  // only need to consider the last 500 commits on a branch. For repositories with
  // a large number of individual packages, you may want to consider raising this
  // value, but it will increase the number of API calls used.
  "commit-search-depth": 500,

  // when creating multiple pull requests or releases, issue GitHub API requests
  // sequentially rather than concurrently, waiting for the previous request to
  // complete before issuing the next one.
  // This option may reduce failures due to throttling on repositories releasing
  // large numbers of packages at once.
  // absence defaults to false, causing calls to be issued concurrently.
  "sequential-calls": false,


  // per package configuration: at least one entry required.
  // the key is the relative path from the repo root to the folder that contains
  // all the files for that package.
  // the value is an object with the following optional keys:
  // - overrides for above top-level defaults AND
  // - "package-name": Ignored by packages whose release-type implements source
  //                   code package name lookup (e.g. "node"). Required for all
  //                   other packages (e.g. "python")
  // - "changelog-path": Path + filename of the changelog relative to the
  //                     *package* directory. defaults to "CHANGELOG.md". E.g.
  //                     for a package key of "path/to/mypkg", the location in
  //                     the repo is path/to/pkg/CHANGELOG.md
  // - "changelog-host": Override the GitHub host when writing changelog.
  //                     Defaults to "https://github.com". E.g. for a commit of
  //                     "abc123", it's hyperlink in changelog is
  //                     https://github.com/<org>/<repo>/commit/abc123
  "packages": {
    // `.` is a special case for handling to root of the repository
    ".": {
      // overrides release-type for node
      "release-type": "node",
      // exclude commits from that path from processing
      "exclude-paths": ["path/to/myPyPkgA"]
    },

    // path segment should be a folder relative to repository root
    "path/to/myJSPkgA": {
      // overrides release-type for node
      "release-type": "node",
      // create published GitHub Releases on `manifest-release` runs
      "draft": false
    },

    "path/to/myJSPkgB": {
      // overrides release-type for node
      "release-type": "node",
      // overrides default release-as.
      // see top level note about deleting/modifying after release PR merge
      "release-as": "3.2.1"
    },

    "path/to/my-rust-crate": {
      // override release-type for rust
      "release-type": "rust"
    },

    "path/to/myPyPkgA": {
      // when a default release-as is set, this is how you revert to using
      // conventional commits version bumping for an individual package.
      // Note: if present and set to "", the behavior will always be to use
      // conventional commits, regardless of presence or absence of default
      // release-as config.
      "release-as": "",
      "package-name": "coolio-pkg",
      // our change log is located at path/to/myPyPkgA/docs/CHANGES.rst
      "changelog-path": "docs/CHANGES.rst"
    },

    "path/to/github-enterprise-package": {
      // override changelog host for github enterprise package
      "changelog-host": "https://example.com"
    }
  }

}
```

### Regex matching for changelog sections

You can also map commits to changelog sections using regular expressions that match the commit subject. To do this, set the `type` field to a regex pattern. For example, to group Jira-like commit subjects such as `INFRA-123: ...` or `OPS-456: ...` under the same section:

```json
{
  "packages": { ".": {} },
  "changelog-sections": [
    { "section": "♻️ OPS", "type": "^INFRA-\\d+:" },
    { "section": "♻️ OPS", "type": "^OPS-\\d+:" },
    { "section": "✨ Features", "type": "feat" },
    { "section": "🐛 Bugfixes", "type": "fix" }
  ]
}
```

Notes:
- Regex patterns are matched against the commit subject (the message after any `type(scope):` prefix, if present).
- Version bump semantics still follow Conventional Commits (`feat`, `fix`, `BREAKING CHANGE`, etc.). Regex rules only affect how commits are displayed/grouped in the changelog.

## Subsequent Versions

release-please tries to determine the next release based on the previous tagged
release. The default search tag looks like:

```sh
<component-name>-v<release-version>
```

In your specific tagging scheme, your tags could like `v<release-version>`. And
this will result in an error like:

```sh
❯ looking for tagName: <component>-v<release-version>
⚠ Expected 1 releases, only found 0
```

To fix this, component can be removed from tagName being searched using the
`include-component-in-tag` property. Setting this to `false` will change the
tagName to:

```sh
v<release-version>
```

## Manifest

At a minimum, a manifest file must exist at the tip of the `--target-branch`.
It can be empty when release-please is run for the first time but it must exist.
Manually editing the manifest is only appropriate in the bootstrap case outlined
above. release-please will record a new version into the manifest file for each
package it is configured to release.

Once the first release PR has been merged, subsequent `release-pr` runs will
retrieve the content of the manifest at the commit corresponding to that merged
PR. It will use this to find the last-released version for each package. It will
only read the manifest versions at the tip of the default/configured branch if
it fails to find a package's version in the last released manifest content. It
will only consider version info it is missing for a configured package (thus
handling the new package bootstrap case).

### Using with GitHub Actions and Lerna

If you're using Release Please on a Node.js monorepo project that is also
using [Lerna](https://github.com/lerna/lerna) you can set up a GitHub Action
to automate the creation of release PRs. An example `release-please.yml`
similar to the [example for single packages](https://github.com/googleapis/release-please#automating-publication-to-npm)
is shown below.

```yaml
on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

name: Run Release Please
jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v2
        id: release
        with:
          command: manifest
          token: ${{secrets.GITHUB_TOKEN}}
          default-branch: main

      # The logic below handles the npm publication:
      - name: Checkout Repository
        if: ${{ steps.release.outputs.releases_created }}
        uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v1
        if: ${{ steps.release.outputs.releases_created }}
        with:
          node-version: 14
          registry-url: 'https://registry.npmjs.org'
      - name: Build Packages
        if: ${{ steps.release.outputs.releases_created }}
        run: |
          npm install
          npx lerna bootstrap

      # Release Please has already incremented versions and published tags, so we just
      # need to publish all unpublished versions to NPM here
      # See: https://github.com/lerna/lerna/tree/main/commands/publish#bump-from-package
      - name: Publish to NPM
        if: ${{ steps.release.outputs.releases_created }}
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
        run: npx lerna publish from-package --no-push --no-private --yes
```

### Releasing Root Path of Library (".")

One use-case that arose for [googleapis](https://github.com/googleapis/google-api-nodejs-client),
was the need to publish individual libraries along
with a combined version of the library, i.e.,

* an individual library for `@googleapis/youtube`, `@googleapis/sheets`, etc.
* a root library that combined all these API surfaces.

This functionality can be achieved by using the special `"."` path.
`"."` indicates a release should be created when any changes are made to the
codebase.

## Plugins

Plugins can be added to perform extra release processing that cannot be achieved
by an individual releaser because that releaser only has the context of a single
package on which to operate. A plugin operates in the context of all the
packages in the monorepo after release-please has run individual releasers on
each package but before the final PR is created or updated.

### Plugin usage

To use a plugin in your manifest based release-please setup, simply add it to
the array of the `"plugins"` key in your release-please-config.json. (Note: the
plugin must already be implemented, see below)

### Plugin implementation

A `ManifestPlugin` instance has these resources available:
- `this.github`: a `GitHub` instance for any API operations it might want to perform
- `this.repositoryConfig`: a `RepositoryConfig` object representing all the packages
  configured for the monorepo
- `this.targetBranch`: a `string` representing the target branch of the release

It must implement a `run` method which receives one argument (an array containing the
candidate release pull requests) and returns an array of post-processed candidate
pull requests. The plugin may choose to merge multiple pull requests into an
aggregate pull request.

For example, a very basic plugin that simply logs the number of packages
currently appearing in the release written as `src/plugins/num-packages.ts`:

```typescript
import {CheckpointType} from '../util/checkpoint';

export default class LogNumberPkgsReleased extends ManifestPlugin {

  async run(
    pullRequests: CandidateReleasePullRequest[]
  ): Promise<[VersionsMap, ManifestPackageWithPRData[]]> {
    logger.info(
      `Number of packages to release: ${pullRequests.length}`
    );
    return pullRequests;
  }
}
```

The `num-packages` plugin is not very interesting. Also, if it is not last in
the `"plugins"` configuration array, it might not be accurate (a subsequent
plugin could add or remove entries to/from `pullRequests`)

However, one place a plugin has particular value is in a monorepo where local
packages depend on the latest version of each other (e.g. yarn/npm workspaces
for Node, or cargo workspaces for Rust).


### node-workspace

The `node-workspace` plugin builds a graph of local node packages configured
in release-please-config.json and the dependency relationships between them.
It looks at what packages were updated by release-please and updates their
reference in other packages' dependencies lists. Even when a particular package
was not updated by release-please, if a dependency did have an update, it will
be patch bump the package, create a changelog entry, and add it to the list of
PR changes. Under the hood, this plugin adapts specific dependency graph building
and updating functionality from the popular
[lerna](https://github.com/lerna/lerna) tool.

#### Breaking versions

When using the `node-workspace` tool, breaking versions bumps will be included in
your update pull request. If you don't agree with this behavior and would only like
your local dependencies bumped if they are within the SemVer range, you can set the
`"always-link-local"` option to `false` in your manifest config.

#### Linking peer dependencies

By default, the `node-workspace` plugin doesn't modify `peerDependencies` fields in
package.json. If you would like version bumps to be also linked in `peerDependencies`
fields, set `"updatePeerDependencies"` to `true` in your manifest plugin config.

```
{
  "plugins": [
    {
      "type": "node-workspace",
      "updatePeerDependencies": true
    }
  ]
}
```

### cargo-workspace

The `cargo-workspace` plugin operates similarly to the `node-workspace` plugin,
but on a Cargo workspace. It also builds a dependency graph of all packages in a
workspace, and updates any packages that were directly bumped by release-please,
or that should be patch-bumped because one of their transitive dependencies was
bumped. The cargo lockfile is also updated.

Note: when the Rust releaser is used standalone (with the `release-pr` /
`github-release` commands), it also tries to update monorepo dependencies, but
it doesn't build a crate graph. When the Rust releaser is used in conjunction
with the manifest releaser (`manifest-pr` / `manifest-release` commands), it
does _not_ update the dependencies, and the `cargo-workspace` plug-in must be
used to update dependencies and bump all dependents — this is the recommended
way of managing a Rust monorepo with release-please.

### maven-workspace

The `maven-workspace` plugin operates similarly to the `node-workspace` plugin,
but on a multi-artifact Maven workspace. It builds a dependency graph of all
discovered `pom.xml` files and updates any packages that were directly bumped
by release-please.

If you have additional `pom.xml` files that are not directly configured in your
manifest and you want to skip updating them, then you can set the
`considerAllArtifacts` option to `false`. If you do so, the plugin will only
look at the `pom.xml` files configured in the manifest.

### linked-versions

The `linked-versions` plugin allows you to "link" the versions of multiple
components in your monorepo. When any component in the specified group is
updated, we pick the highest version amongst the components and update all
group components to the same version (keeping them in sync).

Note: when combining the `linked-versions` plugin with a `workspace` plugin,
you will need to tell the `workspace` plugin to skip its own internal merge.
See #1457 for context.

Example:

```json
{
  "release-type": "rust",
  "packages": {
    "packages/rustA": {
      "component": "pkgA"
    },
    "packages/rustB": {
      "component": "pkgB"
    }
  },
  "plugins": [
    {
      "type": "cargo-workspace",
      "merge": false
    },
    {
      "type": "linked-versions",
      "groupName": "my group",
      "components": [
        "pkgA", "pkgB"
      ]
    }
  ]
}
```

### sentence-case

Capitalize the leading word in a commit message, taking into account common exceptions, e.g., gRPC.

As an example:

`fix: patch issues in OpenSSL`

Will be output in the CHANGELOG thusly:

```
Bug Fixes:

* Patch issues in OpenSSL`
```

### group-priority

This plugin allows you to configure pull request by priority. If enabled and if a pull request of a
prioritized group is found, `release-please` will limit the proposed release pull requests to the
prioritized group only.


Example:

```json
{
  "release-type": "java",
  "packages": {
    "packages/rustA": {
      "component": "pkgA"
    },
    "packages/rustB": {
      "component": "pkgB"
    }
  },
  "plugins": [
    {
      "type": "group-priority",
      "groups": ["snapshot"]
    }
  ]
}
```

In the above example, java snapshot PRs are now marked as part of the snapshot group. If you
configure the `group-priority` plugin with the group set to ['snapshot'], then `release-please`
will only open pull requests for snapshot pull requests if there are any. This would avoid a
mix/match of snapshot and non-snapshot version bumps.

The `groups` option is a list of group names sorted with the highest priority first.
