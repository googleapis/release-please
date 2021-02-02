exports['Node run creates a release PR without package-lock.json 1'] = `
[
  [
    "CHANGELOG.md",
    {
      "content": "# Changelog\\n\\n### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))\\n",
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
      "content": "# Changelog\\n\\n### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))\\n",
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

exports['Node run creates release PR relative to a path 1'] = `
[
  [
    "packages/foo/CHANGELOG.md",
    {
      "content": "# Changelog\\n\\n### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))\\n",
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
