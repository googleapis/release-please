exports['GenericJson updateContent updates deep entry 1'] = `
{
  "name": "release-please",
  "version": "11.1.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "release-please",
      "version": "2.3.4"
    }
  }
}

`

exports['GenericJson updateContent updates matching entry 1'] = `
{
  "name": "sample",
  "version": "2.3.4",
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

`
