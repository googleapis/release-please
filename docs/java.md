# Java and Maven Strategies

This strategy generates SNAPSHOT versions after each release. Snapshot is created as a separate "release" Pull Request, which updates all affected files, but does not create an actual release or tag.

Snapshot bumps have `autorelease: snapshot` label.

## `java` Strategy

General-purpose Java strategy, that does not update any files on its own.

Uses `extra-files` to bump versions in actual files. For a typical Maven project, use the `maven` strategy instead. 

## `maven` Strategy

Updates all found `pom.xml` files (recursively) using `pom` updater.

## `pom` Updater

Updates `/project/version` to the current version automatically.

If the version is not set, it tries to update `/project/parent/version`, assuming it is a submodule which inherits the version from its parent and should be bumped too. 
If this behavior is not intended, use the `generic` or `xml` updater via `extra-files`.
