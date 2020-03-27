exports['indentCommit handles carriage return 1'] = `
feat: my awesome commit message
  * testing one line
  * testing second line
`;

exports['indentCommit only adds lines prefixed with * to CHANGELOG 1'] = `
feat: my awesome commit message
  * testing one line
  * testing second line
`;
