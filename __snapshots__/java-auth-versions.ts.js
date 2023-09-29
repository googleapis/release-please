exports['JavaAuthVersions updateContent updates multiple versions in versions.txt 1'] = `
# Format:
# module:released-version:current-version

google-auth-library:0.25.0:0.25.0
google-auth-library-bom:0.16.2:0.16.2-99-SNAPSHOT
google-auth-library-parent:0.16.2:0.16.2-alpha-SNAPSHOT
google-auth-library-appengine:0.16.2:0.16.2
google-auth-library-credentials:0.16.2:0.16.2
google-auth-library-oauth2-http:0.16.2:0.16.2-SNAPSHOT

`

exports['JavaAuthVersions updateContent updates versions.txt appropriately for SNAPSHOT release 1'] = `
# Format:
# module:released-version:current-version

google-auth-library:0.16.2:0.16.2-SNAPSHOT
google-auth-library-bom:0.16.2:0.16.2-99-SNAPSHOT
google-auth-library-parent:0.16.2:0.16.2-alpha-SNAPSHOT
google-auth-library-appengine:0.16.2:0.16.2
google-auth-library-credentials:0.16.2:0.16.2
google-auth-library-oauth2-http:0.16.2:0.16.2-SNAPSHOT

`

exports['JavaAuthVersions updateContent updates versions.txt appropriately for non-SNAPSHOT release 1'] = `
# Format:
# module:released-version:current-version

google-auth-library:0.25.0:0.25.0
google-auth-library-bom:0.16.2:0.16.2-99-SNAPSHOT
google-auth-library-parent:0.16.2:0.16.2-alpha-SNAPSHOT
google-auth-library-appengine:0.16.2:0.16.2
google-auth-library-credentials:0.16.2:0.16.2
google-auth-library-oauth2-http:0.16.2:0.16.2

`
