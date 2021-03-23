exports['Manifest pullRequest allows root module to be published, via special "." path: changes'] = `

filename: node/pkg1/CHANGELOG.md
# Changelog

## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))

filename: node/pkg1/package.json
{
  "name": "@node/pkg1",
  "version": "4.0.0"
}

filename: node/pkg2/CHANGELOG.md
# Changelog

## [2.0.0](https://www.github.com/fake/repo/compare/pkg2-v1.2.3...pkg2-v2.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg2:** major new feature

### Features

* **@node/pkg2:** major new feature ([72f962d](https://www.github.com/fake/repo/commit/72f962d44ba0bcee15594ea6bdc67d8b))

filename: node/pkg2/package.json
{
  "name": "@node/pkg2",
  "version": "2.0.0"
}

filename: CHANGELOG.md
# Changelog

## [3.0.0](https://www.github.com/fake/repo/compare/googleapis-v2.0.0...googleapis-v3.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature
* **@node/pkg2:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))
* **@node/pkg2:** major new feature ([72f962d](https://www.github.com/fake/repo/commit/72f962d44ba0bcee15594ea6bdc67d8b))


### Bug Fixes

* **root:** root only change ([8b55db3](https://www.github.com/fake/repo/commit/8b55db3f6115306cc9c132bec0bb1447))

filename: package.json
{
  "name": "googleapis",
  "version": "3.0.0"
}

filename: .release-please-manifest.json
{
  ".": "3.0.0",
  "node/pkg1": "4.0.0",
  "node/pkg2": "2.0.0"
}

`

exports['Manifest pullRequest allows root module to be published, via special "." path: options'] = `

upstreamOwner: fake
upstreamRepo: repo
title: chore: release
branch: release-please/branches/main
description: :robot: I have created a release \\*beep\\* \\*boop\\*

---
@node/pkg1: 4.0.0
## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))
---


---
@node/pkg2: 2.0.0
## [2.0.0](https://www.github.com/fake/repo/compare/pkg2-v1.2.3...pkg2-v2.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg2:** major new feature

### Features

* **@node/pkg2:** major new feature ([72f962d](https://www.github.com/fake/repo/commit/72f962d44ba0bcee15594ea6bdc67d8b))
---


---
googleapis: 3.0.0
## [3.0.0](https://www.github.com/fake/repo/compare/googleapis-v2.0.0...googleapis-v3.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature
* **@node/pkg2:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))
* **@node/pkg2:** major new feature ([72f962d](https://www.github.com/fake/repo/commit/72f962d44ba0bcee15594ea6bdc67d8b))


### Bug Fixes

* **root:** root only change ([8b55db3](https://www.github.com/fake/repo/commit/8b55db3f6115306cc9c132bec0bb1447))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release
`

exports['Manifest pullRequest boostraps from HEAD manifest if first PR: changes'] = `

filename: node/pkg1/CHANGELOG.md
# Changelog

## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))

filename: node/pkg1/package.json
{
  "name": "@node/pkg1",
  "version": "4.0.0"
}

filename: node/pkg2/CHANGELOG.md
# Changelog

## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))

filename: node/pkg2/package.json
{
  "name": "@node/pkg2",
  "version": "0.2.0"
}

filename: python/CHANGELOG.md
# Changelog

### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))

filename: python/setup.cfg
version=1.2.4

filename: python/setup.py
version = "1.2.4"

filename: python/src/foolib/version.py
__version__ = "1.2.4"

filename: .release-please-manifest.json
{
  "node/pkg1": "4.0.0",
  "node/pkg2": "0.2.0",
  "python": "1.2.4"
}

`

exports['Manifest pullRequest boostraps from HEAD manifest if first PR: options'] = `

upstreamOwner: fake
upstreamRepo: repo
title: chore: release
branch: release-please/branches/main
description: :robot: I have created a release \\*beep\\* \\*boop\\*

---
@node/pkg1: 4.0.0
## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))
---


---
@node/pkg2: 0.2.0
## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))
---


---
foolib: 1.2.4
### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release
`

