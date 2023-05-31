exports['LinkedVersions plugin can skip grouping pull requests 1'] = `
:robot: I have created a release *beep* *boop*
---


## [1.0.1](https://github.com/fake-owner/fake-repo/compare/pkg1-v1.0.0...pkg1-v1.0.1) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['LinkedVersions plugin can skip grouping pull requests 2'] = `
:robot: I have created a release *beep* *boop*
---


## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg2-v0.2.3...pkg2-v0.2.4) (1983-10-10)


### Bug Fixes

* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['LinkedVersions plugin can skip grouping pull requests 3'] = `
:robot: I have created a release *beep* *boop*
---


## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg3-v0.2.3...pkg3-v0.2.4) (1983-10-10)


### Miscellaneous Chores

* **pkg3:** Synchronize group name versions

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['LinkedVersions plugin should allow multiple groups of linked versions 1'] = `
:robot: I have created a release *beep* *boop*
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
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['LinkedVersions plugin should allow multiple groups of linked versions 2'] = `
:robot: I have created a release *beep* *boop*
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
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['LinkedVersions plugin should group pull requests 1'] = `
:robot: I have created a release *beep* *boop*
---


## [1.0.1](https://github.com/fake-owner/fake-repo/compare/pkg1-v1.0.0...pkg1-v1.0.1) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['LinkedVersions plugin should group pull requests 2'] = `
:robot: I have created a release *beep* *boop*
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
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['LinkedVersions plugin should sync versions pull requests 1'] = `
:robot: I have created a release *beep* *boop*
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
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
