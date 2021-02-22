exports['Helm run creates a release PR: changes'] = `

filename: CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/abhinav-demo/helm-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/abhinav-demo/helm-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/abhinav-demo/helm-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

filename: Chart.yaml
name: helm-test-repo
version: 0.123.5
apiVersion: v2
appVersion: 2.0.0
dependencies:
  - name: another-repo
    version: 0.15.3
    repository: linkToHelmChartRepo
maintainers:
  - Abhinav Khanna

`

exports['Helm run creates a release PR: options'] = `

upstreamOwner: abhinav-demo
upstreamRepo: helm-test-repo
title: chore: release 0.123.5
branch: release-v0.123.5
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.123.5](https://www.github.com/abhinav-demo/helm-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/abhinav-demo/helm-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/abhinav-demo/helm-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 0.123.5
`
