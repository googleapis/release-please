# Troubleshooting

## Debugging with the CLI

The easiest way to debug your `release-please` configuration is to use the bundled
CLI. 

To use the CLI, you will need to use a GitHub
[personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token):

```bash
# install the release-please binary
npm install -g release-please

export GITHUB_TOKEN="my-access-token"
release-please release-pr \
  --token=${GITHUB_TOKEN} \
  --repo-url=my-owner/my-repo \
  --debug \
  --dry-run
```

The CLI provides a `--dry-run` mode which will tell you what it would do without
actually doing it (i.e. without opening a pull request or tagging releases).
Additionally, we provide log level options `--debug` or `--trace` which will
show more in-depth logging and should help give you insight into what `release-please`
is trying to do.

### Testing in another branch

When testing out a new change to the `release-please-config.json`, make the change
in a new branch on the actual repository (not a fork). `release-please` relies on
pull requests, releases, and tags which are not copied when you fork the original
repository.

After pushing your change to the new branch, you can target the new branch using
the `--target-branch` option.

```bash
export GITHUB_TOKEN="my-access-token"
release-please release-pr \
  --token=${GITHUB_TOKEN} \
  --repo-url=my-owner/my-repo \
  --target-branch=my-test-branch \
  --debug \
  --dry-run
```

## Frequently Asked Questions

### What is a component?

A component is an individually releasable artifact or group of
artifacts within a repository.

The most common configuration is for a single repository to
release a single package. In this case, the releases and tags
with have simple versions like `v1.2.3`. In this case, you
will not need to configure a `component` in the configuration.

In the case of a monorepo, you may have separate, independently
releaseable artifacts. In this case, the releases will use a
`component` prefix for the release and tag like
`my-component-v1.2.3`. This allows you to have separate releases
and tags for each component for version `1.2.3`.

You will need to configure a `component` name in the manifest
config for each of your independent modules (separated by
code path):

```json
{
  "packages": {
    "path/to/pkg-a": {
      "component": "pkg-a"
    },
    "path/to/pkg-b": {
      "component": "pkg-b"
    }
  }
}
```

### How does release-please determine the previous release?

#### If you are using a manifest config (highly advised)

`release-please` reads the latest released version from the
manifest file (`.release-please-manifest.json`). The file is a map
of component path to the latest release version. In a single
component setup, the path should be `.`. `release-please` tries to
identify the commit SHA of that release version by looking at
recent releases and falling back to looking at the expected tag name.

#### If you are NOT using a manifest config

`release-please` uses a few methods to try determine the latest
release. Note that this process can be fragile and will require
more API calls (which is one reason a manifest config is preferred).

1. Iterate through the last 250 commits on the target branch and
   look for an associated release pull request. If found, extract
   the latest release version from that pull request.
2. Iterate through the latest releases and compare against commit
   SHAs seen in the last 250 commits on the target branch. This
   is to ensure that the release happened on this target branch.
3. Iterate through the latest tags and compare against commit
   SHAs seen in the last 250 commits on the branch. This is to
   ensure that the tag happened on this target branch.

### What if my release PR is merged with `autorelease:closed`?
The release PR will be tagged with `autorelease:closed` on closing of the PR, but it will not be tagged with `autorelease:pending` on re-opening of the PR. Hence if a release PR was accidentally closed and re-opened before merging to main, release-please wouldn't be triggred. In such case, please manually remove `autorelease:closed`, add `autorelease: pending` and `release-please:force-run` to the release PR to force re-trigger the release process. See https://github.com/googleapis/google-cloud-java/pull/10615 for example.
