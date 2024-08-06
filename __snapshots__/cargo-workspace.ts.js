exports['CargoWorkspace plugin run appends dependency notes to an updated module 1'] = `
:sparkles: Stainless prepared a new release
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
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run can skip merging rust packages 1'] = `
:sparkles: Stainless prepared a new release
---


Release notes for path: packages/rustA, releaseType: rust

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run can skip merging rust packages 2'] = `
:sparkles: Stainless prepared a new release
---


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgA bumped from 1.1.1 to 1.1.2

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run can skip merging rust packages 3'] = `
:sparkles: Stainless prepared a new release
---


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgB bumped from 2.2.2 to 2.2.3

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run can skip merging rust packages 4'] = `
:sparkles: Stainless prepared a new release
---


Release notes for path: packages/rustD, releaseType: rust

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run can skip merging rust packages 5'] = `
:sparkles: Stainless prepared a new release
---


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * pkgA bumped from 1.1.1 to 1.1.2

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run combines rust packages 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>@here/pkgA: 1.1.2</summary>

Release notes for path: packages/rustA, releaseType: rust
</details>

<details><summary>@here/pkgD: 4.4.5</summary>

Release notes for path: packages/rustD, releaseType: rust
</details>

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run handles a single rust package 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>pkgA: 1.1.2</summary>

Release notes for path: packages/rustA, releaseType: rust
</details>

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run handles glob paths 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>@here/pkgA: 1.1.2</summary>

Release notes for path: packages/rustA, releaseType: rust
</details>

<details><summary>@here/pkgD: 4.4.5</summary>

Release notes for path: packages/rustD, releaseType: rust
</details>

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run skips component if not touched 1'] = `
:sparkles: Stainless prepared a new release
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
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['CargoWorkspace plugin run walks dependency tree and updates previously untouched packages 1'] = `
:sparkles: Stainless prepared a new release
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
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`
