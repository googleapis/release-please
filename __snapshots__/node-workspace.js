exports['NodeWorkspaceDependencyUpdates run does not update dependencies on preMajor versions with minor bump changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.### [1.1.2](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)


### Bug Fixes

* We fixed a bug!
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgB",
    "path": "packages/pkgB"
  },
  "prData": {
    "version": "0.3.0",
    "changes": {}
  }
}

filename: packages/pkgB/package.json
{
  "name": "@here/pkgB",
  "version": "0.3.0",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "someExternal": "^9.2.3"
  }
}

filename: packages/pkgB/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [0.3.0](https://www.github.com/fake/repo/compare/pkgB-v0.2.1...pkgB-v0.3.0) (1983-10-10)


### Features

* We added a feature


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.1 to ^1.1.2

### [0.2.1](https://www.github.com/fake/repo/compare/pkgB-v0.2.0...pkgB-v0.2.1) (1983-10-10)


### Bug Fixes

* We fixed a bug
====================
{
  "config": {
    "path": "packages/pkgC",
    "releaseType": "node",
    "packageName": "@here/pkgC"
  },
  "prData": {
    "version": "3.3.4",
    "changes": {}
  }
}

filename: packages/pkgC/package.json
{
  "name": "@here/pkgC",
  "version": "3.3.4",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "@here/pkgB": "^0.2.1",
    "anotherExternal": "^4.3.1"
  }
}

filename: packages/pkgC/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [3.3.4](https://www.github.com/fake/repo/compare/pkgC-v3.3.3...pkgC-v3.3.4) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.1 to ^1.1.2

### [3.3.3](https://www.github.com/fake/repo/compare/pkgC-v3.3.2...pkgC-v3.3.3) (1983-10-10)


### Bug Fixes

* We fixed a bug


`

exports['NodeWorkspaceDependencyUpdates run does not update dependencies on preMajor versions with minor bump logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: found packages/pkgB/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgC/package.json from github",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgB/package.json to 0.3.0 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgC/package.json to 3.3.4 from dependency bump",
    "success"
  ],
  [
    "node-workspace: @here/pkgB.@here/pkgA updated to ^1.1.2",
    "success"
  ],
  [
    "node-workspace: @here/pkgC.@here/pkgA updated to ^1.1.2",
    "success"
  ]
]

exports['NodeWorkspaceDependencyUpdates run does not update dependency to pre-release version changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2-alpha.0",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2-alpha.0",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [1.1.2-alpha.0](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2-alpha.0) (1983-10-10)


### Bug Fixes

* We fixed a bug!

`

exports['NodeWorkspaceDependencyUpdates run does not update dependency to pre-release version logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from github",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2-alpha.0 from release-please",
    "success"
  ]
]

exports['NodeWorkspaceDependencyUpdates run does not update dependent with invalid version changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.### [1.1.2](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)


### Bug Fixes

* We fixed a bug!
====================
{
  "config": {
    "path": "packages/pkgB",
    "releaseType": "node",
    "packageName": "@here/pkgB"
  },
  "prData": {
    "version": "some-invalid-version",
    "changes": {}
  }
}

filename: packages/pkgB/package.json
{
  "name": "@here/pkgB",
  "version": "some-invalid-version",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "someExternal": "^9.2.3"
  }
}

filename: packages/pkgB/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

## [some-invalid-version](https://www.github.com/fake/repo/compare/pkgB-vsome-invalid-version...pkgB-vsome-invalid-version) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.1 to ^1.1.2

### [some-invalid-version](https://www.github.com/fake/repo/compare/pkgB-v2.2.1...pkgB-vsome-invalid-version) (1983-10-10)


### Bug Fixes

* We fixed a bug and set the version wonky on purpose?


