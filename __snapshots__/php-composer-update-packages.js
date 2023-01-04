exports['PHPComposer updateContent does not update a version when version is the same 1'] = `
{"version":"1.0.0","replace":{"version":"1.0.0"}}
`

exports['PHPComposer updateContent update all versions in composer.json 1'] = `
{"version":"1.0.0","replace":{"version":"1.0.0"}}
`

exports['PHPComposer updateContent update replace version in composer.json when version is missing 1'] = `
{"replace":{"version":"1.0.0"}}
`

exports['PHPComposer updateContent update replace version in composer.json when version is present 1'] = `
{"replace":{"version":"1.0.0"}}
`

exports['PHPComposer updateContent update root version in composer.json 1'] = `
{"version":"1.0.0"}
`
