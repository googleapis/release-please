exports['VersionManifest updateContent updates versions.txt with an artifact id is another ones suffix with snapshot 1'] = `
# Format:
# module:released-version:current-version

google-cloud-admin:2.3.4:2.3.4
admin:3.4.5:3.4.5
`

exports['VersionManifest updateContent updates versions.txt with an artifact id is another ones suffix without snapshot 1'] = `
# Format:
# module:released-version:current-version

google-cloud-admin:2.3.6:2.3.6
admin:3.4.3:3.4.3
`

exports['VersionManifest updateContent updates versions.txt with snapshot released version 1'] = `
# Format:
# module:released-version:current-version

google-cloud-trace:0.109.0:0.109.0
grpc-google-cloud-trace-v1:0.74.0:0.74.0
grpc-google-cloud-trace-v2:0.73.1-SNAPSHOT:0.73.1-SNAPSHOT
proto-google-cloud-trace-v1:0.73.1-SNAPSHOT:0.73.1-SNAPSHOT
proto-google-cloud-trace-v2:0.73.1-SNAPSHOT:0.73.1-SNAPSHOT
`