`

exports['NodeWorkspaceDependencyUpdates run does not update dependent with invalid version logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from github",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2 from release-please",
    "success"
  ],
  [
    "node-workspace: Don't know how to patch @here/pkgB's version(some-invalid-version)",
    "failure"
  ],
  [
    "node-workspace: setting packages/pkgB/package.json to some-invalid-version from failed to patch bump",
    "success"
  ],
  [
    "node-workspace: @here/pkgB.@here/pkgA updated to ^1.1.2",
    "success"
  ]
]

exports['NodeWorkspaceDependencyUpdates run handles a simple chain where root pkg update cascades to dependents changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.### [1.1.2](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)


### Bug Fixes

* We fixed a bug!
====================
{
  "config": {
    "releaseType": "python",
    "path": "py/pkg"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: py/pkg/setup.py
some python version content
====================
{
  "config": {
    "path": "packages/pkgB",
    "releaseType": "node",
    "packageName": "@here/pkgB"
  },
  "prData": {
    "version": "2.2.3",
    "changes": {}
  }
}

filename: packages/pkgB/package.json
{
  "name": "@here/pkgB",
  "version": "2.2.3",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "someExternal": "^9.2.3"
  }
}

filename: packages/pkgB/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [2.2.3](https://www.github.com/fake/repo/compare/pkgB-v2.2.2...pkgB-v2.2.3) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.1 to ^1.1.2

### [2.2.2](https://www.github.com/fake/repo/compare/pkgB-v2.2.1...pkgB-v2.2.2) (1983-10-10)


### Bug Fixes

* We fixed a bug

====================
{
  "config": {
    "path": "packages/pkgC",
    "releaseType": "node",
    "packageName": "@here/pkgC"
  },
  "prData": {
    "version": "3.3.4",
    "changes": {}
  }
}

filename: packages/pkgC/package.json
{
  "name": "@here/pkgC",
  "version": "3.3.4",
  "dependencies": {
    "@here/pkgB": "^2.2.3",
    "anotherExternal": "^4.3.1"
  }
}

filename: packages/pkgC/CHANGELOG.md
# Changelog

### [3.3.4](https://www.github.com/fake/repo/compare/pkgC-v3.3.3...pkgC-v3.3.4) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgB bumped from ^2.2.2 to ^2.2.3


`

exports['NodeWorkspaceDependencyUpdates run handles a simple chain where root pkg update cascades to dependents logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from github",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgC/package.json from github",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgB/package.json to 2.2.3 from dependency bump",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgC/package.json to 3.3.4 from dependency bump",
    "success"
  ],
  [
    "node-workspace: @here/pkgB.@here/pkgA updated to ^1.1.2",
    "success"
  ],
  [
    "node-workspace: @here/pkgC.@here/pkgB updated to ^2.2.3",
    "success"
  ]
]

exports['NodeWorkspaceDependencyUpdates run handles a triangle: root and one leg updates bumps other leg changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.### [1.1.2](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)


### Bug Fixes

* We fixed a bug!
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgB",
    "path": "packages/pkgB"
  },
  "prData": {
    "version": "2.3.0",
    "changes": {}
  }
}

filename: packages/pkgB/package.json
{
  "name": "@here/pkgB",
  "version": "2.3.0",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "someExternal": "^9.2.3"
  }
}

filename: packages/pkgB/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [2.3.0](https://www.github.com/fake/repo/compare/pkgB-v2.2.2...pkgB-v2.3.0) (1983-10-10)


### Features

* We added a feature


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.1 to ^1.1.2

### [2.2.2](https://www.github.com/fake/repo/compare/pkgB-v2.2.1...pkgB-v2.2.2) (1983-10-10)


### Bug Fixes

* We fixed a bug
====================
{
  "config": {
    "path": "packages/pkgC",
    "releaseType": "node",
    "packageName": "@here/pkgC"
  },
  "prData": {
    "version": "3.3.4",
    "changes": {}
  }
}

filename: packages/pkgC/package.json
{
  "name": "@here/pkgC",
  "version": "3.3.4",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "@here/pkgB": "^2.3.0",
    "anotherExternal": "^4.3.1"
  }
}

