exports['OCaml run creates a release PR for non-monorepo (esy.json + sample.opam): changes'] = `

filename: esy.json
{
  "name": "sample",
  "version": "0.5.1",
  "description": "A sample esy file.",
  "author": "Example <example@example.org>",
  "license": "Apache-2.0",
  "dependencies": {
    "ocaml": "^4.9.0",
    "@opam/dune": "^2.7.1"
  },
  "devDependencies": {
    "@opam/ocamlformat": "^0.15.0",
    "@opam/ocaml-lsp-server": "^1.1.0"
  },
  "esy": {
    "build": "dune build -p binaryen"
  },
  "scripts": {
    "test": "dune runtest",
    "format": "dune build @fmt --auto-promote"
  },
  "installConfig": {
    "pnp": false
  },
  "keywords": [
    "sample",
    "ocaml"
  ]
}

filename: sample.opam
opam-version: "2.0"
version: "0.5.1"
synopsis: "A sample opam file"
maintainer: "example@example.org"
author: "Example"
license: "Apache-2.0"
homepage: "https://github.com/googleapis/release-please"
dev-repo: "git+https://github.comgoogleapis/release-please.git"
bug-reports: "https://github.com/googleapis/release-please/issues"
build: [
  [ "dune" "subst" ] {pinned}
  [ "dune" "build" "-p" name "-j" jobs ]
]
depends: [
  "ocaml" {>= "4.09"}
  "dune" {>= "2.7.1"}
]

filename: CHANGELOG.md
# Changelog

### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))

`

exports['OCaml run creates a release PR for non-monorepo (esy.json + sample.opam): options'] = `

upstreamOwner: phated
upstreamRepo: ocaml-sample-repo
title: chore: release 0.5.1
branch: release-v0.5.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 0.5.1
`

exports['OCaml run creates a release PR for non-monorepo (esy.json): changes'] = `

filename: esy.json
{
  "name": "sample",
  "version": "0.5.1",
  "description": "A sample esy file.",
  "author": "Example <example@example.org>",
  "license": "Apache-2.0",
  "dependencies": {
    "ocaml": "^4.9.0",
    "@opam/dune": "^2.7.1"
  },
  "devDependencies": {
    "@opam/ocamlformat": "^0.15.0",
    "@opam/ocaml-lsp-server": "^1.1.0"
  },
  "esy": {
    "build": "dune build -p binaryen"
  },
  "scripts": {
    "test": "dune runtest",
    "format": "dune build @fmt --auto-promote"
  },
  "installConfig": {
    "pnp": false
  },
  "keywords": [
    "sample",
    "ocaml"
  ]
}

filename: CHANGELOG.md
# Changelog

### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))

`

exports['OCaml run creates a release PR for non-monorepo (esy.json): options'] = `

upstreamOwner: phated
upstreamRepo: ocaml-sample-repo
title: chore: release 0.5.1
branch: release-v0.5.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 0.5.1
`

exports['OCaml run creates a release PR for non-monorepo (package.json): changes'] = `

filename: package.json
{
  "name": "sample",
  "version": "0.5.1",
  "description": "A sample esy file.",
  "author": "Example <example@example.org>",
  "license": "Apache-2.0",
  "dependencies": {
    "ocaml": "^4.9.0",
    "@opam/dune": "^2.7.1"
  },
  "devDependencies": {
    "@opam/ocamlformat": "^0.15.0",
    "@opam/ocaml-lsp-server": "^1.1.0"
  },
  "esy": {
    "build": "dune build -p binaryen"
  },
  "scripts": {
    "test": "dune runtest",
    "format": "dune build @fmt --auto-promote"
  },
  "installConfig": {
    "pnp": false
  },
  "keywords": [
    "sample",
    "ocaml"
  ]
}

filename: CHANGELOG.md
# Changelog

### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))

`

exports['OCaml run creates a release PR for non-monorepo (package.json): options'] = `

upstreamOwner: phated
upstreamRepo: ocaml-sample-repo
title: chore: release 0.5.1
branch: release-v0.5.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 0.5.1
`

exports['OCaml run creates a release PR for non-monorepo (sample.opam): changes'] = `

filename: sample.opam
opam-version: "2.0"
version: "0.5.1"
synopsis: "A sample opam file"
maintainer: "example@example.org"
author: "Example"
license: "Apache-2.0"
homepage: "https://github.com/googleapis/release-please"
dev-repo: "git+https://github.comgoogleapis/release-please.git"
bug-reports: "https://github.com/googleapis/release-please/issues"
build: [
  [ "dune" "subst" ] {pinned}
  [ "dune" "build" "-p" name "-j" jobs ]
]
depends: [
  "ocaml" {>= "4.09"}
  "dune" {>= "2.7.1"}
]

filename: CHANGELOG.md
# Changelog

### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))

`

exports['OCaml run creates a release PR for non-monorepo (sample.opam): options'] = `

upstreamOwner: phated
upstreamRepo: ocaml-sample-repo
title: chore: release 0.5.1
branch: release-v0.5.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 0.5.1
`

exports['OCaml run skips JSON files that don\'t contain a "version" field: changes'] = `

filename: CHANGELOG.md
# Changelog

### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))

`

exports['OCaml run skips JSON files that don\'t contain a "version" field: options'] = `

upstreamOwner: phated
upstreamRepo: ocaml-sample-repo
title: chore: release 0.5.1
branch: release-v0.5.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 0.5.1
`
