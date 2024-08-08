exports['PHPComposer updateContent does not update a version when version is the same 1'] = `
{"version":"1.0.0","replace":{"my/package":"1.0.0"}}
`

exports['PHPComposer updateContent update all versions in composer.json 1'] = `
{"version":"1.0.0","replace":{"my/package":"1.0.0"}}
`

exports['PHPComposer updateContent update replace package in composer.json when package is missing 1'] = `
{"replace":{"my/package":"1.0.0"}}
`

exports['PHPComposer updateContent update replace package in composer.json when package is set in version map 1'] = `
{"replace":{"my/package":"1.0.0"}}
`

exports['PHPComposer updateContent update root version in composer.json 1'] = `
{"version":"1.0.0"}
`
