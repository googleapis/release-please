exports['GoWorkspace plugin run appends dependency notes to an updated module 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>example.com/packages/goA: 1.1.2</summary>

Release notes for path: packages/goA, releaseType: go
</details>

<details><summary>example.com/packages/goB: 2.2.3</summary>

### Dependencies

* update dependency foo/bar to 1.2.3
* The following workspace dependencies were updated
  * example.com/packages/goA bumped from 1.1.1 to 1.1.2
</details>

<details><summary>example.com/packages/goC: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * example.com/packages/goB/v2 bumped from 2.2.2-0.20250203122516-4c838e530ecb to 2.2.3
</details>

<details><summary>example.com/packages/goE: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * example.com/packages/goA bumped from 1.1.1 to 1.1.2
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['GoWorkspace plugin run handles a single go package and normalizes path 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>example.com/packages/goA: 1.1.2</summary>

Release notes for path: packages/goA, releaseType: go
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['GoWorkspace plugin run skips component if not touched 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>example.com/packages/goB: 2.3.0</summary>

Release notes for path: packages/goB, releaseType: go
</details>

<details><summary>example.com/packages/goC: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * example.com/packages/goB/v2 bumped from 2.2.2-0.20250203122516-4c838e530ecb to 2.3.0
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['GoWorkspace plugin run uses go-work-file config value 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>example.com/packages/goA: 1.1.2</summary>

Release notes for path: packages/goA, releaseType: go
</details>

<details><summary>example.com/packages/goB/v2: 2.2.3</summary>

### Dependencies

* The following workspace dependencies were updated
  * example.com/packages/goA bumped from 1.1.1 to 1.1.2
</details>

<details><summary>example.com/packages/goC: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * example.com/packages/goB/v2 bumped from 2.2.2-0.20250203122516-4c838e530ecb to 2.2.3
</details>

<details><summary>example.com/packages/goD: 4.4.5</summary>

Release notes for path: packages/goD, releaseType: go
</details>

<details><summary>example.com/packages/goE: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * example.com/packages/goA bumped from 1.1.1 to 1.1.2
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['GoWorkspace plugin run walks dependency tree and updates previously untouched packages 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>example.com/packages/goA: 1.1.2</summary>

Release notes for path: packages/goA, releaseType: go
</details>

<details><summary>example.com/packages/goB/v2: 2.2.3</summary>

### Dependencies

* The following workspace dependencies were updated
  * example.com/packages/goA bumped from 1.1.1 to 1.1.2
</details>

<details><summary>example.com/packages/goC: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * example.com/packages/goB/v2 bumped from 2.2.2-0.20250203122516-4c838e530ecb to 2.2.3
</details>

<details><summary>example.com/packages/goD: 4.4.5</summary>

Release notes for path: packages/goD, releaseType: go
</details>

<details><summary>example.com/packages/goE: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
  * example.com/packages/goA bumped from 1.1.1 to 1.1.2
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
