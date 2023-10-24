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
  --plugin                      load plugin named release-please-<plugin-name>
                                                           [array] [default: []]
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
  --use-graphql                 Whether or not the GraphQL API should be used.
                                If false, the REST API will be used instead.
                                                       [boolean] [default: true]
  --include-v-in-tags           include "v" in tag versions
                                                       [boolean] [default: true]
  --monorepo-tags               include library name in tags and release
                                branches              [boolean] [default: false]
  --pull-request-title-pattern  Title pattern to make release PR        [string]
  --pull-request-header         Header for release PR                   [string]
  --path                        release from path other than root directory
                                                                        [string]
  --component                   name of component release is being minted for
                                                                        [string]
  --package-name                name of package release is being minted for
                                                                        [string]
  --release-type                what type of repo is a release being created
                                for?
   [choices: "dart", "dotnet-yoshi", "elixir", "expo", "go", "go-yoshi", "helm",
                  "java", "java-backport", "java-bom", "java-lts", "java-yoshi",
       "java-yoshi-mono-repo", "krm-blueprint", "maven", "node", "ocaml", "php",
          "php-yoshi", "python", "ruby", "rust", "salesforce", "sfdx", "simple",
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
  --prerelease-label            set a pre-release pull request label other than
                                "autorelease: pre-release"
                                  [string] [default: "autorelease: pre-release"]
  --snapshot-label              set a java snapshot pull request label other
                                than "autorelease: snapshot"
                                     [string] [default: "autorelease: snapshot"]
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
  --plugin              load plugin named release-please-<plugin-name>
                                                           [array] [default: []]
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
  --use-graphql         Whether or not the GraphQL API should be used. If false,
                        the REST API will be used instead.
                                                       [boolean] [default: true]
  --label               comma-separated list of labels to add to from release PR
                                               [default: "autorelease: pending"]
  --skip-labeling       skip application of labels to pull requests
                                                      [boolean] [default: false]
  --fork                should the PR be created from a fork
                                                      [boolean] [default: false]
  --changes-branch      If provided, override the branch used to find
                        conventional commits with changes for new version
                                                                        [string]
  --draft-pull-request  mark pull request as a draft  [boolean] [default: false]
  --signoff             Add Signed-off-by line at the end of the commit log
                        message using the user and email provided. (format "Name
                        <email@example.com>").                          [string]
  --reviewers           Github usernames that should be assigned as reviewers to
                        the release pull request                        [string]
  --config-file         where can the config file be found in the project?
                                         [default: "release-please-config.json"]
  --manifest-file       where can the manifest file be found in the project?
                                      [default: ".release-please-manifest.json"]
`

exports['CLI --help manifest-release 1'] = `
release-please manifest-release

create releases/tags from last release-PR using a manifest file

Options:
  --help              Show help                                        [boolean]
  --version           Show version number                              [boolean]
  --debug             print verbose errors (use only for local debugging).
                                                      [boolean] [default: false]
  --trace             print extra verbose errors (use only for local debugging).
                                                      [boolean] [default: false]
  --plugin            load plugin named release-please-<plugin-name>
                                                           [array] [default: []]
  --token             GitHub token with repo write permissions
  --api-url           URL to use when making API requests
                                    [string] [default: "https://api.github.com"]
  --graphql-url       URL to use when making GraphQL requests
                                    [string] [default: "https://api.github.com"]
  --default-branch    The branch to open release PRs against and tag releases on
                              [deprecated: use --target-branch instead] [string]
  --target-branch     The branch to open release PRs against and tag releases on
                                                                        [string]
  --repo-url          GitHub URL to generate release for              [required]
  --dry-run           Prepare but do not take action  [boolean] [default: false]
  --use-graphql       Whether or not the GraphQL API should be used. If false,
                      the REST API will be used instead.
                                                       [boolean] [default: true]
  --draft             mark release as a draft. no tag is created but tag_name
                      and target_commitish are associated with the release for
                      future tag creation upon "un-drafting" the release.
                                                      [boolean] [default: false]
  --prerelease        mark release that have prerelease versions as as a
                      prerelease on Github            [boolean] [default: false]
  --label             comma-separated list of labels to remove to from release
                      PR                       [default: "autorelease: pending"]
  --release-label     set a pull request label other than "autorelease: tagged"
                                       [string] [default: "autorelease: tagged"]
  --prerelease-label  set a pre-release pull request label other than
                      "autorelease: pre-release"
                                  [string] [default: "autorelease: pre-release"]
  --snapshot-label    set a java snapshot pull request label other than
                      "autorelease: snapshot"
                                     [string] [default: "autorelease: snapshot"]
  --config-file       where can the config file be found in the project?
                                         [default: "release-please-config.json"]
  --manifest-file     where can the manifest file be found in the project?
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
  --plugin                          load plugin named
                                    release-please-<plugin-name>
                                                           [array] [default: []]
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
  --use-graphql                     Whether or not the GraphQL API should be
                                    used. If false, the REST API will be used
                                    instead.           [boolean] [default: true]
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
        [choices: "always-bump-major", "always-bump-minor", "always-bump-patch",
                   "default", "prerelease", "service-pack"] [default: "default"]
  --changelog-path                  where can the CHANGELOG be found in the
                                    project?  [string] [default: "CHANGELOG.md"]
  --changelog-type                  type of changelog to build
                                                  [choices: "default", "github"]
  --changelog-sections              comma-separated list of scopes to include in
                                    the changelog                       [string]
  --changelog-host                  host for hyperlinks in the changelog[string]
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
  --skip-labeling                   skip application of labels to pull requests
                                                      [boolean] [default: false]
  --fork                            should the PR be created from a fork
                                                      [boolean] [default: false]
  --changes-branch                  If provided, override the branch used to
                                    find conventional commits with changes for
                                    new version                         [string]
  --draft-pull-request              mark pull request as a draft
                                                      [boolean] [default: false]
  --signoff                         Add Signed-off-by line at the end of the
                                    commit log message using the user and email
                                    provided. (format "Name
                                    <email@example.com>").              [string]
  --reviewers                       Github usernames that should be assigned as
                                    reviewers to the release pull request
                                                                        [string]
  --include-v-in-tags               include "v" in tag versions
                                                       [boolean] [default: true]
  --monorepo-tags                   include library name in tags and release
                                    branches          [boolean] [default: false]
  --pull-request-title-pattern      Title pattern to make release PR    [string]
  --pull-request-header             Header for release PR               [string]
  --path                            release from path other than root directory
                                                                        [string]
  --component                       name of component release is being minted
                                    for                                 [string]
  --package-name                    name of package release is being minted for
                                                                        [string]
  --release-type                    what type of repo is a release being created
                                    for?
   [choices: "dart", "dotnet-yoshi", "elixir", "expo", "go", "go-yoshi", "helm",
                  "java", "java-backport", "java-bom", "java-lts", "java-yoshi",
       "java-yoshi-mono-repo", "krm-blueprint", "maven", "node", "ocaml", "php",
          "php-yoshi", "python", "ruby", "rust", "salesforce", "sfdx", "simple",
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
