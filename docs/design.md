# Release Please Implementation Design

This document aims to describe the current design of `release-please` and serve as a
primer for contributing to this library.

## General concepts

### Release branch

The release branch is the branch that you will create releases from. Most commonly this
is your repository's default branch (like `main`), but could also be a long
term support (LTS) or backport branch as well.

In the code, this is referred to as the `targetBranch`.

### Release pull request

`release-please` is designed to propose releases via a pull request. `release-please`
will maintain a pull request ("release pull request") which proposes version bumps in
your code and appends release notes to your `CHANGELOG.md`. Releases are not created
until after this "release pull request" is merged to your release branch.

Maintainers can merge additional commits and `release-please` will update the existing
release pull request.

### GitHub releases

GitHub has a feature called a [release](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) which is the combination of a git reference (tag or
SHA) and release notes. `release-please` creates a GitHub release after a release pull
request is merged to your release branch.

### Components

In `release-please` terms, `component` is the name of a releasable unit. This could be a
library to publish to a package manager or an application that is deployed to a server.

Most commonly, a single GitHub repository contains code for a single `component`. In 
other cases, a single GitHub repository could be a monorepo that contains code for
multiple components. `release-please` can handle both of these scenarios.

### Semantic versioning

Semantic versioning is a specification that dictates how version numbers are formatted
and incremented. This library assumes your version numbers are semantic versions.

For more information, see https://semver.org

### Conventional commits

Conventional commits is a specification for making commit messages machine-readable and
informing automation tools (like `release-please`) about the context of the commit.

For more information, see https://conventionalcommits.org

## Lifecycle of a release

1. A commit is merged/pushed to the release branch.
2. `release-please` opens a release pull request.
3. A maintainer reviews/merges the release pull request.
4. `release-please` creates a new GitHub release with the release notes (extracted from
   the release pull request).

**Note**: `release-please` is not responsible for publishing your package or application.
You can easily set up further automation to trigger from the creation of the release.

### Opening a release pull request

The general flow for opening a release pull request:

1. Find the SHA of the latest released version for the component to be released
2. Find all commits relevant to that component since the previous release
3. Delegate to a language handler ([`Strategy`][strategies]) to build the pull request,
   given the list of commits.
4. Create a pull request with the relevant code changes. Add the pending label
   (defaults to `autorelease: pending`) to the pull request.

More in-depth (including monorepo support):

1. Build the manifest config
  * Fetch and parse the manifest config/versions files OR
  * Build the manifest in code
2. Find the SHA of each of the latest released versions for each component
  * Iterate through the latest GitHub releases (via GitHub GraphQL API)
  * Fallback: iterate through GitHub tags on the repository
3. Iterate backwards through commits until we've seen all the release SHAs or we hit
   a (configurable) max number of commits. Include fetching files for each of those
   commits
4. Split commits for each component. Only commits that touch the directory of the
   component apply to that component.
5. Run any plugin pre-configurators (for `Strategy` configs).
6. For each component, build a candidate release pull request (if necessary)
7. Run any plugin post-processors
8. Optionally, combine multiple candidate release pull requests into a single pull
   request that will release all components together.

### Creating GitHub releases

The general flow for creating a GitHub release:

1. Find any merged release pull requests. We look for the pull request by label.
2. For each merged release pull request, parse the pull request to determine the component
   version, and release notes.
3. Create a new GitHub release that tags the SHA of the pull request's merge commit SHA.
   Use the parsed release notes as the GitHub release's body.
4. Mark the pull request as tagged by adding the tagged label (defaults to 
   `autorelease: tagged`).

## Making API calls

This library was originally built as a nodejs library and CLI tool. It does not use the
`git` CLI and instead opts to do its processing work in-memory and using the GitHub API.

All code paths that interact with GitHub are encapsulated in the
[`GitHub` class][github-class]. This design also helps us test the API calls and mock
out our API calls at a higher level than mocking the API JSON responses.

