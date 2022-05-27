exports['GenericYaml updateContent updates deep entry in json 1'] = `
name: release-please
version: 11.1.0
lockfileVersion: 2
requires: true
packages:
  '':
    name: release-please
    version: 2.3.4

`

exports['GenericYaml updateContent updates deep entry in yaml 1'] = `
name: helm-test-repo
version: 1.0.0
apiVersion: v2
appVersion: 2.0.0
dependencies:
  - name: another-repo
    version: 2.3.4
    repository: linkToHelmChartRepo
maintainers:
  - Abhinav Khanna

`

exports['GenericYaml updateContent updates matching entry 1'] = `
name: helm-test-repo
version: 2.3.4
apiVersion: v2
appVersion: 2.0.0
dependencies:
  - name: another-repo
    version: 0.15.3
    repository: linkToHelmChartRepo
maintainers:
  - Abhinav Khanna

`

exports['GenericYaml updateContent updates multi-document yaml 1'] = `
---
name: first
version: 2.3.4
---
name: second
version: 2.3.4
---
name: third
version: 2.3.4

`
