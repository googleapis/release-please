exports['PullRequestBody toString can handle a custom header and footer 1'] = `
My special header!!!
---


<details><summary>pkg1: 1.2.3</summary>

some special notes go here
</details>

<details><summary>pkg2: 2.0.0</summary>

more special notes go here
</details>

---
A custom footer
`

exports['PullRequestBody toString can handle a single entries 1'] = `
:robot: I have created a release *beep* *boop*
---


some special notes go here

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['PullRequestBody toString can handle a single entries forced components 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>pkg1: 1.2.3</summary>

some special notes go here
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['PullRequestBody toString can handle componently entries 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>1.2.3</summary>

some special notes go here
</details>

<details><summary>pkg2: 2.0.0</summary>

more special notes go here
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['PullRequestBody toString can handle multiple entries 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>pkg1: 1.2.3</summary>

some special notes go here
</details>

<details><summary>pkg2: 2.0.0</summary>

more special notes go here
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
