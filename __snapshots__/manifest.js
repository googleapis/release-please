exports['Manifest buildPullRequests should allow creating multiple pull requests 1'] = `
:robot: I have created a release *beep* *boop*
---


## [1.0.1](https://github.com/fake-owner/fake-repo/compare/pkg1-v1.0.0...pkg1-v1.0.1) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['Manifest buildPullRequests should allow creating multiple pull requests 2'] = `
:robot: I have created a release *beep* *boop*
---


## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg2-v0.2.3...pkg2-v0.2.4) (1983-10-10)


### Bug Fixes

* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['Manifest buildPullRequests should allow customizing pull request title with root package with SPACE in component 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>root: 1.2.2</summary>

## [1.2.2](https://github.com/fake-owner/fake-repo/compare/root-v1.2.1...root-v1.2.2) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))
* some bugfix ([cccccc](https://github.com/fake-owner/fake-repo/commit/cccccc))
</details>

<details><summary>pkg1: 1.0.2</summary>

## [1.0.2](https://github.com/fake-owner/fake-repo/compare/pkg1-v1.0.1...pkg1-v1.0.2) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
* some bugfix ([cccccc](https://github.com/fake-owner/fake-repo/commit/cccccc))
</details>

<details><summary>pkg2: 0.2.4</summary>

## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg2-v0.2.3...pkg2-v0.2.4) (1983-10-10)


### Bug Fixes

* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['Manifest buildPullRequests should allow customizing pull request title with root package without SPACE in component 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>root: 1.2.2</summary>

## [1.2.2](https://github.com/fake-owner/fake-repo/compare/root-v1.2.1...root-v1.2.2) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))
* some bugfix ([cccccc](https://github.com/fake-owner/fake-repo/commit/cccccc))
</details>

<details><summary>pkg1: 1.0.2</summary>

## [1.0.2](https://github.com/fake-owner/fake-repo/compare/pkg1-v1.0.1...pkg1-v1.0.2) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
* some bugfix ([cccccc](https://github.com/fake-owner/fake-repo/commit/cccccc))
</details>

<details><summary>pkg2: 0.2.4</summary>

## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg2-v0.2.3...pkg2-v0.2.4) (1983-10-10)


### Bug Fixes

* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['Manifest buildPullRequests should allow overriding commit message 1'] = `
:robot: I have created a release *beep* *boop*
---


## [1.0.1](https://github.com/fake-owner/fake-repo/compare/v1.0.0...v1.0.1) (1983-10-10)


### Bug Fixes

* real fix message ([def456](https://github.com/fake-owner/fake-repo/commit/def456))

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['Manifest buildPullRequests should handle mixing componentless configs 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>1.0.1</summary>

## [1.0.1](https://github.com/fake-owner/fake-repo/compare/v1.0.0...v1.0.1) (1983-10-10)


### Bug Fixes

* some bugfix ([aaaaaa](https://github.com/fake-owner/fake-repo/commit/aaaaaa))
</details>

<details><summary>pkg2: 0.2.4</summary>

## [0.2.4](https://github.com/fake-owner/fake-repo/compare/pkg2-v0.2.3...pkg2-v0.2.4) (1983-10-10)


### Bug Fixes

* some bugfix ([bbbbbb](https://github.com/fake-owner/fake-repo/commit/bbbbbb))
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['Manifest buildPullRequests with multiple packages should handle multiple package repository 1'] = `
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

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['Manifest createPullRequests handles a single pull request: changes'] = `

filename: README.md
some raw content
`

exports['Manifest createPullRequests handles a single pull request: options'] = `

upstreamOwner: fake-owner
upstreamRepo: fake-repo
title: chore(main): release
branch: release-please/branches/main
description: :robot: I have created a release *beep* *boop*
---


Some release notes

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore(main): release
logger: [object Object]
draft: false
labels: 
`

exports['Manifest createPullRequests handles fork = true: changes'] = `

filename: README.md
some raw content
`

exports['Manifest createPullRequests handles fork = true: options'] = `

upstreamOwner: fake-owner
upstreamRepo: fake-repo
title: chore(main): release
branch: release-please/branches/main
description: :robot: I have created a release *beep* *boop*
---


Some release notes

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: true
message: chore(main): release
logger: [object Object]
draft: false
labels: 
`

exports['Manifest createPullRequests handles signoff users: changes'] = `

filename: README.md
some raw content
`

exports['Manifest createPullRequests handles signoff users: options'] = `

upstreamOwner: fake-owner
upstreamRepo: fake-repo
title: chore(main): release
branch: release-please/branches/main
description: :robot: I have created a release *beep* *boop*
---


Some release notes

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore(main): release

Signed-off-by: Alice <alice@example.com>
logger: [object Object]
draft: false
labels: 
`
