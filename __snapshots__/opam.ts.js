exports['Opam updateContent updates version in opam file 1'] = `
opam-version: "2.0"
version: "0.6.0"
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

`
