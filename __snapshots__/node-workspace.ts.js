exports['NodeWorkspace plugin run appends dependency notes to an updated module 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>@here/pkgA: 3.3.4</summary>

Release notes for path: node1, releaseType: node
</details>

<details><summary>@here/pkgB: 2.2.3</summary>

### Dependencies

* update dependency foo/bar to 1.2.3
* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from 3.3.3 to 3.3.4
</details>

<details><summary>@here/pkgC: 1.1.2</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgB bumped from 2.2.2 to 2.2.3
</details>

<details><summary>@here/pkgE: 1.0.1</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped to 3.3.4
</details>

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['NodeWorkspace plugin run appends dependency notes to an updated module 2'] = `
other notes
`

exports['NodeWorkspace plugin run appends dependency notes to an updated module 3'] = `
### Dependencies

* update dependency foo/bar to 1.2.3
* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from 3.3.3 to 3.3.4
`

exports['NodeWorkspace plugin run appends dependency notes to an updated module 4'] = `
### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgB bumped from 2.2.2 to 2.2.3
`

exports['NodeWorkspace plugin run combines node packages 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>@here/pkgA: 3.3.4</summary>

Release notes for path: node1, releaseType: node
</details>

<details><summary>@here/pkgD: 4.4.5</summary>

Release notes for path: node4, releaseType: node
</details>

<details><summary>@here/root: 5.5.6</summary>

Release notes for path: ., releaseType: node


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^3.3.3 to ^3.3.4
    * @here/pkgD bumped from ^4.4.4 to ^4.4.5
</details>

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['NodeWorkspace plugin run handles a single node package 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>@here/pkgA: 3.3.4</summary>

Release notes for path: node1, releaseType: node
</details>

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['NodeWorkspace plugin run respects version prefix 1'] = `
{
  "name": "@here/plugin1",
  "version": "4.4.4",
  "peerDependencies": {
    "@here/pkgA": "^3.3.3"
  }
}
`

exports['NodeWorkspace plugin run should ignore peer dependencies 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>@here/pkgA: 3.3.4</summary>

Release notes for path: node1, releaseType: node
</details>

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`

exports['NodeWorkspace plugin run walks dependency tree and updates previously untouched packages 1'] = `
:sparkles: Stainless prepared a new release
---


<details><summary>@here/pkgA: 3.3.4</summary>

Release notes for path: node1, releaseType: node
</details>

<details><summary>@here/pkgB: 2.2.3</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from 3.3.3 to 3.3.4
</details>

<details><summary>@here/pkgC: 1.1.2</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgB bumped from 2.2.2 to 2.2.3
</details>

<details><summary>@here/pkgD: 4.4.5</summary>

Release notes for path: node4, releaseType: node
</details>

<details><summary>@here/pkgE: 1.0.1</summary>

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped to 3.3.4
</details>

---
This pull request is managed by Stainless's [GitHub App](https://github.com/apps/stainless-app).

The [semver version number](https://semver.org/#semantic-versioning-specification-semver) is based on included [commit messages](https://www.conventionalcommits.org/en/v1.0.0/). Alternatively, you can manually set the version number in the title of this pull request.

For a better experience, it is recommended to use either rebase-merge or squash-merge when merging this pull request.

🔗 Stainless [website](https://www.stainlessapi.com)
📚 Read the [docs](https://app.stainlessapi.com/docs)
🙋 [Reach out](mailto:support@stainlessapi.com) for help or questions
`