filename: packages/pkgC/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [3.3.4](https://www.github.com/fake/repo/compare/pkgC-v3.3.3...pkgC-v3.3.4) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.1 to ^1.1.2
    * @here/pkgB bumped from ^2.2.2 to ^2.3.0

### [3.3.3](https://www.github.com/fake/repo/compare/pkgC-v3.3.2...pkgC-v3.3.3) (1983-10-10)


### Bug Fixes

* We fixed a bug


`

exports['NodeWorkspaceDependencyUpdates run handles a triangle: root and one leg updates bumps other leg logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: found packages/pkgB/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgC/package.json from github",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgB/package.json to 2.3.0 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgC/package.json to 3.3.4 from dependency bump",
    "success"
  ],
  [
    "node-workspace: @here/pkgB.@here/pkgA updated to ^1.1.2",
    "success"
  ],
  [
    "node-workspace: @here/pkgC.@here/pkgA updated to ^1.1.2",
    "success"
  ],
  [
    "node-workspace: @here/pkgC.@here/pkgB updated to ^2.3.0",
    "success"
  ]
]

exports['NodeWorkspaceDependencyUpdates run handles discontiguous graph changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.### [1.1.2](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)


### Bug Fixes

* We fixed a bug!
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgAA",
    "path": "packages/pkgAA"
  },
  "prData": {
    "version": "11.2.0",
    "changes": {}
  }
}

filename: packages/pkgAA/package.json
{
  "name": "@here/pkgAA",
  "version": "11.2.0",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgAA/CHANGELOG.md
### [11.2.0](https://www.github.com/fake/repo/compare/pkgAA-v11.1.1...pkgAA-v11.2.0) (1983-10-10)


### Features

* We added a feature
====================
{
  "config": {
    "path": "packages/pkgB",
    "releaseType": "node",
    "packageName": "@here/pkgB"
  },
  "prData": {
    "version": "2.2.3",
    "changes": {}
  }
}

filename: packages/pkgB/package.json
{
  "name": "@here/pkgB",
  "version": "2.2.3",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "someExternal": "^9.2.3"
  }
}

filename: packages/pkgB/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [2.2.3](https://www.github.com/fake/repo/compare/pkgB-v2.2.2...pkgB-v2.2.3) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.1 to ^1.1.2

### [2.2.2](https://www.github.com/fake/repo/compare/pkgB-v2.2.1...pkgB-v2.2.2) (1983-10-10)


### Bug Fixes

* We fixed a bug

====================
{
  "config": {
    "path": "packages/pkgBB",
    "releaseType": "node",
    "packageName": "@here/pkgBB"
  },
  "prData": {
    "version": "22.2.3",
    "changes": {}
  }
}

filename: packages/pkgBB/package.json
{
  "name": "@here/pkgBB",
  "version": "22.2.3",
  "dependencies": {
    "@here/pkgAA": "^11.2.0",
    "someExternal": "^9.2.3"
  }
}

filename: packages/pkgBB/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [22.2.3](https://www.github.com/fake/repo/compare/pkgBB-v22.2.2...pkgBB-v22.2.3) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgAA bumped from ^11.1.1 to ^11.2.0

### [22.2.2](https://www.github.com/fake/repo/compare/pkgBB-v22.2.1...pkgBB-v22.2.2) (1983-10-10)


### Bug Fixes

* We fixed a bug


`

exports['NodeWorkspaceDependencyUpdates run handles discontiguous graph logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: found packages/pkgAA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from github",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgAA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgBB/package.json from github",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgB/package.json to 2.2.3 from dependency bump",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgAA/package.json to 11.2.0 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgBB/package.json to 22.2.3 from dependency bump",
    "success"
  ],
  [
    "node-workspace: @here/pkgB.@here/pkgA updated to ^1.1.2",
    "success"
  ],
  [
    "node-workspace: @here/pkgBB.@here/pkgAA updated to ^11.2.0",
    "success"
  ]
]

exports['NodeWorkspaceDependencyUpdates run handles errors retrieving changelogs changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.### [1.1.2](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)


### Bug Fixes

* We fixed a bug!
====================
{
  "config": {
    "path": "packages/pkgB",
    "releaseType": "node",
    "changelogPath": "CHANGES.md",
    "packageName": "@here/pkgB"
  },
  "prData": {
    "version": "2.2.3",
    "changes": {}
  }
}

filename: packages/pkgB/package.json
{
  "name": "@here/pkgB",
  "version": "2.2.3",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "someExternal": "^9.2.3"
  }
}

====================
{
  "config": {
    "path": "packages/pkgC",
    "releaseType": "node",
    "packageName": "@here/pkgC"
  },
  "prData": {
    "version": "3.3.4",
    "changes": {}
  }
}

filename: packages/pkgC/package.json
{
  "name": "@here/pkgC",
  "version": "3.3.4",
  "dependencies": {
    "@here/pkgB": "^2.2.3",
    "anotherExternal": "^4.3.1"
  }
}

filename: packages/pkgC/CHANGELOG.md
# Changelog

### [3.3.4](https://www.github.com/fake/repo/compare/pkgC-v3.3.3...pkgC-v3.3.4) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgB bumped from ^2.2.2 to ^2.2.3


`

exports['NodeWorkspaceDependencyUpdates run handles errors retrieving changelogs logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from github",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgC/package.json from github",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgB/package.json to 2.2.3 from dependency bump",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgC/package.json to 3.3.4 from dependency bump",
    "success"
  ],
  [
    "node-workspace: @here/pkgB.@here/pkgA updated to ^1.1.2",
    "success"
  ],
  [
    "node-workspace: @here/pkgC.@here/pkgB updated to ^2.2.3",
    "success"
  ],
  [
    "node-workspace: Failed to retrieve packages/pkgB/CHANGES.md: Error: error: 501",
    "failure"
  ],
  [
    "node-workspace: Creating a new changelog at packages/pkgC/CHANGELOG.md",
    "success"
  ]
]

exports['NodeWorkspaceDependencyUpdates run handles unusual changelog formats changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.### [1.1.2](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)


### Bug Fixes

* We fixed a bug!
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgB",
    "path": "packages/pkgB"
  },
  "prData": {
    "version": "2.3.0",
    "changes": {}
  }
}

filename: packages/pkgB/package.json
{
  "name": "@here/pkgB",
  "version": "2.3.0",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "someExternal": "^9.2.3"
  }
}

filename: packages/pkgB/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [2.3.0](https://www.github.com/fake/repo/compare/pkgB-v2.2.2...pkgB-v2.3.0) (1983-10-10)


### Features

* We added a feature

### some stuff we did not expect

* and more unexpected stuff


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.1 to ^1.1.2

`

