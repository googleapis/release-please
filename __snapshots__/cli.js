exports['CLI flags github-release flags 1'] = `
release-please github-release

create a GitHub release from a release PR

Options:
  --help                            Show help                          [boolean]
  --version                         Show version number                [boolean]
  --debug                           print verbose errors (use only for local
                                    debugging).       [boolean] [default: false]
  --token                           GitHub token with repo write permissions
  --api-url                         URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --default-branch                  The branch to open release PRs against and
                                    tag releases on                     [string]
  --fork                            should the PR be created from a fork
                                                      [boolean] [default: false]
  --repo-url                        GitHub URL to generate release for[required]
  --release-type                    what type of repo is a release being created
                                    for?
            [choices: "go", "go-yoshi", "java-backport", "java-bom", "java-lts",
   "java-yoshi", "krm-blueprint", "node", "ocaml", "php", "php-yoshi", "python",
   "ruby", "ruby-yoshi", "rust", "simple", "terraform-module", "helm", "elixir",
                                                                         "dart"]
  --label                           label to remove from release PR
                                               [default: "autorelease: pending"]
  --release-as                      override the semantically determined release
                                    version                             [string]
  --bump-minor-pre-major            should we bump the semver minor prior to the
                                    first major release
                                                      [boolean] [default: false]
  --bump-patch-for-minor-pre-major  should we bump the semver patch instead of
                                    the minor for non-breaking changes prior to
                                    the first major release
                                                      [boolean] [default: false]
  --path                            release from path other than root directory
                                                                        [string]
  --package-name                    name of package release is being minted for
  --monorepo-tags                   include library name in tags and release
                                    branches          [boolean] [default: false]
  --version-file                    path to version file to update, e.g.,
                                    version.rb
  --last-package-version            last version # that package was released as
  --snapshot                        is it a snapshot (or pre-release) being
                                    generated?        [boolean] [default: false]
  --pull-request-title-pattern      Title pattern to make release PR    [string]
  --signoff                         Add Signed-off-by line at the end of the
                                    commit log message using the user and email
                                    provided. (format "Name
                                    <email@example.com>").              [string]
  --changelog-path                  where can the CHANGELOG be found in the
                                    project?           [default: "CHANGELOG.md"]
  --latest-tag-version              Override the detected latest tag version
                                                                        [string]
  --latest-tag-sha                  Override the detected latest tag SHA[string]
  --latest-tag-name                 Override the detected latest tag name
                                                                        [string]
  --draft                           mark release as a draft. no tag is created
                                    but tag_name and target_commitish are
                                    associated with the release for future tag
                                    creation upon "un-drafting" the release.
                                                      [boolean] [default: false]
  --release-label                   set a pull request label other than
                                    "autorelease: tagged"               [string]
  --notes-header                    optionally add block of text before github
                                    release notes. Text can be templated with
                                    handlebars.js syntax. The template will have
                                    these partials exposed: {{> version | tag |
                                    githubRepo | githubOwner | changelogPath |
                                    PRNumber | PRSha | PRTitle }}. Literal line
                                    feeds replaced with newlines.       [string]
  --notes-footer                    optionally add block of text after github
                                    release notes. Text can be templated with
                                    handlebars.js syntax. The template will have
                                    these partials exposed: {{> version | tag |
                                    githubRepo | githubOwner | changelogPath |
                                    PRNumber | PRSha | PRTitle }}. Literal line
                                    feeds replaced with newlines.       [string]
`

exports['CLI flags latest-tag flags 1'] = `
release-please latest-tag

find the sha of the latest release

Options:
  --help                            Show help                          [boolean]
  --version                         Show version number                [boolean]
  --debug                           print verbose errors (use only for local
                                    debugging).       [boolean] [default: false]
  --token                           GitHub token with repo write permissions
  --api-url                         URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --default-branch                  The branch to open release PRs against and
                                    tag releases on                     [string]
  --fork                            should the PR be created from a fork
                                                      [boolean] [default: false]
  --repo-url                        GitHub URL to generate release for[required]
  --release-type                    what type of repo is a release being created
                                    for?
            [choices: "go", "go-yoshi", "java-backport", "java-bom", "java-lts",
   "java-yoshi", "krm-blueprint", "node", "ocaml", "php", "php-yoshi", "python",
   "ruby", "ruby-yoshi", "rust", "simple", "terraform-module", "helm", "elixir",
                                                       "dart"] [default: "node"]
  --label                           label to remove from release PR
                                               [default: "autorelease: pending"]
  --release-as                      override the semantically determined release
                                    version                             [string]
  --bump-minor-pre-major            should we bump the semver minor prior to the
                                    first major release
                                                      [boolean] [default: false]
  --bump-patch-for-minor-pre-major  should we bump the semver patch instead of
                                    the minor for non-breaking changes prior to
                                    the first major release
                                                      [boolean] [default: false]
  --path                            release from path other than root directory
                                                                        [string]
  --package-name                    name of package release is being minted for
  --monorepo-tags                   include library name in tags and release
                                    branches          [boolean] [default: false]
  --version-file                    path to version file to update, e.g.,
                                    version.rb
  --last-package-version            last version # that package was released as
  --snapshot                        is it a snapshot (or pre-release) being
                                    generated?        [boolean] [default: false]
  --pull-request-title-pattern      Title pattern to make release PR    [string]
  --signoff                         Add Signed-off-by line at the end of the
                                    commit log message using the user and email
                                    provided. (format "Name
                                    <email@example.com>").              [string]
  --changelog-path                  where can the CHANGELOG be found in the
                                    project?           [default: "CHANGELOG.md"]
  --latest-tag-version              Override the detected latest tag version
                                                                        [string]
  --latest-tag-sha                  Override the detected latest tag SHA[string]
  --latest-tag-name                 Override the detected latest tag name
                                                                        [string]
`