exports['Manifest pullRequest boostraps from HEAD manifest if manifest was deleted in last release PR: changes'] = `

filename: node/pkg1/CHANGELOG.md
# Changelog

## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))

filename: node/pkg1/package.json
{
  "name": "@node/pkg1",
  "version": "4.0.0"
}

filename: node/pkg2/CHANGELOG.md
# Changelog

## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))

filename: node/pkg2/package.json
{
  "name": "@node/pkg2",
  "version": "0.2.0"
}

filename: python/CHANGELOG.md
# Changelog

### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))

filename: python/setup.cfg
version=1.2.4

filename: python/setup.py
version = "1.2.4"

filename: python/src/foolib/version.py
__version__ = "1.2.4"

filename: .release-please-manifest.json
{
  "node/pkg1": "4.0.0",
  "node/pkg2": "0.2.0",
  "python": "1.2.4"
}

`

exports['Manifest pullRequest boostraps from HEAD manifest if manifest was deleted in last release PR: options'] = `

upstreamOwner: fake
upstreamRepo: repo
title: chore: release
branch: release-please/branches/main
description: :robot: I have created a release \\*beep\\* \\*boop\\*

---
@node/pkg1: 4.0.0
## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))
---


---
@node/pkg2: 0.2.0
## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))
---


---
foolib: 1.2.4
### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release
`

exports['Manifest pullRequest boostraps from HEAD manifest starting at bootstrap-sha if first PR: changes'] = `

filename: node/pkg1/CHANGELOG.md
# Changelog

## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))

filename: node/pkg1/package.json
{
  "name": "@node/pkg1",
  "version": "4.0.0"
}

filename: node/pkg2/CHANGELOG.md
# Changelog

## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))

filename: node/pkg2/package.json
{
  "name": "@node/pkg2",
  "version": "0.2.0"
}

filename: python/CHANGELOG.md
# Changelog

### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))

filename: python/setup.cfg
version=1.2.4

filename: python/setup.py
version = "1.2.4"

filename: python/src/foolib/version.py
__version__ = "1.2.4"

filename: .release-please-manifest.json
{
  "node/pkg1": "4.0.0",
  "node/pkg2": "0.2.0",
  "python": "1.2.4"
}

`

exports['Manifest pullRequest boostraps from HEAD manifest starting at bootstrap-sha if first PR: options'] = `

upstreamOwner: fake
upstreamRepo: repo
title: chore: release
branch: release-please/branches/main
description: :robot: I have created a release \\*beep\\* \\*boop\\*

---
@node/pkg1: 4.0.0
## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))
---


---
@node/pkg2: 0.2.0
## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))
---


---
foolib: 1.2.4
### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release
`

exports['Manifest pullRequest bootstraps a new package from curated manifest: changes'] = `

filename: node/pkg1/CHANGELOG.md
# Changelog

## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))

filename: node/pkg1/package.json
{
  "name": "@node/pkg1",
  "version": "4.0.0"
}

filename: node/pkg2/CHANGELOG.md
# Changelog

## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))

filename: node/pkg2/package.json
{
  "name": "@node/pkg2",
  "version": "0.2.0"
}

filename: python/CHANGELOG.md
# Changelog

### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))

filename: python/setup.cfg
version=1.2.4

filename: python/setup.py
version = "1.2.4"

filename: python/src/foolib/version.py
__version__ = "1.2.4"

filename: .release-please-manifest.json
{
  "node/pkg1": "4.0.0",
  "node/pkg2": "0.2.0",
  "python": "1.2.4"
}

`

