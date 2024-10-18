exports['GoWorkspace plugin run handles a single go package 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>example.com/packages/goA: 1.1.2</summary>

Release notes for path: packages/goA, releaseType: go
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['GoWorkspace plugin run handles glob paths 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>example.com/packages/goA: 1.1.2</summary>

Release notes for path: packages/goA, releaseType: go
</details>

<details><summary>example.com/packages/goB: 4.4.5</summary>

Release notes for path: packages/goB, releaseType: go


### Dependencies

* Updated dependency example.com/packages/goA from v1.1.1 to v1.1.2
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

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
