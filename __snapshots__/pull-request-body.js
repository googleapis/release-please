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
:sparkles: Stainless prepared a new release
---


some special notes go here

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For technical details, see [this repository](https://github.com/stainless-api/release-please).
`

exports['PullRequestBody toString can handle a single entries forced components 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>pkg1: 1.2.3</summary>

some special notes go here
</details>

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For technical details, see [this repository](https://github.com/stainless-api/release-please).
`

exports['PullRequestBody toString can handle componently entries 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>1.2.3</summary>

some special notes go here
</details>

<details><summary>pkg2: 2.0.0</summary>

more special notes go here
</details>

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For technical details, see [this repository](https://github.com/stainless-api/release-please).
`

exports['PullRequestBody toString can handle multiple entries 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>pkg1: 1.2.3</summary>

some special notes go here
</details>

<details><summary>pkg2: 2.0.0</summary>

more special notes go here
</details>

---
This Pull Request has been generated automatically as part of [Stainless](https://stainlessapi.com/)'s release process.
For technical details, see [this repository](https://github.com/stainless-api/release-please).
`
