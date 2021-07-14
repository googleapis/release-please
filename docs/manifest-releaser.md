# Manifest Driven release-please

release-please can be setup to use source controlled files containing releaser
specific configuration (the `release-please-config.json`) as well package
version tracking (the `.release-please-manifest.json`).


The motivation of the manifest-based releaser is support for monorepos:

* a combined [Release PR](https://github.com/googleapis/release-please#whats-a-release-pr) will be created for all configured packages.
* release configuration for potentially hundreds of libraries is combined in two configuration files.

Note: currently only `node`, `python`, and `rust` release types are supported.

## Quick Start

Create a minimal `release-please-config.json`, e.g., for a single JS package:
```js
{
  "packages": {
    "path/to/pkg": {}
  }
}
```

Create an empty `.release-please-manifest.json`

Commit/push/merge these to your remote GitHub repo (using either the repo's
default branch or a test branch in which case you'll use the `--default-branch`
flag in the next step).

Run release-please:
```sh
release-please [--token=your/apikey.txt] [--default-branch=testing] manifest-pr
```

The resulting PR will assume a default starting version for your package
(currently 0.1.0 for "node") and will collect all the commits (in the history
of the default/configured branch) to parse out conventional commits for
changelog generation.

If that is not the desired behavior for your first release PR, read on!

### Bootstrapping
There are two items to consider when running release-please for the first time:
1. which commit to start at (i.e. how much to include in your next changelog entry)
2. what version release-please should propose in this first release PR

#### Starting commit
You can add a top level `"bootstrap-sha": <full sha value>` key/value entry to
the config which will cause release-please to stop there for collecting
changelog commits (so choose one commit earlier than the first commit you want
to include). Note: once a release-please generated PR has been merged,
this config value will be ignored for all subsequent runs and can be removed.

#### Initial Version
The simplest way to tell release-please the current version for a package
it has never released before is to manually add an entry into
`.release-please-manifest.json`. This change should be made directly on the
default/configured branch or on a separate, user created branch/PR which is then
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
The following example shows all the possiblities. Note: for illustration
purposes the top level values set here are **NOT** the defaults (those are
documented in comments)
```js
{
  // if this is the first time running `manifest-pr` on a repo
  // this key will limit how far back (exclusive) to pull commits
  // for conventional commit parsing.
  // Notes:
  //   - full sha required.
  //   - only applicable at top-level config.
  "bootstrap-sha": "6fc119838885b0cb831e78ddd23ac01cb819e585",

  // see Plugins section below
  // absence defaults to [] (i.e. no plugins)
  "plugins": ["node-workspace", "cargo-workspace"],

  // optional top-level defaults that can be overriden per package:

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

  // set default conventional commit => changelog sections mapping/appearance.
  // absence defaults to https://git.io/JqCZL
  "changelog-sections": [...]

  // when `manifest-release` creates GitHub Releases per package, create
  // those as "Draft" releases (which can later be manually published).
  // absence defaults to false and Releases are created as already Published.
  "draft": true


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
  "packages": {
    "path/to/myJSPkgA": {
      // overrides release-type for node
      "release-type": "node",
      // create published GitHub Releases on `manifest-release` runs
      "draft": false,
    },

    "path/to/myJSPkgB": {
      // overrides release-type for node
      "release-type": "node",
      // overrides default release-as.
      // see top level note about deleting/modifying after release PR merge
      "release-as": "3.2.1"
    },

    "path/to/my-rust-crate", {
      // override release-type for rust
      "release-type": "rust"
    }

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
  }

}
```

## Manifest

At a minimum, a manifest file must exist at the tip of the `--default-branch`.
It can be empty when release-please is run for the first time but it must exist.
Manually editing the manifest is only appropriate in the bootstrap case outlined
above. release-please will record a new version into the manifest file for each
package it is configured to release.

Once the first release PR has been merged, subsequent `manifest-pr` runs will
retrieve the content of the manifest at the commit corresponding to that merged
PR. It will use this to find the last-released version for each package. It will
only read the manifest versions at the tip of the default/configured branch if
it fails to find a package's version in the last released manifest content. It
will only consider version info it is missing for a configured package (thus
handling the new package bootstrap case).

## CLI usage
The commands available for this mode are `manifest-pr` and `manifest-release`

They both take the following optional flags:
```sh
❯ release-please manifest-pr --help
release-please manifest-pr

create a release-PR using a manifest file

Options:
  --help                        Show help                              [boolean]
  --version                     Show version number                    [boolean]
  --debug                       print verbose errors (use only for local
                                debugging).           [boolean] [default: false]
  --token                       GitHub token with repo write permissions
  --api-url                     URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --default-branch              The branch to open release PRs against and tag
                                releases on                             [string]
  --fork                        should the PR be created from a fork
                                                      [boolean] [default: false]
  --repo-url                    GitHub URL to generate release for    [required]
  --config-file                 where can the config file be found in the
                                project? [default: "release-please-config.json"]
  --manifest-file               where can the manifest file be found in the
                                project?
                                      [default: ".release-please-manifest.json"]
```

### `manifest-pr`

This command can be run anytime and it will create or update a release PR. It
labels the PR as `"autorelease: pending"` (used by `manifest-release`).

### `manifest-release`

This command should run some time after a release PR has been merged and before
the next release PR is merged. It will create GitHub Releases based on the
last merged release PR it finds (which is why you don't want to let two release
PRs merge w/out running it). If successful it will remove the
`"autorelease: pending"` label and adds the `"autorelease: tagged"` label.
Creating all the releases is not transactional. If any fail to create the
command can be re-run safely to finish creating releases.

### Releasing Root Path of Library (".")

One use-case that arose for [googleapis](https://github.com/googleapis/google-api-nodejs-client), was the need to publish individual libraries along
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

A `ManifestPlugin` instance has these resources avilable:
- `this.gh`: a `GitHub` instance for any API operations it might want to perform
- `this.config`: a `Config` object representing all the packages configured for the monorepo

It must implement a `run` method which receives two arguments:
- the latest versions of all packages (ultimately be written to the manifest)
- an array of the mapping of package-to-currently-proposed-changes
and makes any modifications, additions, or deletions to either argument (in
addition to any other out-of-band side effect) and returns both (potentially
modified) arguments in a tuple.

For example, a very basic plugin that simply logs the number of packages
currently appearing in the release written as `src/plugins/num-packages.ts`:

```typescript
import {CheckpointType} from '../util/checkpoint';

export default class LogNumberPkgsReleased extends ManifestPlugin {

  async run(
    newManifestVersions: VersionsMap,
    pkgsWithPRData: ManifestPackageWithPRData[]
  ): Promise<[VersionsMap, ManifestPackageWithPRData[]]> {
    this.log(
      `Number of packages to release: ${pkgsWithPRData.length}`,
      CheckpointType.Success
    );
    return [newManifestVersions, pkgsWithPRData];
  }
}
```

The `num-packages` plugin is not very interesting. Also, if it is not last in
the `"plugins"` configuration array, it might not be accurate (a subsequent
plugin could add or remove entries to/from `pkgsWithPRData`)

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
PR changes. Under the hood this plugin adapts specific dependency graph building
and updating functionality from the popular
[lerna](https://github.com/lerna/lerna) tool.

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
