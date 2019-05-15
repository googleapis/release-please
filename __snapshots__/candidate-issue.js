exports['CandidateIssue bodySansFooter returns the body with the footer removed 1'] = `
_:robot: Here's what the next release of **@foo/bar** would look like._

---

Features:
* deps: upgrade foo



`

exports['CandidateIssue bodyTemplate generates body for issue 1'] = `
_:robot: Here's what the next release of **@foo/bar** would look like._

---

Features:
* deps: upgrade foo


----------------

* [ ] **Should I create this release for you :robot:?**

`
