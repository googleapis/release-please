[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."
<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [Release Please](https://github.com/googleapis/release-please)


[![release level](https://img.shields.io/badge/release%20level-alpha-orange.svg?style=flat)](https://cloud.google.com/terms/launch-stages)
[![npm version](https://img.shields.io/npm/v/release-please.svg)](https://www.npmjs.org/package/release-please)
[![codecov](https://img.shields.io/codecov/c/github/googleapis/release-please/master.svg?style=flat)](https://codecov.io/gh/googleapis/release-please)




`release-please` generates GitHub PRs for library releases, based on the
[conventionalcommits.org](https://www.conventionalcommits.org) commit
specification.

The generated PR:

* determines the next version that a library should be released as (based
  on [SemVer](https://semver.org/)).
* updates language-specifc files, `.gemspec`, `package.json`, `setup.py`, etc.,
  with the appropriate version.
* generates a CHANGELOG with information pertinent to library consumers.
* adds tags to the PR, providing contextual information to automation tools furhter
  down the pipeline, e.g., `autorelease: pending`.




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

## CLI Commands

When running CLI commands, set the `GH_TOKEN` environment variable to
a [token you've generated](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line)
with write permissions for the repo you're interacting with.

### Minting a Release

Generates a new release, based on the commit history since the last release
that was tagged:

```bash
release-please mint-release  --repo-url=git@github.com:bcoe/my-fake-repo.git
  --package-name=@google-cloud/fake --release-type=node
```

* `--repo-url`: the GitHub URL of the repository the release is being
  generated for.
* `--package-name`: the name of the package that will ultimately be published
  (to `npm`, `PyPi`, `RubyGems`, etc.).
* `--release-type`: what type of release is being created, possible values:
  * `node`: a simple Node.js repo (not a mono-repo).



## Versioning

This library follows [Semantic Versioning](http://semver.org/).




This library is considered to be in **alpha**. This means it is still a
work-in-progress and under active development. Any release is subject to
backwards-incompatible changes at any time.



More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/googleapis/release-please/blob/master/CONTRIBUTING.md).

## License

Apache Version 2.0

See [LICENSE](https://github.com/googleapis/release-please/blob/master/LICENSE)



[shell_img]: https://gstatic.com/cloudssh/images/open-btn.png
[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing

[auth]: https://cloud.google.com/docs/authentication/getting-started