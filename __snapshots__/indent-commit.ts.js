exports['indentCommit handles carriage return 1'] = `
feat: my awesome commit message
  * testing one line
  * testing second line
`

exports['indentCommit handles multiple lines of multi-line text 1'] = `
feat: my awesome commit message
  * testing one line
    this is a second line of text
    this is a third line
  * testing second line
    this is a second line
`

exports['indentCommit only adds lines prefixed with * to CHANGELOG 1'] = `
feat: my awesome commit message
  * testing one line
  * testing second line
`