exports['Manifest pullRequest bootstraps a new package from curated manifest: options'] = `

upstreamOwner: fake
upstreamRepo: repo
title: chore: release
branch: release-please/branches/main
description: :robot: I have created a release \\*beep\\* \\*boop\\*

---
@node/pkg1: 4.0.0
## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))
---


---
@node/pkg2: 0.2.0
## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))
---


---
foolib: 1.2.4
### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release
`

exports['Manifest pullRequest bootstraps a new package using default version: changes'] = `

filename: node/pkg1/CHANGELOG.md
# Changelog

## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))

filename: node/pkg1/package.json
{
  "name": "@node/pkg1",
  "version": "4.0.0"
}

filename: node/pkg2/CHANGELOG.md
# Changelog

## 1.0.0 (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))

filename: node/pkg2/package.json
{
  "name": "@node/pkg2",
  "version": "1.0.0"
}

filename: python/CHANGELOG.md
# Changelog

### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))

filename: python/setup.cfg
version=1.2.4

filename: python/setup.py
version = "1.2.4"

filename: python/src/foolib/version.py
__version__ = "1.2.4"

filename: .release-please-manifest.json
{
  "node/pkg1": "4.0.0",
  "node/pkg2": "1.0.0",
  "python": "1.2.4"
}

`

exports['Manifest pullRequest bootstraps a new package using default version: options'] = `

upstreamOwner: fake
upstreamRepo: repo
title: chore: release
branch: release-please/branches/main
description: :robot: I have created a release \\*beep\\* \\*boop\\*

---
@node/pkg1: 4.0.0
## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))
---


---
@node/pkg2: 1.0.0
## 1.0.0 (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))
---


---
foolib: 1.2.4
### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release
`

exports['Manifest pullRequest creates a PR for python and node packages: changes'] = `

filename: node/pkg1/CHANGELOG.md
# Changelog

## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))

filename: node/pkg1/package.json
{
  "name": "@node/pkg1",
  "version": "4.0.0"
}

filename: python/CHANGELOG.md
# Changelog

### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))

filename: python/setup.cfg
version=1.2.4

filename: python/setup.py
version = "1.2.4"

filename: python/src/foolib/version.py
__version__ = "1.2.4"

filename: .release-please-manifest.json
{
  "node/pkg1": "4.0.0",
  "python": "1.2.4"
}

`

exports['Manifest pullRequest creates a PR for python and node packages: options'] = `

upstreamOwner: fake
upstreamRepo: repo
title: chore: release
branch: release-please/branches/main
description: :robot: I have created a release \\*beep\\* \\*boop\\*

---
@node/pkg1: 4.0.0
## [4.0.0](https://www.github.com/fake/repo/compare/pkg1-v3.2.1...pkg1-v4.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** major new feature

### Features

* **@node/pkg1:** major new feature ([e3ab0ab](https://www.github.com/fake/repo/commit/e3ab0abfd66e66324f685ceeececf35c))
---


---
foolib: 1.2.4
### [1.2.4](https://www.github.com/fake/repo/compare/foolib-v1.2.3...foolib-v1.2.4) (1983-10-10)


### Bug Fixes

* **foolib:** bufix python foolib ([8df9117](https://www.github.com/fake/repo/commit/8df9117959264dc5b7b6c72ff36b8846))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release
`

exports['Manifest pullRequest only includes packages that have version bumps: changes'] = `

filename: node/pkg2/CHANGELOG.md
# Changelog

## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))

filename: node/pkg2/package.json
{
  "name": "@node/pkg2",
  "version": "0.2.0"
}

filename: .release-please-manifest.json
{
  "node/pkg1": "3.2.1",
  "node/pkg2": "0.2.0",
  "python": "1.2.3"
}

`

