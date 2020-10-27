exports['labels-node-'] = {
  "labels": [
    "autorelease: pending"
  ]
}

exports['Node run creates a release PR without package-lock.json 1'] = `
[
  [
    "CHANGELOG.md",
    {
      "content": "# Changelog\\n\\n### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/node-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/node-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))\\n",
      "mode": "100644"
    }
  ],
  [
    "package.json",
    {
      "content": "{\\n  \\"name\\": \\"node-test-repo\\",\\n  \\"version\\": \\"0.123.5\\",\\n  \\"repository\\": {\\n    \\"url\\": \\"git@github.com:samples/node-test-repo.git\\"\\n  }\\n}\\n",
      "mode": "100644"
    }
  ]
]
`

exports['labels-node-with-package-lock'] = {
  "labels": [
    "autorelease: pending"
  ]
}

exports['Node run creates a release PR with package-lock.json 1'] = `
[
  [
    "package-lock.json",
    {
      "content": "{\\n  \\"name\\": \\"node-test-repo\\",\\n  \\"version\\": \\"0.123.5\\",\\n  \\"lockfileVersion\\": 1,\\n  \\"requires\\": true,\\n  \\"dependencies\\": {}\\n}\\n",
      "mode": "100644"
    }
  ],
  [
    "CHANGELOG.md",
    {
      "content": "# Changelog\\n\\n### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/node-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/node-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))\\n",
      "mode": "100644"
    }
  ],
  [
    "package.json",
    {
      "content": "{\\n  \\"name\\": \\"node-test-repo\\",\\n  \\"version\\": \\"0.123.5\\",\\n  \\"repository\\": {\\n    \\"url\\": \\"git@github.com:samples/node-test-repo.git\\"\\n  }\\n}\\n",
      "mode": "100644"
    }
  ]
]
`

exports['labels-node-with-path'] = {
  "labels": [
    "autorelease: pending"
  ]
}

exports['Node run creates release PR relative to a path 1'] = `
[
  [
    "packages/foo/CHANGELOG.md",
    {
      "content": "# Changelog\\n\\n### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/node-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/node-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))\\n",
      "mode": "100644"
    }
  ],
  [
    "packages/foo/package.json",
    {
      "content": "{\\n  \\"name\\": \\"node-test-repo\\",\\n  \\"version\\": \\"0.123.5\\",\\n  \\"repository\\": {\\n    \\"url\\": \\"git@github.com:samples/node-test-repo.git\\"\\n  }\\n}\\n",
      "mode": "100644"
    }
  ]
]
`
