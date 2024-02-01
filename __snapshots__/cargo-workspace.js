exports['CargoWorkspace plugin run appends dependency notes to an updated module 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>@here/pkgA: 1.1.2</summary>

Release notes for path: packages/rustA, releaseType: rust
</details>

<details><summary>@here/pkgB: 2.2.3</summary>

### Dependencies

* update dependency foo/bar to 1.2.3
* The following workspace dependencies were updated
  * dependencies
    * pkgA bumped from 1.1.1 to 1.1.2
</details>

<details><summary>pkgC: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgB bumped from 2.2.2 to 2.2.3
</details>

<details><summary>pkgE: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgA bumped from 1.1.1 to 1.1.2
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run can skip merging rust packages 1'] = `
:robot: I have created a release *beep* *boop*
---


Release notes for path: packages/rustA, releaseType: rust

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run can skip merging rust packages 2'] = `
:robot: I have created a release *beep* *boop*
---


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgA bumped from 1.1.1 to 1.1.2

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run can skip merging rust packages 3'] = `
:robot: I have created a release *beep* *boop*
---


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgB bumped from 2.2.2 to 2.2.3

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run can skip merging rust packages 4'] = `
:robot: I have created a release *beep* *boop*
---


Release notes for path: packages/rustD, releaseType: rust

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run can skip merging rust packages 5'] = `
:robot: I have created a release *beep* *boop*
---


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgA bumped from 1.1.1 to 1.1.2

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run combines rust packages 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>@here/pkgA: 1.1.2</summary>

Release notes for path: packages/rustA, releaseType: rust
</details>

<details><summary>@here/pkgD: 4.4.5</summary>

Release notes for path: packages/rustD, releaseType: rust
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run handles a single rust package 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>pkgA: 1.1.2</summary>

Release notes for path: packages/rustA, releaseType: rust
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run handles glob paths 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>@here/pkgA: 1.1.2</summary>

Release notes for path: packages/rustA, releaseType: rust
</details>

<details><summary>@here/pkgD: 4.4.5</summary>

Release notes for path: packages/rustD, releaseType: rust
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run skips component if not touched 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>pkgB: 2.3.0</summary>

Release notes for path: packages/rustB, releaseType: rust
</details>

<details><summary>pkgC: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgB bumped from 2.2.2 to 2.3.0
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['CargoWorkspace plugin run walks dependency tree and updates previously untouched packages 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>@here/pkgA: 1.1.2</summary>

Release notes for path: packages/rustA, releaseType: rust
</details>

<details><summary>pkgB: 2.2.3</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgA bumped from 1.1.1 to 1.1.2
</details>

<details><summary>pkgC: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgB bumped from 2.2.2 to 2.2.3
</details>

<details><summary>@here/pkgD: 4.4.5</summary>

Release notes for path: packages/rustD, releaseType: rust
</details>

<details><summary>pkgE: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgA bumped from 1.1.1 to 1.1.2
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
