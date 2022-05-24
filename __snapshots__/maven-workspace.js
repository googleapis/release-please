exports['MavenWorkspace plugin run appends to existing candidate 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>maven3: 3.3.4</summary>

Release notes for path: maven3, releaseType: maven
</details>

<details><summary>maven4: 4.4.5</summary>

### Dependencies

* Updated foo to v3
* The following workspace dependencies were updated
    * com.google.example:maven3 bumped to 3.3.4
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['MavenWorkspace plugin run handles a single maven package 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>maven4: 4.4.5</summary>

Release notes for path: maven4, releaseType: maven
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['MavenWorkspace plugin run walks dependency tree and updates previously untouched packages 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>maven1: 1.1.2</summary>

Release notes for path: maven1, releaseType: maven
</details>

<details><summary>com.google.example:maven2: 2.2.3</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:maven1 bumped to 1.1.2
</details>

<details><summary>com.google.example:maven3: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:maven2 bumped to 2.2.3
</details>

<details><summary>com.google.example:maven4: 4.4.5</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:maven3 bumped to 3.3.4
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
