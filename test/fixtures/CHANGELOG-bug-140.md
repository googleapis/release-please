# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [5.0.0](https://www.github.com/bcoe/c8/compare/v4.1.5...v5.0.0) (2019-05-20)


### ⚠ BREAKING CHANGES

* temp directory now defaults to setting for report directory

### Features

* default temp directory to report directory ([#102](https://www.github.com/bcoe/c8/issues/102)) ([8602f4a](https://www.github.com/bcoe/c8/commit/8602f4a))
* load .nycrc/.nycrc.json to simplify migration ([#100](https://www.github.com/bcoe/c8/issues/100)) ([bd7484f](https://www.github.com/bcoe/c8/commit/bd7484f))

### [4.1.5](https://github.com/bcoe/c8/compare/v4.1.4...v4.1.5) (2019-05-11)


### Bug Fixes

* exit with code 1 when report output fails ([#92](https://github.com/bcoe/c8/issues/92)) ([a27b694](https://github.com/bcoe/c8/commit/a27b694))
* remove the unmaintained mkdirp dependency ([#91](https://github.com/bcoe/c8/issues/91)) ([a465b65](https://github.com/bcoe/c8/commit/a465b65))



## [4.1.4](https://github.com/bcoe/c8/compare/v4.1.3...v4.1.4) (2019-05-03)


### Bug Fixes

* we were not exiting with 1 if mkdir failed ([#89](https://github.com/bcoe/c8/issues/89)) ([fb02ed6](https://github.com/bcoe/c8/commit/fb02ed6))