exports['NodeWorkspaceDependencyUpdates run handles unusual changelog formats logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: found packages/pkgB/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgB/package.json to 2.3.0 from release-please",
    "success"
  ],
  [
    "node-workspace: @here/pkgB.@here/pkgA updated to ^1.1.2",
    "success"
  ],
  [
    "node-workspace: Appending update notes to end of changelog for @here/pkgB",
    "failure"
  ]
]

exports['NodeWorkspaceDependencyUpdates run prefers release-as configuration over default patch-bump changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.### [1.1.2](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)


### Bug Fixes

* We fixed a bug!
====================
{
  "config": {
    "path": "packages/pkgB",
    "releaseType": "node",
    "releaseAs": "2.3.0",
    "packageName": "@here/pkgB"
  },
  "prData": {
    "version": "2.3.0",
    "changes": {}
  }
}

filename: packages/pkgB/package.json
{
  "name": "@here/pkgB",
  "version": "2.3.0",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "someExternal": "^9.2.3"
  }
}

filename: packages/pkgB/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

## [2.3.0](https://www.github.com/fake/repo/compare/pkgB-v2.2.2...pkgB-v2.3.0) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.1 to ^1.1.2

### [2.2.2](https://www.github.com/fake/repo/compare/pkgB-v2.2.1...pkgB-v2.2.2) (1983-10-10)


### Bug Fixes

* We fixed a bug

====================
{
  "config": {
    "path": "packages/pkgC",
    "releaseType": "node",
    "packageName": "@here/pkgC"
  },
  "prData": {
    "version": "3.3.4",
    "changes": {}
  }
}

filename: packages/pkgC/package.json
{
  "name": "@here/pkgC",
  "version": "3.3.4",
  "dependencies": {
    "@here/pkgB": "^2.3.0",
    "anotherExternal": "^4.3.1"
  }
}

filename: packages/pkgC/CHANGELOG.md
# Changelog

### [3.3.4](https://www.github.com/fake/repo/compare/pkgC-v3.3.3...pkgC-v3.3.4) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgB bumped from ^2.2.2 to ^2.3.0


`

exports['NodeWorkspaceDependencyUpdates run prefers release-as configuration over default patch-bump logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from github",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgC/package.json from github",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgB/package.json to 2.3.0 from release-as configuration",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgC/package.json to 3.3.4 from dependency bump",
    "success"
  ],
  [
    "node-workspace: @here/pkgB.@here/pkgA updated to ^1.1.2",
    "success"
  ],
  [
    "node-workspace: @here/pkgC.@here/pkgB updated to ^2.3.0",
    "success"
  ]
]

exports['NodeWorkspaceDependencyUpdates run updates dependent from pre-release version changes'] = `
====================
{
  "config": {
    "releaseType": "node",
    "packageName": "@here/pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/package.json
{
  "name": "@here/pkgA",
  "version": "1.1.2",
  "dependencies": {
    "@there/foo": "^4.1.7"
  }
}

filename: packages/pkgA/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.### [1.1.2](https://www.github.com/fake/repo/compare/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)


### Bug Fixes

* We fixed a bug!
====================
{
  "config": {
    "path": "packages/pkgB",
    "releaseType": "node",
    "packageName": "@here/pkgB"
  },
  "prData": {
    "version": "2.2.3",
    "changes": {}
  }
}

filename: packages/pkgB/package.json
{
  "name": "@here/pkgB",
  "version": "2.2.3",
  "dependencies": {
    "@here/pkgA": "^1.1.2",
    "someExternal": "^9.2.3"
  }
}

filename: packages/pkgB/CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

### [2.2.3](https://www.github.com/fake/repo/compare/pkgB-v2.2.2...pkgB-v2.2.3) (1983-10-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @here/pkgA bumped from ^1.1.2-alpha.0 to ^1.1.2

### [2.2.2](https://www.github.com/fake/repo/compare/pkgB-v2.2.1...pkgB-v2.2.2) (1983-10-10)


### Bug Fixes

* We fixed a bug


`

exports['NodeWorkspaceDependencyUpdates run updates dependent from pre-release version logs'] = [
  [
    "node-workspace: found packages/pkgA/package.json in changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgA/package.json from existing changes",
    "success"
  ],
  [
    "node-workspace: loaded packages/pkgB/package.json from github",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgA/package.json to 1.1.2 from release-please",
    "success"
  ],
  [
    "node-workspace: setting packages/pkgB/package.json to 2.2.3 from dependency bump",
    "success"
  ],
  [
    "node-workspace: @here/pkgB.@here/pkgA updated to ^1.1.2",
    "success"
  ]
]
