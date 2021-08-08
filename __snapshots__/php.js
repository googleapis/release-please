exports['PHP generates php CHANGELOG and aborts if duplicate: changes'] = `

filename: composer.json
{
    "replace": {},
    "version": "0.21.0"
}

filename: CHANGELOG.md
# Changelog

## [0.21.0](https://www.github.com/googleapis/release-please/compare/v0.20.3...v0.21.0) (1983-10-10)


### Features

* Add mp3 encoding and context hint boost support. ([#1959](https://www.github.com/googleapis/release-please/issues/1959)) ([da6e52d](https://www.github.com/googleapis/release-please/commit/da6e52d956c1e35d19e75e0f2fdba439739ba364))
* Add Web Security Center Client ([#1961](https://www.github.com/googleapis/release-please/issues/1961)) ([fa5761e](https://www.github.com/googleapis/release-please/commit/fa5761e9e52f36506a72a9292843259d198468b0))
* move speech from alpha -> beta ([#1962](https://www.github.com/googleapis/release-please/issues/1962)) ([8db7f3b](https://www.github.com/googleapis/release-please/commit/8db7f3b19c46c873897d79c89ce35b8492e5fe60))


### Bug Fixes

* Assorted minor fixes for Cloud Datastore client ([#1964](https://www.github.com/googleapis/release-please/issues/1964)) ([269cf92](https://www.github.com/googleapis/release-please/commit/269cf923ea6fd0375abaf0bb19790475693c6f90))
* correctly label as beta ([#1963](https://www.github.com/googleapis/release-please/issues/1963)) ([52f4fbf](https://www.github.com/googleapis/release-please/commit/52f4fbfa1fc3fde585c84e64ef40571d2b85d72e))
* Update PubSub timeouts. ([#1967](https://www.github.com/googleapis/release-please/issues/1967)) ([0a84771](https://www.github.com/googleapis/release-please/commit/0a8477108a26aeb21d7af06e62be4ae5cb00ad42))

`

exports['PHP generates php CHANGELOG and aborts if duplicate: options'] = `

upstreamOwner: googleapis
upstreamRepo: release-please
title: chore: release 0.21.0
branch: release-v0.21.0
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
## [0.21.0](https://www.github.com/googleapis/release-please/compare/v0.20.3...v0.21.0) (1983-10-10)


### Features

* Add mp3 encoding and context hint boost support. ([#1959](https://www.github.com/googleapis/release-please/issues/1959)) ([da6e52d](https://www.github.com/googleapis/release-please/commit/da6e52d956c1e35d19e75e0f2fdba439739ba364))
* Add Web Security Center Client ([#1961](https://www.github.com/googleapis/release-please/issues/1961)) ([fa5761e](https://www.github.com/googleapis/release-please/commit/fa5761e9e52f36506a72a9292843259d198468b0))
* move speech from alpha -> beta ([#1962](https://www.github.com/googleapis/release-please/issues/1962)) ([8db7f3b](https://www.github.com/googleapis/release-please/commit/8db7f3b19c46c873897d79c89ce35b8492e5fe60))


### Bug Fixes

* Assorted minor fixes for Cloud Datastore client ([#1964](https://www.github.com/googleapis/release-please/issues/1964)) ([269cf92](https://www.github.com/googleapis/release-please/commit/269cf923ea6fd0375abaf0bb19790475693c6f90))
* correctly label as beta ([#1963](https://www.github.com/googleapis/release-please/issues/1963)) ([52f4fbf](https://www.github.com/googleapis/release-please/commit/52f4fbfa1fc3fde585c84e64ef40571d2b85d72e))
* Update PubSub timeouts. ([#1967](https://www.github.com/googleapis/release-please/issues/1967)) ([0a84771](https://www.github.com/googleapis/release-please/commit/0a8477108a26aeb21d7af06e62be4ae5cb00ad42))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release 0.21.0
logger: [object Object]
`
