# Conventional commits

This document describes how `release-please` extracts conventional commit(s) out of a given git commit message.

Read this guide to understand how you should structure your commits.

## General concepts

### Conventional commits format

`release-please` expects conventional commits to be structured according to the [conventional commits specification](https://www.conventionalcommits.org/en/v1.0.0/).

The general structure of a conventional commit is made of a mandatory header, followed by an optional body, then followed by optional footer(s), as follows:

```txt
<type>([optional scope])[!]: <description>

[optional body]

[optional footer(s)]
```

### Examples

An exhaustive list of examples is given on [conventional commits specification](https://www.conventionalcommits.org/en/v1.0.0/#examples).

When specifying a body and/or footer(s), the separating blank line before the body and/or footer(s) is optional. So that this conventional commit:

```txt
fix: prevent racing of requests

Introduce a request id and a reference to latest request.
Dismiss incoming responses other than from latest request.

Reviewed-by: Z
Refs: #123
```

can also be written as:

```txt
fix: prevent racing of requests
Introduce a request id and a reference to latest request.
Dismiss incoming responses other than from latest request.
Reviewed-by: Z
Refs: #123
```

or as:

```txt
fix: prevent racing of requests

Introduce a request id and a reference to latest request.
Dismiss incoming responses other than from latest request.
Reviewed-by: Z
Refs: #123
```

or as:

```txt
fix: prevent racing of requests
Introduce a request id and a reference to latest request.
Dismiss incoming responses other than from latest request.

Reviewed-by: Z
Refs: #123
```

## Multiple conventional commits

Release Please is able to extract one or multiple conventional commits, out of a single git commit message.

The different ways to structure multiple conventional commits within a single git commit message are described in the sections below.

### Using empty-line separators

Within a git commmit message, you can **declare multiple individual conventional commits by using empty line(s) to separate them**.

Each individual conventional commit should be structured according to what is described above in the general concepts.

For example, this git commit message:

```txt
fix: prevent racing of requests

Introduce a request id and a reference to latest request.
Dismiss incoming responses other than from latest request.

feat: add secondary phone to user profile

Allow to set a secondary phone number.

feat: add 2FA authentication

Implement 2FA authentication.
Give the option to switch 2FA on/off.
```

... will lead to 3 conventional commits extracted by Release Please:

- The first one starting with header `fix: prevent racing of requests`:
   ```txt
   fix: prevent racing of requests

   Introduce a request id and a reference to latest request.
   Dismiss incoming responses other than from latest request.
   ```

- The second one starting with header `feat: add secondary phone to user profile` (this header is preceded by an empty line, so it is considered as the start of a new conventional commit):
   ```txt
   feat: add secondary phone to user profile

   Allow to set a secondary phone number.
   ```

- The third one starting with header `feat: add 2FA authentication` (this header is preceded by an empty line, so it is considered as the start of a new conventional commit):
   ```txt
   feat: add 2FA authentication

   Implement 2FA authentication.
   Give the option to switch 2FA on/off.
   ```

Note that when declaring multiple conventional commits as such, it might bring more clarity to remove the optional blank lines within each conventional commit themselves. In the example above, you will indeed probably find the initial commit to be clearer if written like so:

```txt
fix: prevent racing of requests
Introduce a request id and a reference to latest request.
Dismiss incoming responses other than from latest request.

feat: add secondary phone to user profile
Allow to set a secondary phone number.

feat: add 2FA authentication
Implement 2FA authentication.
Give the option to switch 2FA on/off.
```

The result of Release Please parsing this commit message being the same as before (3 conventional commit extracted with headers `fix: prevent racing of requests`, `feat: add secondary phone to user profile`, and `feat: add 2FA authentication` respectively).

### Using `BEGIN_NESTED_COMMIT/END_NESTED_COMMIT` blocks

Within a git commmit message, you can use `BEGIN_NESTED_COMMIT/END_NESTED_COMMIT` blocks: Release Please will consider each block content as the equivalent of an independent incoming git commit message.

A `BEGIN_NESTED_COMMIT/END_NESTED_COMMIT` block being considered as the equivalent of an independent incoming git commit message, it can itself contain one or many conventional commits declarations.

For example, this git commit message:

```txt
fix: prevent racing of requests
Introduce a request id and a reference to latest request.
Dismiss incoming responses other than from latest request.
BEGIN_NESTED_COMMIT
feat: add secondary phone to user profile
Allow to set a secondary phone number.
END_NESTED_COMMIT
BEGIN_NESTED_COMMIT
feat: add 2FA authentication
Implement 2FA authentication.
Give the option to switch 2FA on/off.

feat: add internationalization features
END_NESTED_COMMIT
```

... will lead to the equivalent of 3 incoming git commit messages considered by Release Please:

- One corresponding to the initial git commit with all the `BEGIN_NESTED_COMMIT/END_NESTED_COMMIT` blocks removed:
   ```txt
   fix: prevent racing of requests
   Introduce a request id and a reference to latest request.
   Dismiss incoming responses other than from latest request.
   ```
   which will itself lead to 1 conventional commit extracted (with header `fix: prevent racing of requests`).

- One corresponding to the content of the first `BEGIN_NESTED_COMMIT/END_NESTED_COMMIT` block:
   ```txt
   feat: add secondary phone to user profile
   Allow to set a secondary phone number.
   ```
   which will lead itself to 1 conventional commit extracted (with header `feat: add secondary phone to user profile`).

- One corresponding to the content of the second `BEGIN_NESTED_COMMIT/END_NESTED_COMMIT` block:
   ```txt
   feat: add 2FA authentication
   Implement 2FA authentication.
   Give the option to switch 2FA on/off.

   feat: add internationalization features
   ```
   which will itself lead to 2 conventional commits extracted (with headers `feat: add 2FA authentication` and `feat: add internationalization features`, respectively).

### Using conventional commit footers

Considering the following git commit message:
```txt
feat: redesign dashboard UI
fix: correct spelling errors on dashboard UI
fix: unify warning color on dashboard UI
```

Following [conventional commits specification](https://www.conventionalcommits.org/en/v1.0.0/#examples), this defines one and only one conventional commit `feat: redesign dashboard UI`. Both lines below, starting with `fix: ...`, are footers of this conventional commit, and not conventional commits by themselves.

Release please extends this behavior and extracts conventional commits from footers. In the example above, Release Please would thus extract 3 conventional commits:
   - The *main* conventional commit:
      ```txt
      feat: redesign dashboard UI
      ```
   - The first footer, which is extracted as a conventional commit itself:
      ```txt
      fix: correct spelling errors on dashboard UI
      ```
   - The second footer, which is extracted as a conventional commit itself:
      ```txt
      fix: unify warning color on dashboard UI
      ```

When using footers to declare conventional commits, you can add a body and footers to those conventional commits themselves, by indenting their content (using spaces or tabs) as such:
```txt
feat: redesign dashboard UI
fix: correct spelling errors on dashboard UI
   This corrects some headers wrongly spelled.
   BREAKING CHANGE: this breaks something
   Refs: #123
fix: unify warning color on dashboard UI
   This uses orange as the only warning color.
   BREAKING CHANGE: this breaks another thing
   Refs: #456
```

In this example, Release Please would extract 3 conventional commits:
   - The *main* conventional commit:
      ```txt
      feat: redesign dashboard UI
      ```
   - The first footer, which is extracted as a conventional commit itself, with its specific body and footers:
      ```txt
      fix: correct spelling errors on dashboard UI
      This corrects some headers wrongly spelled.
      BREAKING CHANGE: this breaks something
      Refs: #123
      ```
   - The second footer, which is extracted as a conventional commit itself, with its specific body and footers:
      ```txt
      fix: unify warning color on dashboard UI
      This uses orange as the only warning color.
      BREAKING CHANGE: this breaks another thing
      Refs: #456
      ```

Beware that if you want to add a body and footers to the main conventional commit in the example above, you want to do it as such (aka without indentations; those identations must only be used for conventional commits defined using footers):
```txt
feat: redesign dashboard UI
This is a complete redesign of the dashboard according to the new design system.
BREAKING CHANGE: this breaks something
Refs: #789
fix: correct spelling errors on dashboard UI
   This corrects some headers wrongly spelled.
   BREAKING CHANGE: this breaks something
   Refs: #123
fix: unify warning color on dashboard UI
   This uses orange as the only warning color.
   BREAKING CHANGE: this breaks another thing
   Refs: #456
```

In this example, Release Please would extract 3 conventional commits:
   - The *main* conventional commit, with its specific body and footers:
      ```txt
      feat: redesign dashboard UI
      This is a complete redesign of the dashboard according to the new design system.
      BREAKING CHANGE: this breaks something
      Refs: #789
      ```
   - The first footer, which is extracted as a conventional commit itself, with its specific body and footers:
      ```txt
      fix: correct spelling errors on dashboard UI
      This corrects some headers wrongly spelled.
      BREAKING CHANGE: this breaks something
      Refs: #123
      ```
   - The second footer, which is extracted as a conventional commit itself, with its specific body and footers:
      ```txt
      fix: unify warning color on dashboard UI
      This uses orange as the only warning color.
      BREAKING CHANGE: this breaks another thing
      Refs: #456
      ```

Note that when you use empty-line separators to declare your conventional commits, Release Please will parse them independently, and you should not indent their body and footers. The commit above would lead to the exact same conventional commits extracted, if written as such:
```txt
feat: redesign dashboard UI
This is a complete redesign of the dashboard according to the new design system.
BREAKING CHANGE: this breaks something
Refs: #789

fix: correct spelling errors on dashboard UI
This corrects some headers wrongly spelled.
BREAKING CHANGE: this breaks something
Refs: #123

fix: unify warning color on dashboard UI
This uses orange as the only warning color.
BREAKING CHANGE: this breaks another thing
Refs: #456
```

... but writting it down in the following form is wrong (aka you should not indent the content of each independent conventional commit):
```txt
feat: redesign dashboard UI
   This is a complete redesign of the dashboard according to the new design system.
   BREAKING CHANGE: this breaks something
   Refs: #789

fix: correct spelling errors on dashboard UI
   This corrects some headers wrongly spelled.
   BREAKING CHANGE: this breaks something
   Refs: #123

fix: unify warning color on dashboard UI
   This uses orange as the only warning color.
   BREAKING CHANGE: this breaks another thing
   Refs: #456
```

### Best practices

Structuring multiple conventional commits using empty-line separators is generally the preferred and recommended way.

Consider this git commit written as such, using empty-line separators:

```txt
feat: redesign dashboard UI
This is a complete redesign of the dashboard according to the new design system.
BREAKING CHANGE: this breaks something
Refs: #789

fix: correct spelling errors on dashboard UI
This corrects some headers wrongly spelled.
BREAKING CHANGE: this breaks something
Refs: #123

fix: unify warning color on dashboard UI
This uses orange as the only warning color.
BREAKING CHANGE: this breaks another thing
Refs: #456
```

The same git commit can also be written using BEGIN_NESTED_COMMIT/END_NESTED_COMMIT blocks:

```txt
feat: redesign dashboard UI
This is a complete redesign of the dashboard according to the new design system.
BREAKING CHANGE: this breaks something
Refs: #789
BEGIN_NESTED_COMMIT
fix: correct spelling errors on dashboard UI
This corrects some headers wrongly spelled.
BREAKING CHANGE: this breaks something
Refs: #123
END_NESTED_COMMIT
BEGIN_NESTED_COMMIT
fix: unify warning color on dashboard UI
This uses orange as the only warning color.
BREAKING CHANGE: this breaks another thing
Refs: #456
END_NESTED_COMMIT
```

It can also be written using conventional commit footers:

```txt
feat: redesign dashboard UI
This is a complete redesign of the dashboard according to the new design system.
BREAKING CHANGE: this breaks something
Refs: #789
fix: correct spelling errors on dashboard UI
   This corrects some headers wrongly spelled.
   BREAKING CHANGE: this breaks something
   Refs: #123
fix: unify warning color on dashboard UI
   This uses orange as the only warning color.
   BREAKING CHANGE: this breaks another thing
   Refs: #456
```

Using empty-line separators is generally the cleanest way to structure multiple conventional commits: when reading out the given git commit message, it usually introduces less cognitive overload compared to the other forms.

The form using conventional commit footers can be interesting when you want to use a compact style, by writing multiple short header-only conventional commits, and you don't want (or you forget) to introduce empty-lines separators in-between them, as such:
```txt
feat: redesign dashboard UI
fix: correct spelling errors on dashboard UI
fix: unify warning color on dashboard UI
```

### Parsing order

When parsing conventional commits from an incoming git commit message, Release Please follows the following logic, in this specific order:

- It first splits the incoming git commit message into multiple git commit messages, according to the nested commits declared [using BEGIN_NESTED_COMMIT/END_NESTED_COMMIT blocks](#using-begin_nested_commitend_nested_commit-blocks).

- Then, within each considered incoming git commit message, it splits conventional commits that are declared [using empty-line separators](#using-empty-line-separators) (aka each new conventional commit header that follows an empty line, is considered the start of a new conventional commit).

- Third, within each conventional commit extracted, it extracts additional ones that are eventually defined [using footers](#using-conventional-commit-footers).

## Configuring Release Please

Release Please extracts conventional commits as per the list of types defined in the `changelog-sections` entry of your configuration file.

By default (aka if you don't specify any `changelog-sections` entry in your config), `changelog-sections` is automatically set as below:
```json
{
   ...
   "changelog-sections": [
      { "type": "feat", "section": "Features" },
      { "type": "feature", "section": "Features" },
      { "type": "fix", "section": "Bug Fixes" },
      { "type": "perf", "section": "Performance Improvements" },
      { "type": "revert", "section": "Reverts" },
      { "type": "docs", "section": "Documentation", "hidden": true },
      { "type": "style", "section": "Styles", "hidden": true },
      { "type": "chore", "section": "Miscellaneous Chores", "hidden": true },
      { "type": "refactor", "section": "Code Refactoring", "hidden": true },
      { "type": "test", "section": "Tests", "hidden": true },
      { "type": "build", "section": "Build System", "hidden": true },
      { "type": "ci", "section": "Continuous Integration", "hidden": true }
   ],
   ...
}
```

This means that, by default, Release Please will extract conventional commit of type `feat`, `feature`, `fix`, `perf`, `revert`, `docs`, `style`, `chore`, `refactor`, `test`, `build`, or `ci`.

Hence using this default behavior, the following git commit:
```txt
feat: redesign dashboard UI

docs: document new dashboard design

meta: a conventional commit with a custom type !
```

... will lead to 2 conventional commits extracted by Release Please: `feat: redesign dashboard UI` and `docs: document new dashboard design`. The line `meta: ...` will not lead to a conventionanl commit being extracted, because by default `meta` is not defined as a conventional commit type in the Release Please configuration.

For the line `meta: ...` to be extracted as a conventional commit, you would need to add the custom `meta` type in the Release Please configuration, by setting the `changelog-sections` entry as such:
```json
{
   ...
   "changelog-sections": [
      { "type": "feat", "section": "Features" },
      { "type": "feature", "section": "Features" },
      { "type": "fix", "section": "Bug Fixes" },
      { "type": "perf", "section": "Performance Improvements" },
      { "type": "revert", "section": "Reverts" },
      { "type": "docs", "section": "Documentation", "hidden": true },
      { "type": "style", "section": "Styles", "hidden": true },
      { "type": "chore", "section": "Miscellaneous Chores", "hidden": true },
      { "type": "refactor", "section": "Code Refactoring", "hidden": true },
      { "type": "test", "section": "Tests", "hidden": true },
      { "type": "build", "section": "Build System", "hidden": true },
      { "type": "ci", "section": "Continuous Integration", "hidden": true },
      { "type": "meta", "section": "meta" }
   ],
   ...
}
```

Note that as far the extraction process is concerned, as long as a type is defined in the `changelog-sections` entry, all conventional commits of that type will be extracted by Release Please from the incoming git commit messages. Whether you specify `"hidden": true` or `"hidden": false` does not matter at this point (this only matters at the time of rendering or not the entry in the changelog).
