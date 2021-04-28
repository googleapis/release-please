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

exports['Node run creates a release PR with npm-shrinkwrap.json: changes'] = `

filename: npm-shrinkwrap.json
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

exports['Node run creates a release PR with npm-shrinkwrap.json: options'] = `

upstreamOwner: googleapis
upstreamRepo: node-test-repo
title: chore: release 0.123.5
branch: release-v0.123.5
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release 0.123.5
`

exports['Node run creates a release PR with package-lock.json: changes'] = `

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

exports['Node run creates a release PR with package-lock.json: options'] = `

upstreamOwner: googleapis
upstreamRepo: node-test-repo
title: chore: release 0.123.5
branch: release-v0.123.5
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release 0.123.5
`

exports['Node run creates a release PR without package-lock.json: changes'] = `

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

exports['Node run creates a release PR without package-lock.json: options'] = `

upstreamOwner: googleapis
upstreamRepo: node-test-repo
title: chore: release 0.123.5
branch: release-v0.123.5
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release 0.123.5
`

exports['Node run creates release PR relative to a path: changes'] = `

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

exports['Node run creates release PR relative to a path: options'] = `

upstreamOwner: googleapis
upstreamRepo: node-test-repo
title: chore: release 0.123.5
branch: release-v0.123.5
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release 0.123.5
`

exports['Node run uses detected package name in branch: changes'] = `

filename: CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/node-test-repo-v0.123.4...node-test-repo-v0.123.5) (1983-10-10)


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

exports['Node run uses detected package name in branch: options'] = `

upstreamOwner: googleapis
upstreamRepo: node-test-repo
title: chore: release node-test-repo 0.123.5
branch: release-node-test-repo-v0.123.5
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.123.5](https://www.github.com/googleapis/node-test-repo/compare/node-test-repo-v0.123.4...node-test-repo-v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release node-test-repo 0.123.5
`
