exports['PHPYoshi generates CHANGELOG and aborts if duplicate: changes'] = `

filename: AutoMl/VERSION
1.8.4
filename: Datastore/VERSION
2.0.1
filename: PubSub/VERSION
1.0.2
filename: Speech/VERSION
1.1.0
filename: WebSecurityScanner/VERSION
0.9.0
filename: composer.json
{
    "replace": {
        "automl": "1.8.4",
        "datastore": "2.0.1",
        "pubsub": "1.0.2",
        "speech": "1.1.0",
        "websecurityscanner": "0.9.0"
    }
}

filename: docs/manifest.json
{
    "modules": [
        {
            "name": "google/cloud",
            "versions": [
                "v0.21.0"
            ]
        },
        {
            "name": "datastore",
            "versions": [
                "v2.0.1"
            ]
        }
    ]
}

filename: CHANGELOG.md
# Changelog

## 0.21.0

<details><summary>automl 1.8.4</summary>



### Bug Fixes

* correctly label as beta ([#1963](https://www.github.com/googleapis/release-please/issues/1963)) ([52f4fbf](https://www.github.com/googleapis/release-please/commit/52f4fbfa1fc3fde585c84e64ef40571d2b85d72e))

</details>

<details><summary>datastore 2.0.1</summary>



### Bug Fixes

* Assorted minor fixes for Cloud Datastore client ([#1964](https://www.github.com/googleapis/release-please/issues/1964)) ([269cf92](https://www.github.com/googleapis/release-please/commit/269cf923ea6fd0375abaf0bb19790475693c6f90))

</details>

<details><summary>pubsub 1.0.2</summary>



### Bug Fixes

* Update PubSub timeouts. ([#1967](https://www.github.com/googleapis/release-please/issues/1967)) ([0a84771](https://www.github.com/googleapis/release-please/commit/0a8477108a26aeb21d7af06e62be4ae5cb00ad42))

</details>

<details><summary>speech 1.1.0</summary>



### Features

* Add mp3 encoding and context hint boost support. ([#1959](https://www.github.com/googleapis/release-please/issues/1959)) ([da6e52d](https://www.github.com/googleapis/release-please/commit/da6e52d956c1e35d19e75e0f2fdba439739ba364))
* move speech from alpha -> beta ([#1962](https://www.github.com/googleapis/release-please/issues/1962)) ([8db7f3b](https://www.github.com/googleapis/release-please/commit/8db7f3b19c46c873897d79c89ce35b8492e5fe60))

</details>

<details><summary>websecurityscanner 0.9.0</summary>



### Features

* Add Web Security Center Client ([#1961](https://www.github.com/googleapis/release-please/issues/1961)) ([fa5761e](https://www.github.com/googleapis/release-please/commit/fa5761e9e52f36506a72a9292843259d198468b0))

</details>

`

exports['PHPYoshi generates CHANGELOG and aborts if duplicate: options'] = `

upstreamOwner: googleapis
upstreamRepo: release-please
title: chore: release 0.21.0
branch: release-v0.21.0
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
## 0.21.0

<details><summary>automl 1.8.4</summary>



### Bug Fixes

* correctly label as beta ([#1963](https://www.github.com/googleapis/release-please/issues/1963)) ([52f4fbf](https://www.github.com/googleapis/release-please/commit/52f4fbfa1fc3fde585c84e64ef40571d2b85d72e))

</details>

<details><summary>datastore 2.0.1</summary>



### Bug Fixes

* Assorted minor fixes for Cloud Datastore client ([#1964](https://www.github.com/googleapis/release-please/issues/1964)) ([269cf92](https://www.github.com/googleapis/release-please/commit/269cf923ea6fd0375abaf0bb19790475693c6f90))

</details>

<details><summary>pubsub 1.0.2</summary>



### Bug Fixes

* Update PubSub timeouts. ([#1967](https://www.github.com/googleapis/release-please/issues/1967)) ([0a84771](https://www.github.com/googleapis/release-please/commit/0a8477108a26aeb21d7af06e62be4ae5cb00ad42))

</details>

<details><summary>speech 1.1.0</summary>



### Features

* Add mp3 encoding and context hint boost support. ([#1959](https://www.github.com/googleapis/release-please/issues/1959)) ([da6e52d](https://www.github.com/googleapis/release-please/commit/da6e52d956c1e35d19e75e0f2fdba439739ba364))
* move speech from alpha -> beta ([#1962](https://www.github.com/googleapis/release-please/issues/1962)) ([8db7f3b](https://www.github.com/googleapis/release-please/commit/8db7f3b19c46c873897d79c89ce35b8492e5fe60))

</details>

<details><summary>websecurityscanner 0.9.0</summary>



### Features

* Add Web Security Center Client ([#1961](https://www.github.com/googleapis/release-please/issues/1961)) ([fa5761e](https://www.github.com/googleapis/release-please/commit/fa5761e9e52f36506a72a9292843259d198468b0))

</details>

This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release 0.21.0
`
