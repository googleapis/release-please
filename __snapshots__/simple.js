exports['CHANGELOG-simple'] = `
# Changelog

### [0.123.5](https://www.github.com/googleapis/simple-test-repo/compare/v0.123.4...v0.123.5) 


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/simple-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/simple-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

`

exports['version-txt-simple'] = `
0.123.5

`

exports['PR body-simple'] = {
  'title': 'chore: release 0.123.5',
  'body': ':robot: I have created a release \\*beep\\* \\*boop\\* \n---\n### [0.123.5](https://www.github.com/googleapis/simple-test-repo/compare/v0.123.4...v0.123.5) \n\n\n### Bug Fixes\n\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/simple-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/simple-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))\n---\n\n\nThis PR was generated with [Release Please](https://github.com/googleapis/release-please).',
  'head': 'release-v0.123.5',
  'base': 'master'
}

exports['labels-simple'] = {
  'labels': [
    'autorelease: pending'
  ]
}

exports['CHANGELOG-simple-message'] = `
created CHANGELOG.md [ci skip]
`

exports['version-txt-simple-message'] = `
updated version.txt
`
