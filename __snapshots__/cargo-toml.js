exports['CargoToml updateContent updates (only) path dependencies 1'] = `
[package]
name = "rust-test-repo"
version = "12.0.0"

# To learn about other keys, check out Cargo's documentation

[dependencies]
normal-dep = "1.2.3"

[dev-dependencies]
dev-dep = { version = "1.2.3" }

[build-dependencies]
# this is using a private registry
build-dep = { version = "2.0.0", registry = "private", path = ".." } # trailing comment

`

exports['CargoToml updateContent updates the crate version while preserving formatting 1'] = `
[package]
name = "rust-test-repo"
version = "14.0.0"

# To learn about other keys, check out Cargo's documentation

[dependencies]
normal-dep = "1.2.3"

[dev-dependencies]
dev-dep = { version = "1.2.3" }

[build-dependencies]
# this is using a private registry
build-dep = { version = "1.2.3", registry = "private", path = ".." } # trailing comment

`