### Talking to the GitHub API

We use the [`@octokit/rest`][octokit-rest] library to make calls to the GitHub API.
To authenticate, you can provide an access token or provide an existing authenticated
`Octokit` instance (for example, you can provide an `Octokit` instance from a
[`probot`][probot] bot handler).

To actually open the pull request and update the code, we leverage the
[`code-suggester`][code-suggester] library.

### Reducing API calls

Where possible, we would like to cache API calls so we limit our quota usage. An example of
this is the [`RepositoryFileCache`][repository-file-cache] which is a read-through cache
for fetching file contents/data from the GitHub API.

## Versioning

### Version

We have a concrete, core class [`Version`][version] which encapsulates a semantic
version.

A [`Version`][version] instance contains:

* semver major (number)
* semver minor (number)
* semver patch (number)
* pre-release version (string)
* build (string)

### Versioning strategy

We define a [`VersioningStrategy`][versioning-strategy] interface that abstracts the
notion of how to increment a `Version` given a list of commits.

In the default case ([`DefaultVersioningStrategy`][default-versioning-strategy]):

* a breaking change will increment the semver major version
* a `feat` change will increment the semver minor version
* a `fix` change will increment the semver patch version

Note: `VersioningStrategy`s are configurable independently of the language `Strategy` so
you can mix and match versioning strategies with language support.

## Language support

`release-please` is highly extendable to support new languages and package managers. We
currently support 20+ different `Strategy` types many of which are community created and
supported.

### Strategy

We define a [`Strategy`][strategy] interface which abstracts the notion of what files to
update when proposing the next release version. In the most basic case
([`Simple`][simple-strategy]), we do not update any source files except the `CHANGELOG.md`.

**Contributor note**: Implementation-wise, most strategies inherit from the
[`BaseStrategy`][base-strategy]. This is not necessary, but it handles most of the common
behavior. If you choose to extend `BaseStrategy`, you only need to implement a single
`buildUpdates()` method (which files need to be updated).

**Contributor note**: If you implement a new `Strategy`, be sure to add a new corresponding
test to ensure we don't break it in the future.

### Updating file contents

The most common customization a `Strategy` makes is determining which standard files need to be
updated. For example, in a `nodejs` library, you will want to update the `version` entry in
your library's `package.json` (and `package-lock.json` if it exists).

We represent a file update via the [`Update`][update] interface. An `Update` contains the
path to the file needing an update, whether or not to create the file if it does not exist,
and how to update the file. The [`Updater`][update] interface is an abstraction that is
actually responsible for updating the contents of a file. An `Updater` implementation
generates updated content given the original file contents and a new version (or versions)
to update within that file.

**Contributor note**: If you implement a new `Updater`, be sure to add a new corresponding
test to ensure we don't break it in the future.

## Changelog/release notes

We define a [`ChangelogNotes`][changelog-notes] interface which abstracts the notion of how
to build a `CHANGELOG.md` entry given a list of commits. The default implementation
([`DefaultChangelogNotes`][default-changelog-notes]), uses the
`conventional-changelog-writer` library to generate standardized release notes based on
the conventionalcommits.org specification.

We also have a second implementation that uses the GitHub changelog generator API.

## Release pull request

`release-please` operates without a database of information and so it relies on GitHub as
the source of its information. Due to this, the release pull request is heavily formatted
and its structure is load-bearing.

### Branch name

The name of the HEAD branch that `release-please` creates its pull request from contains
important information that `release-please` needs.

As such, we implement a helper [`BranchName` class][branch-name] that encapsulates that
data.

The HEAD branch name is not customizable at this time.

### Pull request title

The pull request title can also contain important information that `release-please` needs.

As such, we implement a helper [`PullRequestTitle` class][pull-request-title] that
encapsulates the data. This class contains the customization logic which allows users to
customize the pull request title.

### Pull request body