exports['CLI flags manifest-pr flags 1'] = `
release-please manifest-pr

create a release-PR using a manifest file

Options:
  --help            Show help                                          [boolean]
  --version         Show version number                                [boolean]
  --debug           print verbose errors (use only for local debugging).
                                                      [boolean] [default: false]
  --token           GitHub token with repo write permissions
  --api-url         URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --default-branch  The branch to open release PRs against and tag releases on
                                                                        [string]
  --fork            should the PR be created from a fork
                                                      [boolean] [default: false]
  --repo-url        GitHub URL to generate release for                [required]
  --config-file     where can the config file be found in the project?
                                         [default: "release-please-config.json"]
  --manifest-file   where can the manifest file be found in the project?
                                      [default: ".release-please-manifest.json"]
`

exports['CLI flags manifest-release flags 1'] = `
release-please manifest-release

create releases/tags from last release-PR using a manifest file

Options:
  --help            Show help                                          [boolean]
  --version         Show version number                                [boolean]
  --debug           print verbose errors (use only for local debugging).
                                                      [boolean] [default: false]
  --token           GitHub token with repo write permissions
  --api-url         URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --default-branch  The branch to open release PRs against and tag releases on
                                                                        [string]
  --fork            should the PR be created from a fork
                                                      [boolean] [default: false]
  --repo-url        GitHub URL to generate release for                [required]
  --config-file     where can the config file be found in the project?
                                         [default: "release-please-config.json"]
  --manifest-file   where can the manifest file be found in the project?
                                      [default: ".release-please-manifest.json"]
`

exports['CLI flags release-pr flags 1'] = `
release-please release-pr

create or update a PR representing the next release

Options:
  --help                            Show help                          [boolean]
  --version                         Show version number                [boolean]
  --debug                           print verbose errors (use only for local
                                    debugging).       [boolean] [default: false]
  --token                           GitHub token with repo write permissions
  --api-url                         URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --default-branch                  The branch to open release PRs against and
                                    tag releases on                     [string]
  --fork                            should the PR be created from a fork
                                                      [boolean] [default: false]
  --repo-url                        GitHub URL to generate release for[required]
  --release-type                    what type of repo is a release being created
                                    for?
            [choices: "go", "go-yoshi", "java-backport", "java-bom", "java-lts",
   "java-yoshi", "krm-blueprint", "node", "ocaml", "php", "php-yoshi", "python",
   "ruby", "ruby-yoshi", "rust", "simple", "terraform-module", "helm", "elixir",
                                                       "dart"] [default: "node"]
  --label                           label to remove from release PR
                                               [default: "autorelease: pending"]
  --release-as                      override the semantically determined release
                                    version                             [string]
  --bump-minor-pre-major            should we bump the semver minor prior to the
                                    first major release
                                                      [boolean] [default: false]
  --bump-patch-for-minor-pre-major  should we bump the semver patch instead of
                                    the minor for non-breaking changes prior to
                                    the first major release
                                                      [boolean] [default: false]
  --path                            release from path other than root directory
                                                                        [string]
  --package-name                    name of package release is being minted for
  --monorepo-tags                   include library name in tags and release
                                    branches          [boolean] [default: false]
  --version-file                    path to version file to update, e.g.,
                                    version.rb
  --last-package-version            last version # that package was released as
  --snapshot                        is it a snapshot (or pre-release) being
                                    generated?        [boolean] [default: false]
  --pull-request-title-pattern      Title pattern to make release PR    [string]
  --signoff                         Add Signed-off-by line at the end of the
                                    commit log message using the user and email
                                    provided. (format "Name
                                    <email@example.com>").              [string]
  --changelog-path                  where can the CHANGELOG be found in the
                                    project?           [default: "CHANGELOG.md"]
  --latest-tag-version              Override the detected latest tag version
                                                                        [string]
  --latest-tag-sha                  Override the detected latest tag SHA[string]
  --latest-tag-name                 Override the detected latest tag name
                                                                        [string]
`
