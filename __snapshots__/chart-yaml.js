exports['ChartYaml updateContent updates version in Chart.yaml 1'] = `
name: helm-test-repo
version: 1.1.0
apiVersion: v2
appVersion: 2.0.0
dependencies:
  - name: another-repo
    version: 0.15.3
    repository: linkToHelmChartRepo
maintainers:
  - Abhinav Khanna

`
