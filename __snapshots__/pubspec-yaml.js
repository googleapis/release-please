exports['PubspecYaml updateContent updates version in pubspec.yaml file 1'] = `
name: hello_world
description: Hello World
publish_to: 'none' # Remove this line if you wish to publish to pub.dev

version: 0.5.0

environment:
  sdk: '>=2.12.0 <3.0.0'

`

exports['PubspecYaml updateContent updates version with build number in pubspec.yaml file 1'] = `
name: hello_world
description: Hello World
publish_to: 'none' # Remove this line if you wish to publish to pub.dev

version: 0.5.0+12

environment:
  sdk: '>=2.12.0 <3.0.0'

`
