exports['Plugin compatibility linked-versions and workspace should version bump dependencies together 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>pkgA: 1.1.0</summary>

## [1.1.0](https://github.com/fake-owner/fake-repo/compare/pkgA-v1.0.0...pkgA-v1.1.0) (1983-10-10)


### Features

* some feature ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
</details>

<details><summary>pkgB: 1.1.0</summary>

## [1.1.0](https://github.com/fake-owner/fake-repo/compare/pkgB-v1.0.0...pkgB-v1.1.0) (1983-10-10)


### Miscellaneous Chores

* **pkgB:** Synchronize my group versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgA bumped from 1.0.0 to 1.1.0
</details>

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.
`
