exports['Plugin compatibility linked-versions and group-pull-request-title-pattern should find release to create 1'] = `
:robot: I have created a release *beep* *boop*
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
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
