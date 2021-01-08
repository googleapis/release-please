exports['Rust run creates a release PR for non-monorepo 1'] = `

filename: CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/fasterthanlime/rust-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/fasterthanlime/rust-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/fasterthanlime/rust-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

filename: Cargo.toml
[package]
name = "crate1"
version = "0.123.5"

`

exports['Rust run creates a release PR for monorepo 1'] = `

filename: crates/crate1/CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/fasterthanlime/rust-test-repo/compare/crate1-v0.123.4...crate1-v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/fasterthanlime/rust-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/fasterthanlime/rust-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

filename: crates/crate1/Cargo.toml
[package]
name = "crate1"
version = "0.123.5"

filename: crates/crate2/Cargo.toml
[package]
name = "crate2"
version = "0.4.321"

[dependencies.crate1]
version = "0.123.5"
path = "../crate2"

`
