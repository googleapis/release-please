exports['CLI --help github-release 1'] = `
release-please github-release

create a GitHub release from a release PR

Options:
  --help                        Show help                              [boolean]
  --version                     Show version number                    [boolean]
  --debug                       print verbose errors (use only for local
                                debugging).           [boolean] [default: false]
  --trace                       print extra verbose errors (use only for local
                                debugging).           [boolean] [default: false]
  --token                       GitHub token with repo write permissions
  --api-url                     URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --graphql-url                 URL to use when making GraphQL requests
                                    [string] [default: "https://api.github.com"]
  --default-branch              The branch to open release PRs against and tag
                                releases on
                              [deprecated: use --target-branch instead] [string]
  --target-branch               The branch to open release PRs against and tag
                                releases on                             [string]
  --repo-url                    GitHub URL to generate release for    [required]
  --dry-run                     Prepare but do not take action
                                                      [boolean] [default: false]
  --monorepo-tags               include library name in tags and release
                                branches              [boolean] [default: false]
  --pull-request-title-pattern  Title pattern to make release PR        [string]
  --path                        release from path other than root directory
                                                                        [string]
  --component                   name of component release is being minted for
                                                                        [string]
  --package-name                name of package release is being minted for
                                                                        [string]
  --release-type                what type of repo is a release being created
                                for?
          [choices: "dart", "elixir", "go", "go-yoshi", "helm", "java-backport",
  "java-bom", "java-lts", "java-yoshi", "krm-blueprint", "node", "ocaml", "php",
                  "php-yoshi", "python", "ruby", "ruby-yoshi", "rust", "simple",
                                                             "terraform-module"]
  --config-file                 where can the config file be found in the
                                project? [default: "release-please-config.json"]
  --manifest-file               where can the manifest file be found in the
                                project?
                                      [default: ".release-please-manifest.json"]
  --draft                       mark release as a draft. no tag is created but
                                tag_name and target_commitish are associated
                                with the release for future tag creation upon
                                "un-drafting" the release.
                                                      [boolean] [default: false]
  --prerelease                  mark release that have prerelease versions as as
                                a prerelease on Github[boolean] [default: false]
  --label                       comma-separated list of labels to remove to from
                                release PR     [default: "autorelease: pending"]
  --release-label               set a pull request label other than
                                "autorelease: tagged"
                                       [string] [default: "autorelease: tagged"]
`

exports['CLI --help manifest-pr 1'] = `
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
`

exports['CLI --help manifest-release 1'] = `
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
  --prerelease      mark release that have prerelease versions as as a
                    prerelease on Github              [boolean] [default: false]
  --label           comma-separated list of labels to remove to from release PR
                                               [default: "autorelease: pending"]
  --release-label   set a pull request label other than "autorelease: tagged"
                                       [string] [default: "autorelease: tagged"]
  --config-file     where can the config file be found in the project?
                                         [default: "release-please-config.json"]
  --manifest-file   where can the manifest file be found in the project?
                                      [default: ".release-please-manifest.json"]
`

exports['CLI --help release-pr 1'] = `
release-please release-pr

create or update a PR representing the next release

Options:
  --help                            Show help                          [boolean]
  --version                         Show version number                [boolean]
  --debug                           print verbose errors (use only for local
                                    debugging).       [boolean] [default: false]
  --trace                           print extra verbose errors (use only for
                                    local debugging). [boolean] [default: false]
  --token                           GitHub token with repo write permissions
  --api-url                         URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --graphql-url                     URL to use when making GraphQL requests
                                    [string] [default: "https://api.github.com"]
  --default-branch                  The branch to open release PRs against and
                                    tag releases on
                              [deprecated: use --target-branch instead] [string]
  --target-branch                   The branch to open release PRs against and
                                    tag releases on                     [string]
  --repo-url                        GitHub URL to generate release for[required]
  --dry-run                         Prepare but do not take action
                                                      [boolean] [default: false]
  --release-as                      override the semantically determined release
                                    version                             [string]
  --bump-minor-pre-major            should we bump the semver minor prior to the
                                    first major release
                                                      [boolean] [default: false]
  --bump-patch-for-minor-pre-major  should we bump the semver patch instead of
                                    the minor for non-breaking changes prior to
                                    the first major release
                                                      [boolean] [default: false]
  --extra-files                     extra files for the strategy to consider
                                                                        [string]
  --version-file                    path to version file to update, e.g.,
                                    version.rb                          [string]
  --snapshot                        is it a snapshot (or pre-release) being
                                    generated?        [boolean] [default: false]
  --versioning-strategy             strategy used for bumping versions
  [choices: "default", "always-bump-patch", "service-pack"] [default: "default"]
  --changelog-path                  where can the CHANGELOG be found in the
                                    project?  [string] [default: "CHANGELOG.md"]
  --changelog-type                  type of changelog to build
                                                  [choices: "default", "github"]
  --changelog-sections              comma-separated list of scopes to include in
                                    the changelog                       [string]
  --last-package-version            last version # that package was released as
                         [deprecated: use --latest-tag-version instead] [string]
  --latest-tag-version              Override the detected latest tag version
                                                                        [string]
  --latest-tag-sha                  Override the detected latest tag SHA[string]
  --latest-tag-name                 Override the detected latest tag name
                                                                        [string]
  --label                           comma-separated list of labels to add to
                                    from release PR
                                               [default: "autorelease: pending"]
  --fork                            should the PR be created from a fork
                                                      [boolean] [default: false]
  --draft-pull-request              mark pull request as a draft
                                                      [boolean] [default: false]
  --signoff                         Add Signed-off-by line at the end of the
                                    commit log message using the user and email
                                    provided. (format "Name
                                    <email@example.com>").              [string]
  --monorepo-tags                   include library name in tags and release
                                    branches          [boolean] [default: false]
  --pull-request-title-pattern      Title pattern to make release PR    [string]
  --path                            release from path other than root directory
                                                                        [string]
  --component                       name of component release is being minted
                                    for                                 [string]
  --package-name                    name of package release is being minted for
                                                                        [string]
  --release-type                    what type of repo is a release being created
                                    for?
          [choices: "dart", "elixir", "go", "go-yoshi", "helm", "java-backport",
  "java-bom", "java-lts", "java-yoshi", "krm-blueprint", "node", "ocaml", "php",
                  "php-yoshi", "python", "ruby", "ruby-yoshi", "rust", "simple",
                                                             "terraform-module"]
  --config-file                     where can the config file be found in the
                                    project?
                                         [default: "release-please-config.json"]
  --manifest-file                   where can the manifest file be found in the
                                    project?
                                      [default: ".release-please-manifest.json"]
`

exports['CLI handleError handles an error 1'] = [
  "command foobar failed with status 404"
]
