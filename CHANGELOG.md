# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/?activeTab=versions

## 1.0.0 (2019-05-09)


### Bug Fixes

* add ^ to dependency in samples/package.json ([114a721](https://www.github.com/googleapis/release-please/commit/114a721))
* allow executable ([#11](https://www.github.com/googleapis/release-please/issues/11)) ([2b0219e](https://www.github.com/googleapis/release-please/commit/2b0219e))
* could not handle the very first release of a library before it had any tags. ([#24](https://www.github.com/googleapis/release-please/issues/24)) ([145fa1e](https://www.github.com/googleapis/release-please/commit/145fa1e))
* log message was printing undefined version ([#15](https://www.github.com/googleapis/release-please/issues/15)) ([1724969](https://www.github.com/googleapis/release-please/commit/1724969))
* shebang must be first line ([e8fe4bb](https://www.github.com/googleapis/release-please/commit/e8fe4bb))
* support H2 and H3 CHANGELOG headings ([#6](https://www.github.com/googleapis/release-please/issues/6)) ([39fd82f](https://www.github.com/googleapis/release-please/commit/39fd82f))


### Build System

* upgrade engines field to >=8.10.0 ([#9](https://www.github.com/googleapis/release-please/issues/9)) ([49e7684](https://www.github.com/googleapis/release-please/commit/49e7684))


### Features

* add a label to the release PR for automation ([#4](https://www.github.com/googleapis/release-please/issues/4)) ([c3f0588](https://www.github.com/googleapis/release-please/commit/c3f0588))
* adding a WIP GitHub action for minting releases ([#27](https://www.github.com/googleapis/release-please/issues/27)) ([b159ef3](https://www.github.com/googleapis/release-please/commit/b159ef3))
* adds support for updating release-dependent files in simple Node repo ([#1](https://www.github.com/googleapis/release-please/issues/1)) ([775c0a8](https://www.github.com/googleapis/release-please/commit/775c0a8))
* initial commit of library ([c6dc492](https://www.github.com/googleapis/release-please/commit/c6dc492))
* you must now opt in to bumping minor pre-major ([#10](https://www.github.com/googleapis/release-please/issues/10)) ([f438ced](https://www.github.com/googleapis/release-please/commit/f438ced))


### BREAKING CHANGES

* prior to this the minor was bumped rather than major for pre-major releases
* upgrade engines field to >=8.10.0 (#9)
