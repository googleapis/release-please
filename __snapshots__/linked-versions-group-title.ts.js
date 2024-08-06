exports['Plugin compatibility linked-versions and group-pull-request-title-pattern should find release to create 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>primary: 1.1.0</summary>

## [1.1.0](https://github.com/fake-owner/fake-repo/compare/primary-v1.0.0...primary-v1.1.0) (1983-10-10)


### Features

* some feature ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
</details>

<details><summary>pkgA: 1.1.0</summary>

## [1.1.0](https://github.com/fake-owner/fake-repo/compare/pkgA-v1.0.0...pkgA-v1.1.0) (1983-10-10)


### Features

* some feature ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
</details>

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`