exports['Manifest pullRequest only includes packages that have version bumps: options'] = `

upstreamOwner: fake
upstreamRepo: repo
title: chore: release
branch: release-please/branches/main
description: :robot: I have created a release \\*beep\\* \\*boop\\*

---
@node/pkg2: 0.2.0
## [0.2.0](https://www.github.com/fake/repo/compare/pkg2-v0.1.2...pkg2-v0.2.0) (1983-10-10)


### Features

* **@node/pkg2:** new feature ([6cefc4f](https://www.github.com/fake/repo/commit/6cefc4f5b1f432a24f7c066c5dd95e68))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release
`

exports['Manifest pullRequest respects python releaser specific config over defaults: changes'] = `

filename: node/pkg1/HISTORY.md
# Changelog

### [5.5.5](https://www.github.com/fake/repo/compare/pkg1-v0.1.1...pkg1-v5.5.5) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** node feature

### Default Features Section

* **@node/pkg1:** node feature ([8ef6b52](https://www.github.com/fake/repo/commit/8ef6b521e268395ded9b66bb1ff89696))

filename: node/pkg1/package.json
{
  "name": "@node/pkg1",
  "version": "5.5.5"
}

filename: node/pkg2/CHANGELOG.md
# Changelog

## [0.3.0](https://www.github.com/fake/repo/compare/pkg2-v0.2.2...pkg2-v0.3.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg2:** node2 feature

### Default Features Section

* **@node/pkg2:** node2 feature ([f3373c7](https://www.github.com/fake/repo/commit/f3373c71ffaf1a67b19ce6a116e861ea))

filename: node/pkg2/package.json
{
  "name": "@node/pkg2",
  "version": "0.3.0"
}

filename: python/CHANGELOG.md
# Changelog

## [1.0.0](https://www.github.com/fake/repo/compare/foolib-v0.1.1...foolib-v1.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **foolib:** python feature

### Python Bug Fixes Section

* **foolib:** python bufix ([9b5d4fe](https://www.github.com/fake/repo/commit/9b5d4fe30c7e2cd5faed2c96868e6e93))


### Python Features Section

* **foolib:** python feature ([33fcc00](https://www.github.com/fake/repo/commit/33fcc0047b2eb3a66854f25c480b5b7e))

filename: python/setup.cfg
version=1.0.0

filename: python/setup.py
version = "1.0.0"

filename: python/src/foolib/version.py
__version__ = "1.0.0"

filename: .release-please-manifest.json
{
  "node/pkg1": "5.5.5",
  "node/pkg2": "0.3.0",
  "python": "1.0.0"
}

`

exports['Manifest pullRequest respects python releaser specific config over defaults: options'] = `

upstreamOwner: fake
upstreamRepo: repo
title: chore: release
branch: release-please/branches/main
description: :robot: I have created a release \\*beep\\* \\*boop\\*

---
@node/pkg1: 5.5.5
### [5.5.5](https://www.github.com/fake/repo/compare/pkg1-v0.1.1...pkg1-v5.5.5) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg1:** node feature

### Default Features Section

* **@node/pkg1:** node feature ([8ef6b52](https://www.github.com/fake/repo/commit/8ef6b521e268395ded9b66bb1ff89696))
---


---
@node/pkg2: 0.3.0
## [0.3.0](https://www.github.com/fake/repo/compare/pkg2-v0.2.2...pkg2-v0.3.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **@node/pkg2:** node2 feature

### Default Features Section

* **@node/pkg2:** node2 feature ([f3373c7](https://www.github.com/fake/repo/commit/f3373c71ffaf1a67b19ce6a116e861ea))
---


---
foolib: 1.0.0
## [1.0.0](https://www.github.com/fake/repo/compare/foolib-v0.1.1...foolib-v1.0.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* **foolib:** python feature

### Python Bug Fixes Section

* **foolib:** python bufix ([9b5d4fe](https://www.github.com/fake/repo/commit/9b5d4fe30c7e2cd5faed2c96868e6e93))


### Python Features Section

* **foolib:** python feature ([33fcc00](https://www.github.com/fake/repo/commit/33fcc0047b2eb3a66854f25c480b5b7e))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release
`
