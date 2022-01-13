exports['RubyYoshi buildReleasePullRequest returns release PR changes with semver patch bump 1'] = `
:robot: I have created a release *beep* *boop*
---


### [0.123.5]() / 1983-10-10

#### Bug Fixes

* update dependency com.google.cloud:google-cloud-spanner to v1.50.0
* update dependency com.google.cloud:google-cloud-storage to v1.120.0

---

### Commits since last release:

* [fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0](https://github.com/googleapis/ruby-test-repo/commit/845db1381b3d5d20151cad2588f85feb)
* [fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0](https://github.com/googleapis/ruby-test-repo/commit/08ca01180a91c0a1ba8992b491db9212)
* [chore: update common templates](https://github.com/googleapis/ruby-test-repo/commit/7fb2ced60e3096b048ee38caa410c05c)

### Files edited since last release:

<pre><code>path1/foo.rb
path2/bar.rb
</code></pre>
[Compare Changes](https://github.com/googleapis/ruby-test-repo/compare/abc123...HEAD)


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
