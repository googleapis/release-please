exports['Release-PR Yoshi PHP Mono-Repo generates CHANGELOG and aborts if duplicate 1'] = `
[
  [
    "AutoMl/VERSION",
    {
      "content": "1.8.4",
      "mode": "100644"
    }
  ],
  [
    "Datastore/VERSION",
    {
      "content": "2.0.1",
      "mode": "100644"
    }
  ],
  [
    "PubSub/VERSION",
    {
      "content": "1.0.2",
      "mode": "100644"
    }
  ],
  [
    "Speech/VERSION",
    {
      "content": "1.1.0",
      "mode": "100644"
    }
  ],
  [
    "WebSecurityScanner/VERSION",
    {
      "content": "0.9.0",
      "mode": "100644"
    }
  ],
  [
    "composer.json",
    {
      "content": "{\\n    \\"replace\\": {\\n        \\"automl\\": \\"1.8.4\\",\\n        \\"datastore\\": \\"2.0.1\\",\\n        \\"pubsub\\": \\"1.0.2\\",\\n        \\"speech\\": \\"1.1.0\\",\\n        \\"websecurityscanner\\": \\"0.9.0\\"\\n    }\\n}\\n",
      "mode": "100644"
    }
  ],
  [
    "docs/manifest.json",
    {
      "content": "{\\n    \\"modules\\": [\\n        {\\n            \\"name\\": \\"google/cloud\\",\\n            \\"versions\\": [\\n                \\"v1.0.0\\"\\n            ]\\n        },\\n        {\\n            \\"name\\": \\"datastore\\",\\n            \\"versions\\": [\\n                \\"v2.0.1\\"\\n            ]\\n        }\\n    ]\\n}\\n",
      "mode": "100644"
    }
  ],
  [
    "CHANGELOG.md",
    {
      "content": "# Changelog\\n\\n## 1.0.0\\n\\n<details><summary>automl 1.8.4</summary>\\n\\n\\n\\n### Bug Fixes\\n\\n* correctly label as beta ([#1963](https://www.github.com/googleapis/release-please/issues/1963)) ([52f4fbf](https://www.github.com/googleapis/release-please/commit/52f4fbfa1fc3fde585c84e64ef40571d2b85d72e))\\n\\n</details>\\n\\n<details><summary>datastore 2.0.1</summary>\\n\\n\\n\\n### Bug Fixes\\n\\n* Assorted minor fixes for Cloud Datastore client ([#1964](https://www.github.com/googleapis/release-please/issues/1964)) ([cf52ec0](https://www.github.com/googleapis/release-please/commit/cf52ec0bcdc777dc9c5e76153d7d253bea95d44b))\\n\\n</details>\\n\\n<details><summary>pubsub 1.0.2</summary>\\n\\n\\n\\n### Bug Fixes\\n\\n* Update PubSub timeouts. ([#1967](https://www.github.com/googleapis/release-please/issues/1967)) ([0a84771](https://www.github.com/googleapis/release-please/commit/0a8477108a26aeb21d7af06e62be4ae5cb00ad42))\\n\\n</details>\\n\\n<details><summary>speech 1.1.0</summary>\\n\\n\\n\\n### Features\\n\\n* Add mp3 encoding and context hint boost support. ([#1959](https://www.github.com/googleapis/release-please/issues/1959)) ([da6e52d](https://www.github.com/googleapis/release-please/commit/da6e52d956c1e35d19e75e0f2fdba439739ba364))\\n* move speech from alpha -> beta ([#1962](https://www.github.com/googleapis/release-please/issues/1962)) ([8db7f3b](https://www.github.com/googleapis/release-please/commit/8db7f3b19c46c873897d79c89ce35b8492e5fe60))\\n\\n</details>\\n\\n<details><summary>websecurityscanner 0.9.0</summary>\\n\\n\\n\\n### Features\\n\\n* Add Web Security Center Client ([#1961](https://www.github.com/googleapis/release-please/issues/1961)) ([fa5761e](https://www.github.com/googleapis/release-please/commit/fa5761e9e52f36506a72a9292843259d198468b0))\\n\\n</details>\\n",
      "mode": "100644"
    }
  ]
]
`
