[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."
<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [Release Please](https://github.com/googleapis/release-please)


[![release level](https://img.shields.io/badge/release%20level-beta-yellow.svg?style=flat)](https://cloud.google.com/terms/launch-stages)
[![npm version](https://img.shields.io/npm/v/release-please.svg)](https://www.npmjs.org/package/release-please)
[![codecov](https://img.shields.io/codecov/c/github/googleapis/release-please/master.svg?style=flat)](https://codecov.io/gh/googleapis/release-please)




`release-please` generates GitHub PRs for library releases based on the
[conventionalcommits.org](https://www.conventionalcommits.org) commit
specification and [SemVer](https://semver.org/).

_Release Please_ can be configured (using [GitHub Actions](https://github.com/features/actions),
a cron, or a step during CI/CD) to maintain a PR that represents the next release
of your library.

When the candidate PR is merged, _Release Please_ can be configured to create
a [GitHub Release](https://help.github.com/en/articles/creating-releases).

Here's an [example of Release Please in action](https://github.com/googleapis/nodejs-logging/pull/487).

### The _Release Please_ Repository:




* [github.com/googleapis/release-please](https://github.com/googleapis/release-please)

Read more about the client libraries for Cloud APIs, including the older
Google APIs Client Libraries, in [Client Libraries Explained][explained].

[explained]: https://cloud.google.com/apis/docs/client-libraries-explained

**Table of contents:**


* [Quickstart](#quickstart)

  * [Installing the client library](#installing-the-client-library)


* [Versioning](#versioning)
* [Contributing](#contributing)
* [License](#license)

## Quickstart

### Installing the client library

```bash
npm install release-please
```

## Maintaining a Release PR

To configure _Release Please_ to maintain an up-to-date release
pull-request on your repository, setup the following command to execute
when changes are pushed to `master`:

```bash
release-please release-pr --package-name=@google-cloud/firestore" \
  --repo-url=googleapis/nodejs-firestore \
  --token=$GITHUB_TOKEN
```

* `--package-name`: is the name of the package to publish to publish to
  an upstream registry such as npm.
* `--repo-url`: is the URL of the repository on GitHub.
* `--token`: a token with write access to `--repo-url`.

### Creating GitHub Releases

To configure _Release Please_ to generate GitHub Releases when release
pull-requests are merged to `master`, setup the following command to
execute when changes are pushed to `master`:

```bash
release-please github-release --repo-url=googleapis/nodejs-firestore \
  --token=$GITHUB_TOKEN
```

* `--repo-url`: is the URL of the repository on GitHub.
* `--token`: a token with write access to `--repo-url`.

### GitHub Actions

An elegant way to configure `Release Please` is through
[GitHub Actions](https://github.com/features/actions). To generate a
`main.workflow` for `Release Please`, simply run:

```bash
release-please generate-action --package-name=@google-cloud/firestore"
```

* `--package-name`: is the name of the package to publish to publish to
  an upstream registry such as npm.



## Versioning

This library follows [Semantic Versioning](http://semver.org/).



This library is considered to be in **beta**. This means it is expected to be
mostly stable while we work toward a general availability release; however,
complete stability is not guaranteed. We will address issues and requests
against beta libraries with a high priority.




More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/googleapis/release-please/blob/master/CONTRIBUTING.md).

Please note that this `README.md`, the `samples/README.md`,
and a variety of configuration files in this repository (including `.nycrc` and `tsconfig.json`)
are generated from a central template. To edit one of these files, make an edit
to its template in this
[directory](https://github.com/googleapis/synthtool/tree/master/synthtool/gcp/templates/node_library).

## License

Apache Version 2.0

See [LICENSE](https://github.com/googleapis/release-please/blob/master/LICENSE)



[shell_img]: https://gstatic.com/cloudssh/images/open-btn.png
[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing

[auth]: https://cloud.google.com/docs/authentication/getting-started
