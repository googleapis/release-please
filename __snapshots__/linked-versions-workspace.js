exports['Plugin compatibility linked-versions and workspace should version bump dependencies together 1'] = `
:robot: I have created a release *beep* *boop*
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
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
