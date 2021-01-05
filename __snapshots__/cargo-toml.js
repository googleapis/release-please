exports['CargoToml updateContent updates the crate version 1'] = `
[package]
name = "rust-test-repo"
version = "14.0.0"

[dependencies]
normal-dep = "1.2.3"

[dev-dependencies.dev-dep]
version = "1.2.3"

[build-dependencies.build-dep]
version = "1.2.3"
registry = "private"
path = ".."

`

exports['CargoToml updateContent updates (only) path dependencies 1'] = `
[package]
name = "rust-test-repo"
version = "12.0.0"

[dependencies]
normal-dep = "1.2.3"

[dev-dependencies.dev-dep]
version = "1.2.3"

[build-dependencies.build-dep]
version = "2.0.0"
registry = "private"
path = ".."

`
