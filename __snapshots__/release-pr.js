exports['GitHub Yoshi PHP Mono-Repo generates CHANGELOG and aborts if duplicate 1'] = `
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

`

exports['GitHub Yoshi PHP Mono-Repo generates CHANGELOG and aborts if duplicate 2'] = {
  'title': 'chore: release 0.21.0',
  'body': ':robot: I have created a release \\*beep\\* \\*boop\\* \n---\n## 0.21.0\n\n<details><summary>automl 1.8.4</summary>\n\n\n\n### Bug Fixes\n\n* correctly label as beta ([#1963](https://www.github.com/googleapis/release-please/issues/1963)) ([52f4fbf](https://www.github.com/googleapis/release-please/commit/52f4fbfa1fc3fde585c84e64ef40571d2b85d72e))\n\n</details>\n\n<details><summary>datastore 2.0.1</summary>\n\n\n\n### Bug Fixes\n\n* Assorted minor fixes for Cloud Datastore client ([#1964](https://www.github.com/googleapis/release-please/issues/1964)) ([269cf92](https://www.github.com/googleapis/release-please/commit/269cf923ea6fd0375abaf0bb19790475693c6f90))\n\n</details>\n\n<details><summary>pubsub 1.0.2</summary>\n\n\n\n### Bug Fixes\n\n* Update PubSub timeouts. ([#1967](https://www.github.com/googleapis/release-please/issues/1967)) ([0a84771](https://www.github.com/googleapis/release-please/commit/0a8477108a26aeb21d7af06e62be4ae5cb00ad42))\n\n</details>\n\n<details><summary>speech 1.1.0</summary>\n\n\n\n### Features\n\n* move speech from alpha -> beta ([#1962](https://www.github.com/googleapis/release-please/issues/1962)) ([8db7f3b](https://www.github.com/googleapis/release-please/commit/8db7f3b19c46c873897d79c89ce35b8492e5fe60))\n\n</details>\n\n<details><summary>websecurityscanner 0.9.0</summary>\n\n\n\n### Features\n\n* Add Web Security Center Client ([#1961](https://www.github.com/googleapis/release-please/issues/1961)) ([fa5761e](https://www.github.com/googleapis/release-please/commit/fa5761e9e52f36506a72a9292843259d198468b0))\n\n</details>\n\nThis PR was generated with [Release Please](https://github.com/googleapis/release-please).',
  'head': 'release-v0.21.0',
  'base': 'master'
}
