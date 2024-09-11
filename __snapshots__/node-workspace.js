exports['NodeWorkspace plugin run appends dependency notes to an updated module 1'] = `
:robot: I have created a release *beep* *boop*
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
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
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
:robot: I have created a release *beep* *boop*
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
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['NodeWorkspace plugin run combines node packages 2'] = `
{
  "name": "@here/root",
  "version": "5.5.6",
  "dependencies": {
    "@here/pkgA": "^3.3.4",
    "@here/pkgD": "^4.4.5"
  }
}
`

exports['NodeWorkspace plugin run combines node packages 3'] = `
{
  "name": "@here/pkgA",
  "version": "3.3.4",
  "dependencies": {
    "anotherExternal": "^4.3.1"
  }
}
`

exports['NodeWorkspace plugin run combines node packages 4'] = `
{
  "name": "@here/pkgD",
  "version": "4.4.5",
  "dependencies": {
    "anotherExternal": "^4.3.1"
  }
}
`

exports['NodeWorkspace plugin run handles a single node package 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>@here/pkgA: 3.3.4</summary>

Release notes for path: node1, releaseType: node
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['NodeWorkspace plugin run includes headers for packages with configured strategies 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>@here/pkgA: 3.3.4</summary>

Release notes for path: node1, releaseType: node
</details>

<details><summary>pkgB: 2.2.3</summary>

## [2.2.3](https://github.com/googleapis/node-test-repo/compare/pkgB-v2.2.2...pkgB-v2.2.3) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from 3.3.3 to 3.3.4
</details>

<details><summary>pkgC: 1.1.2</summary>

## 1.1.2 (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgB bumped from 2.2.2 to 2.2.3
</details>

<details><summary>pkgE: 1.0.1</summary>

## 1.0.1 (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped to 3.3.4
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['NodeWorkspace plugin run includes headers for packages with configured strategies 2'] = `
other notes
`

exports['NodeWorkspace plugin run includes headers for packages with configured strategies 3'] = `
## [2.2.3](https://github.com/googleapis/node-test-repo/compare/pkgB-v2.2.2...pkgB-v2.2.3) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from 3.3.3 to 3.3.4
`

exports['NodeWorkspace plugin run includes headers for packages with configured strategies 4'] = `
## 1.1.2 (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgB bumped from 2.2.2 to 2.2.3
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
:robot: I have created a release *beep* *boop*
---


<details><summary>@here/pkgA: 3.3.4</summary>

Release notes for path: node1, releaseType: node
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['NodeWorkspace plugin run walks dependency tree and updates previously untouched packages (prerelease) 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>@here/pkgA: 3.3.4-beta</summary>

Release notes for path: node1, releaseType: node
</details>

<details><summary>pkgB: 2.2.3-beta</summary>

## [2.2.3-beta](https://github.com/googleapis/node-test-repo/compare/pkgB-v2.2.2-beta...pkgB-v2.2.3-beta) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from 3.3.3 to 3.3.4-beta
</details>

<details><summary>pkgC: 1.1.2-beta</summary>

## 1.1.2-beta (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgB bumped from 2.2.2 to 2.2.3-beta
</details>

<details><summary>@here/pkgD: 4.4.5-beta</summary>

Release notes for path: node4, releaseType: node
</details>

<details><summary>pkgE: 1.0.1-beta</summary>

## 1.0.1-beta (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped to 3.3.4-beta
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['NodeWorkspace plugin run walks dependency tree and updates previously untouched packages 1'] = `
:robot: I have created a release *beep* *boop*
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
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['NodeWorkspace plugin with updatePeerDependencies: true respects version prefix and updates peer dependencies 1'] = `
{
  "name": "@here/plugin1",
  "version": "4.4.4",
  "peerDependencies": {
    "@here/pkgA": "^2.2.2"
  }
}
`

exports['NodeWorkspace plugin with updatePeerDependencies: true should not ignore peer dependencies 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>@here/pkgA: 3.3.4</summary>

Release notes for path: node1, releaseType: node
</details>

<details><summary>@here/plugin1: 4.4.5</summary>

### Dependencies

* The following workspace dependencies were updated
  * peerDependencies
    * @here/pkgA bumped from ^3.3.3 to ^3.3.4
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
