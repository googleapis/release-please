exports['Node getOpenPROptions returns release PR changes with defaultInitialVersion 0.1.0, when bumpMinorPreMajor is true 1'] = `
## 0.1.0 (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---

`

exports['Node getOpenPROptions returns release PR changes with defaultInitialVersion 1.0.0, when bumpMinorPreMajor is false 1'] = `
## 1.0.0 (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---

`

exports['Node getOpenPROptions returns release PR changes with semver patch bump 1'] = `
### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---

`

exports['Node run creates a release PR with package-lock.json 1'] = `

filename: package-lock.json
{
  "name": "node-test-repo",
  "version": "0.123.5",
  "lockfileVersion": 1,
  "requires": true,
  "dependencies": {}
}

filename: CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))

filename: package.json
{
  "name": "node-test-repo",
  "version": "0.123.5",
  "repository": {
    "url": "git@github.com:samples/node-test-repo.git"
  }
}

`

exports['Node run creates a release PR without package-lock.json 1'] = `

filename: CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))

filename: package.json
{
  "name": "node-test-repo",
  "version": "0.123.5",
  "repository": {
    "url": "git@github.com:samples/node-test-repo.git"
  }
}

`

exports['Node run creates release PR relative to a path 1'] = `

filename: packages/foo/CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))

filename: packages/foo/package.json
{
  "name": "node-test-repo",
  "version": "0.123.5",
  "repository": {
    "url": "git@github.com:samples/node-test-repo.git"
  }
}

`

exports['Node run uses detected package name in branch 1'] = `

filename: CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))

filename: package.json
{
  "name": "node-test-repo",
  "version": "0.123.5",
  "repository": {
    "url": "git@github.com:samples/node-test-repo.git"
  }
}

`
