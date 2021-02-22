exports['ConventionalCommits generateChangelogEntry does not include content two newlines after BREAKING CHANGE 1'] = `
## v1.0.0 (1665-10-10)


### ⚠ BREAKING CHANGES

* we were on Node 6

### Features

* awesome feature ([abc678](https://www.github.com/bcoe/release-please/commit/abc678))


### Miscellaneous Chores

* upgrade to Node 7 ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))
`

exports['ConventionalCommits generateChangelogEntry includes multi-line breaking changes 1'] = `
## v1.0.0 (1665-10-10)


### ⚠ BREAKING CHANGES

* we were on Node 6 second line third line

### Features

* awesome feature ([abc678](https://www.github.com/bcoe/release-please/commit/abc678))


### Miscellaneous Chores

* upgrade to Node 7 ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))
`

exports['ConventionalCommits generateChangelogEntry parses additional commits in footers 1'] = `
## v1.0.0 (1665-10-10)


### ⚠ BREAKING CHANGES

* cool feature

### Features

* awesome feature ([abc678](https://www.github.com/bcoe/release-please/commit/abc678))
* cool feature ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))


### Bug Fixes

* **subsystem:** also a fix ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))
`

exports['ConventionalCommits generateChangelogEntry parses commits from footer, when body contains multiple paragraphs 1'] = `
## v1.0.0 (1665-10-10)


### ⚠ BREAKING CHANGES

* **recaptchaenterprise:** for some reason this migration is breaking.

### Features

* **recaptchaenterprise:** migrate microgenertor ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))


### Bug Fixes

* fixes bug [#733](https://www.github.com/bcoe/release-please/issues/733) ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))
* **securitycenter:** fixes security center. ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))
`

exports['ConventionalCommits generateChangelogEntry parses footer commits that contain footers 1'] = `
## v1.0.0 (1665-10-10)


### ⚠ BREAKING CHANGES

* **recaptchaenterprise:** for some reason this migration is breaking.

### Features

* awesome feature ([abc678](https://www.github.com/bcoe/release-please/commit/abc678))
* **recaptchaenterprise:** migrate microgenertor ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))


### Bug Fixes

* **securitycenter:** fixes security center. ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))
`

exports['ConventionalCommits generateChangelogEntry supports additional markdown for breaking change, if prefixed with fourth-level header 1'] = `
## v1.0.0 (1665-10-10)


### ⚠ BREAKING CHANGES

* we were on Node 6
    #### deleted APIs
    - deleted API

### Features

* awesome feature ([abc678](https://www.github.com/bcoe/release-please/commit/abc678))


### Miscellaneous Chores

* upgrade to Node 7 ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))
`

exports['ConventionalCommits generateChangelogEntry supports additional markdown for breaking change, if prefixed with list 1'] = `
## v1.0.0 (1665-10-10)


### ⚠ BREAKING CHANGES

* we were on Node 6
    - deleted API foo
    - deleted API bar

### Features

* awesome feature ([abc678](https://www.github.com/bcoe/release-please/commit/abc678))


### Miscellaneous Chores

* upgrade to Node 7 ([abc345](https://www.github.com/bcoe/release-please/commit/abc345))
`
