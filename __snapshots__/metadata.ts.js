exports['metadata.yaml updateContent updates version in metadata.yaml 1'] = `
apiVersion: blueprints.cloud.google.com/v1alpha1
kind: BlueprintMetadata
metadata:
  name: foo
spec:
  info:
    title: bar
    version: 2.1.0

`
