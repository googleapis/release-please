exports['Helm run creates a release PR 1'] = `

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