The pull request body format is critical for `release-please` to operate as it includes
the changelog notes that will be included in the GitHub release.

For monorepos, it can also contain information for multiple releases so it must be
parseable.

As such, we implement a helper [`PullRequestBody` class][pull-request-body] that
encapsulates the data.

## Monorepo support

In `release-please` version 13, we integrated "manifest" releasers as a core part of the
library. Manifests were built to support monorepos, which can have many releasable
libraries in a single repository. The manifest is a JSON file that maps component path
<=> current release version. The manifest config file is a JSON file that maps component
path <=> component configuration. These files allow `release-please` to more easily track
multiple releasable libraries.

We highly recommend using manifest configurations (even for single library repositories) as
the configuration format is well defined (see schema) and it reduces the number of necessary
API calls. In fact, the original config options for `release-please` are actually converted
into a manifest configured release that only contains a single component.

### Manifest plugins

Within a single `Strategy`, we treat the library as an independent entity -- the library
does not know or care that is part of a bigger monorepo.

Plugins provide an opportunity to break that encapsulation. They operate as pre-processors
and post-processors for the `Strategy` implementations.

We provide a [`ManifestPlugin` interface][plugin] that has 2 lifecycle hooks.

The first is the `preconfigure` hook, which allows making changes to a `Strategy`'s
configuration. The second is the `run` (post-processor) hook, which allows making changes
to candidate release pull requests before they are created.

### Configuration schemas

We provide JSON-schema representations of both the manifest config and manifest versions
files. These can be found in [`schemas/`][schemas].

**Contributor note**: If you implement a new configuration option, make sure to update the
JSON-schema to allow it.

## Factories

We use a factory pattern to build all of our customizable components. This allows us to
encapsulate the logic for building these components from configuration JSON and also makes
it easier to mock for testing.

See `src/factory` and `src/factories/`.

**Contributor note**: If you implement a new configuration option, make sure to test that
we correctly build the manifest configuration from the config JSON.

## Testing

We heavily rely on unit testing to ensure `release-please` is behaving as expected. This is
a very complex codebase and we try to avoid breaking changes.

**Contributor note**: If you implement a new bugfix, please also add a new corresponding
test to ensure we don't regress in the future.

## Public interface

We only consider the binary `release-please` CLI and the exported members from the `index.ts`
as part of the public interface. Other classes' interfaces are not considered part of the
public API and are subject to modification without requiring a new major release of
`release-please`.

Typescript/Javascript has limitations in its visibility scopes. If you choose to organize
source across many files, you cannot mark things as private if you use them in other files.
For example, you could have a file `src/internal/private-class.ts` which exports `PrivateClass`
for use as an implementation detail or for testability. An external developer could use
`import {PrivateClass} from 'release-please/src/internal/private-class';` to access.

**Contributor note**: Do not make breaking changes to any exported entities from `index.ts`.
Doing so can break integrations. If the change is necessary, we will need to mark the
change as breaking and release a new major version.



[github-class]: /src/github.ts
[octokit-rest]: https://github.com/octokit/rest.js/
[probot]: https://github.com/probot/probot
[code-suggester]: https://github.com/googleapis/code-suggester
[repository-file-cache]: /src/util/file-cache.ts
[version]: /src/version.ts
[versioning-strategy]: /src/versioning-strategy.ts
[default-versioning-strategy]: /src/versioning-strategies/default.ts
[strategy]: /src/strategy.ts
[strategies]: /src/strategies/
[simple-strategy]: /src/strategies/simple.ts
[base-strategy]: /src/strategies/base.ts
[update]: /src/update.ts
[changelog-notes]: /src/changelog-notes.ts
[default-changelog-notes]: /src/changelog-notes/default.ts
[branch-name]: /src/util/branch-name.ts
[pull-request-title]: /src/util/pull-request-title.ts
[pull-request-body]: /src/util/pull-request-body.ts
[plugin]: /src/plugin.ts
[schemas]: /schemas/
