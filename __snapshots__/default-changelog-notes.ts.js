exports['DefaultChangelogNotes buildNotes should build default release notes 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* some bugfix

### Features

* some feature ([sha1](https://github.com/googleapis/java-asset/commit/sha1))


### Bug Fixes

* some bugfix ([sha2](https://github.com/googleapis/java-asset/commit/sha2))
`

exports['DefaultChangelogNotes buildNotes should build with custom changelog sections 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* some bugfix

### Features

* some feature ([sha1](https://github.com/googleapis/java-asset/commit/sha1))


### Bug Fixes

* some bugfix ([sha2](https://github.com/googleapis/java-asset/commit/sha2))


### Documentation

* some documentation ([sha3](https://github.com/googleapis/java-asset/commit/sha3))
`

exports['DefaultChangelogNotes buildNotes should handle BREAKING CHANGE notes 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* some bugfix

### Bug Fixes

* some bugfix ([sha2](https://github.com/googleapis/java-asset/commit/sha2))
`

exports['DefaultChangelogNotes buildNotes should ignore "chore: release" commits 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### Chores

* some chore ([sha1](https://github.com/googleapis/java-asset/commit/sha1))
`

exports['DefaultChangelogNotes buildNotes should ignore RELEASE AS notes 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* some bugfix

### Bug Fixes

* some bugfix ([sha2](https://github.com/googleapis/java-asset/commit/sha2))
`

exports['DefaultChangelogNotes buildNotes with commit parsing handles Release-As footers 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### meta

* correct release ([1f64add](https://github.com/googleapis/java-asset/commit/1f64add37f426e87ce1b777616a137ec))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should allow customizing sections 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### Miscellaneous Chores

* some chore ([be1aa27](https://github.com/googleapis/java-asset/commit/be1aa271694db576f28f23da1df93519))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle BREAKING CHANGE body 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* this is actually a breaking change

### Features

* some feature ([78abf20](https://github.com/googleapis/java-asset/commit/78abf20625d3ff86d627b5c6e0cacd06))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle a breaking change 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* some bugfix

### Bug Fixes

* some bugfix ([05670cf](https://github.com/googleapis/java-asset/commit/05670cf2e850beffe53bb2691f8701c7))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle a breaking change with reference 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* some bugfix ([#1234](https://github.com/googleapis/java-asset/issues/1234))

### Bug Fixes

* some bugfix ([#1234](https://github.com/googleapis/java-asset/issues/1234)) ([749cd8b](https://github.com/googleapis/java-asset/commit/749cd8b9edc6103a2f40a34ca45c31c5))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle bug links 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### Bug Fixes

* some fix ([71489e6](https://github.com/googleapis/java-asset/commit/71489e63ad212c54598f5bdcbedec5f6)), closes [#123](https://github.com/googleapis/java-asset/issues/123)
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle git trailers 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* this is actually a breaking change

### Bug Fixes

* some fix ([c538c97](https://github.com/googleapis/java-asset/commit/c538c973dc84b83ee6b699cf6433f0b3))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle html tags 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### Features

* render all imagesets as &lt;picture&gt; ([383fb14](https://github.com/googleapis/java-asset/commit/383fb14708ae91f7bb7e64bf0bacab38))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle inline bug links 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### Bug Fixes

* some bugfix ([#1234](https://github.com/googleapis/java-asset/issues/1234)) ([6f2163b](https://github.com/googleapis/java-asset/commit/6f2163be093d8a8dd90232d06b45c07e))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle meta commits 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* **recaptchaenterprise:** for some reason this migration is breaking.

### Features

* **recaptchaenterprise:** migrate microgenerator ([3cf10aa](https://github.com/googleapis/java-asset/commit/3cf10aa5f94cd40a1d0d08e573eb737f))


### Bug Fixes

* fixes bug [#733](https://github.com/googleapis/java-asset/issues/733) ([3cf10aa](https://github.com/googleapis/java-asset/commit/3cf10aa5f94cd40a1d0d08e573eb737f))
* **securitycenter:** fixes security center. ([3cf10aa](https://github.com/googleapis/java-asset/commit/3cf10aa5f94cd40a1d0d08e573eb737f))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle multi-line breaking change, if prefixed with list 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* we were on Node 6
    - deleted API foo
    - deleted API bar

### Miscellaneous Chores

* upgrade to Node 7 ([a931c2d](https://github.com/googleapis/java-asset/commit/a931c2d29e9849c6989dfd4712226699))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should handle multi-line breaking changes 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* we were on Node 6 second line third line

### Miscellaneous Chores

* upgrade to Node 7 ([8916be7](https://github.com/googleapis/java-asset/commit/8916be74596394c27516696b957fd0d7))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should not include content two newlines after BREAKING CHANGE 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### ⚠ BREAKING CHANGES

* we were on Node 6

### Miscellaneous Chores

* upgrade to Node 7 ([66925b0](https://github.com/googleapis/java-asset/commit/66925b06f59fc4fdd3031c498e1b0098))
`

exports['DefaultChangelogNotes buildNotes with commit parsing should parse multiple commit messages from a single commit 1'] = `
## [1.2.3](https://github.com/googleapis/java-asset/compare/v1.2.2...v1.2.3) (1983-10-10)


### Features

* some feature ([2ec0e9b](https://github.com/googleapis/java-asset/commit/2ec0e9bc0ba7deaf762dae213667bf42))


### Bug Fixes

* some bugfix ([2ec0e9b](https://github.com/googleapis/java-asset/commit/2ec0e9bc0ba7deaf762dae213667bf42))
`
