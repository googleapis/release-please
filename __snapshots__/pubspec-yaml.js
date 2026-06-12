exports['PubspecYaml updateContent updates version in ./pubspec.yaml 1'] = `
name: hello_world
description: Hello World
publish_to: 'none' # Remove this line if you wish to publish to pub.dev

version: 0.6.0

environment:
  sdk: '>=2.12.0 <3.0.0'

`

exports['PubspecYaml updateContent updates version in ./pubspec_with_build_no.yaml 1'] = `
name: hello_world
description: Hello World
publish_to: 'none' # Remove this line if you wish to publish to pub.dev

version: 0.6.0+13

environment:
  sdk: '>=2.12.0 <3.0.0'

`

exports['PubspecYaml updateContent updates version in ./pubspec_with_build_no_bad.yaml 1'] = `
name: hello_world
description: Hello World
publish_to: 'none' # Remove this line if you wish to publish to pub.dev

version: 0.6.0+abc

environment:
  sdk: '>=2.12.0 <3.0.0'

`

exports['PubspecYaml updateContent updates version in ./pubspec_with_prerelease.yaml 1'] = `
name: hello_world
description: Hello World
publish_to: 'none' # Remove this line if you wish to publish to pub.dev

version: 0.5.0-dev02

environment:
  sdk: '>=2.12.0 <3.0.0'

`

exports['PubspecYaml updateContent updates version in ./pubspec_with_prerelease_and_build_no.yaml 1'] = `
name: hello_world
description: Hello World
publish_to: 'none' # Remove this line if you wish to publish to pub.dev

version: 0.5.0-dev02+13

environment:
  sdk: '>=2.12.0 <3.0.0'

`

exports['PubspecYaml updateContent updates version in ./pubspec_with_prerelease_and_build_no_bad.yaml 1'] = `
name: hello_world
description: Hello World
publish_to: 'none' # Remove this line if you wish to publish to pub.dev

version: 0.5.0-dev02+abc

environment:
  sdk: '>=2.12.0 <3.0.0'

`
