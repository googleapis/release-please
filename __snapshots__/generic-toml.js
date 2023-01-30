exports['GenericToml updateContent updates deep entry in toml 1'] = `
[package]
name = "rust-test-repo"
version = "12.0.0"

# To learn about other keys, check out Cargo's documentation

[dependencies]
normal-dep = "1.2.3"

[dev-dependencies]
dev-dep = { version = "2.3.4" }
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

exports['GenericToml updateContent updates matching entry 1'] = `
[package]
name = "rust-test-repo"
version = "2.3.4"

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

exports['GenericToml updateContent updates matching entry with TOML v1.0.0 spec 1'] = `
[package]
version = "2.3.4"

[v1spec]
# taken from toml.io#Arrays examples
integers = [ 1, 2, 3 ]
colors = [ "red", "yellow", "green" ]
nested_arrays_of_ints = [ [ 1, 2 ], [3, 4, 5] ]
nested_mixed_array = [ [ 1, 2 ], ["a", "b", "c"] ]
string_array = [ "all", 'strings', """are the same""", '''type''' ]

[heterogenous]
# Mixed-type arrays are allowed
numbers = [ 0.1, 0.2, 0.5, 1, 2, 5 ]
contributors = [
  "Foo Bar <foo@example.com>",
  { name = "Baz Qux", email = "bazqux@example.com", url = "https://example.com/bazqux" }
]

`
