exports['OCaml run creates a release PR for non-monorepo (esy.json + sample.opam) 1'] = `

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

exports['OCaml run creates a release PR for non-monorepo (esy.json) 1'] = `

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

exports['OCaml run creates a release PR for non-monorepo (sample.opam) 1'] = `

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

exports['OCaml run creates a release PR for non-monorepo (package.json) 1'] = `

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

exports['OCaml run skips JSON files that don\'t contain a "version" field 1'] = `

filename: CHANGELOG.md
# Changelog

### [0.5.1](https://www.github.com/phated/ocaml-sample-repo/compare/v0.5.0...v0.5.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/phated/ocaml-sample-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/phated/ocaml-sample-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))


### Miscellaneous Chores

* update common templates ([3006009](https://www.github.com/phated/ocaml-sample-repo/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))

`
