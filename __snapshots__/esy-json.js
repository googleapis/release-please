exports['EsyJson updateContent updates version in esy.json file 1'] = `
{
  "name": "sample",
  "version": "0.6.0",
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
