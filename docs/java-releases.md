# Java Yoshi Release Strategies

The Java release strategies that are currently implemented are tailored towards
Google Cloud's Java client libraries team.

To manage versions, we maintain a `versions.txt` manifest which keeps track of
artifact versions. To mark versions in code which need to be replaced, we use
special markup to replace versions.

### Inline Annotation

You can add an inline annotation to the end of the line which you want a semver
version to be replaced. Add `x-version-update:<artifact-name>:current` or
`x-version-update:<artifact-name>:released` in a comment at the end of the line.

The `current` version is the current version at HEAD while the `released` version
is the latest released version in this branch.

### Block Annotation

You can add block annotation to the end of the line which you want a semver
version to be replaced. Surround the line(s) of code to be replaced with
`{x-version-start:<artifact-name>:<current|released>}` and `{x-version-end}`.

The `current` version is the current version at HEAD while the `released` version
is the latest released version in this branch.

## Java Bom

Bill of Materials (BOM) artifacts are special `pom.xml` projects that only declare
compatible dependency versions. In this strategy, we look at each `deps:` commit
and infer the type for dependency bump. The semantic version bump of the dependency
update should reflect the proposed version bump of the BOM artifact.

For example, a major version bump in a dependency should bump the BOM artifact's
version with an associated major version bump.

## Java LTS

This is a special case versioning strategy where we adopt a custom versioning scheme
and is meant to be used against an LTS branch. Consider an LTS branch cut from the
mainline at version `1.2.3`. The next version proposed will be `1.2.3-sp.1`, followed
by `1.2.3-lts.2`.

For LTS releases, we use a special "lts-snapshot" bump which will make the version
following `1.2.3-sp.1` be `1.2.3-sp.2-SNAPSHOT`.
