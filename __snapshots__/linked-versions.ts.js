exports['LinkedVersions plugin can skip grouping pull requests 1'] = `
:sparkles: Stainless prepared a new release
---


## [1.0.1](https://github.com/fake-owner/fake-repo/compare/pkg1-v1.0.0...pkg1-v1.0.1) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.
`

exports['LinkedVersions plugin can skip grouping pull requests 2'] = `
:sparkles: Stainless prepared a new release
---


## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg2-v0.2.3...pkg2-v0.2.4) (1983-10-10)


### Bug Fixes

* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.
`

exports['LinkedVersions plugin can skip grouping pull requests 3'] = `
:sparkles: Stainless prepared a new release
---


## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg3-v0.2.3...pkg3-v0.2.4) (1983-10-10)


### Miscellaneous Chores

* **pkg3:** Synchronize group name versions

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.
`

exports['LinkedVersions plugin should allow multiple groups of linked versions 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>pkg1: 1.0.1</summary>

## [1.0.1](https://github.com/fake-owner/fake-repo/compare/pkg1-v1.0.0...pkg1-v1.0.1) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
</details>

<details><summary>pkg4: 1.0.1</summary>

## [1.0.1](https://github.com/fake-owner/fake-repo/compare/pkg4-v1.0.0...pkg4-v1.0.1) (1983-10-10)


### Miscellaneous Chores

* **pkg4:** Synchronize second group name versions
</details>

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.
`

exports['LinkedVersions plugin should allow multiple groups of linked versions 2'] = `
release-please--branches--target-branch--groups--second-group-name
`

exports['LinkedVersions plugin should allow multiple groups of linked versions 3'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>pkg2: 0.2.4</summary>

## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg2-v0.2.3...pkg2-v0.2.4) (1983-10-10)


### Bug Fixes

* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))
</details>

<details><summary>pkg3: 0.2.4</summary>

## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg3-v0.2.3...pkg3-v0.2.4) (1983-10-10)


### Miscellaneous Chores

* **pkg3:** Synchronize group name versions
</details>

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.
`

exports['LinkedVersions plugin should allow multiple groups of linked versions 4'] = `
release-please--branches--target-branch--groups--group-name
`

exports['LinkedVersions plugin should group pull requests 1'] = `
:sparkles: Stainless prepared a new release
---


## [1.0.1](https://github.com/fake-owner/fake-repo/compare/pkg1-v1.0.0...pkg1-v1.0.1) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.
`

exports['LinkedVersions plugin should group pull requests 2'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>pkg2: 0.2.4</summary>

## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg2-v0.2.3...pkg2-v0.2.4) (1983-10-10)


### Bug Fixes

* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))
</details>

<details><summary>pkg3: 0.2.4</summary>

## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg3-v0.2.3...pkg3-v0.2.4) (1983-10-10)


### Miscellaneous Chores

* **pkg3:** Synchronize group name versions
</details>

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.
`

exports['LinkedVersions plugin should sync versions pull requests 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>pkg1: 1.0.1</summary>

## [1.0.1](https://github.com/fake-owner/fake-repo/compare/pkg1-v1.0.0...pkg1-v1.0.1) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
</details>

<details><summary>pkg2: 0.2.4</summary>

## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg2-v0.2.3...pkg2-v0.2.4) (1983-10-10)


### Bug Fixes

* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))
</details>

<details><summary>pkg3: 0.2.4</summary>

## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg3-v0.2.3...pkg3-v0.2.4) (1983-10-10)


### Miscellaneous Chores

* **pkg3:** Synchronize group name versions
</details>

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request ([see details](https://github.com/stainless-api/release-please/#linear-git-commit-history-use-squash-merge)).

_More technical details can be found at [stainless-api/release-please](https://github.com/stainless-api/release-please)_.
`
