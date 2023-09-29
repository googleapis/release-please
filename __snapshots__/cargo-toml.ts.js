exports['CargoToml updateContent updates (only) path dependencies 1'] = `
[package]
name = "rust-test-repo"
version = "12.0.0"

# To learn about other keys, check out Cargo's documentation

[dependencies]
normal-dep = "1.2.3"

[dev-dependencies]
dev-dep = { version = "1.2.3" }
dev-dep-2 = { path = "../dev-dep-2" }

[build-dependencies]
# this is using a private registry
build-dep = { version = "2.0.0", registry = "private", path = ".." } # trailing comment

[target.'cfg(windows)'.dev-dependencies]
windows-dep = { version = "2.0.0", registry = "private", path = ".." }

[target.'cfg(unix)'.dependencies]
unix-dep = { version = "2.0.0", registry = "private", path = ".." }

[target.'cfg(target_arch = "x86")'.dependencies]
x86-dep = { version = "2.0.0", registry = "private", path = ".." }

[target.'cfg(target_arch = "x86_64")'.dependencies]
x86-64-dep = { version = "2.0.0", registry = "private", path = ".." }

[target.'cfg(foobar)'.dependencies]
foobar-dep = "1.2.3"

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
dev-dep-2 = { path = "../dev-dep-2" }

[build-dependencies]
# this is using a private registry
build-dep = { version = "1.2.3", registry = "private", path = ".." } # trailing comment

[target.'cfg(windows)'.dev-dependencies]
windows-dep = { version = "1.2.3", registry = "private", path = ".." }

[target.'cfg(unix)'.dependencies]
unix-dep = { version = "1.2.3", registry = "private", path = ".." }

[target.'cfg(target_arch = "x86")'.dependencies]
x86-dep = { version = "1.2.3", registry = "private", path = ".." }

[target.'cfg(target_arch = "x86_64")'.dependencies]
x86-64-dep = { version = "1.2.3", registry = "private", path = ".." }

[target.'cfg(foobar)'.dependencies]
foobar-dep = "1.2.3"

`
