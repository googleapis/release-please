# Calendar Versioning (CalVer)

Release Please supports [calendar-based versioning](https://calver.org) through the `calendar`
versioning strategy. This allows you to create versions based on dates combined with
optional semantic version segments.

## Configuration

To use calendar versioning, set the `versioning` option to `calendar` in your
release-please configuration:

```json
{
    "versioning": "calendar"
}
```

You can customize the CalVer scheme using the `calver-scheme` option:

```json
{
    "versioning": "calendar",
    "calver-scheme": "YYYY.0M.MICRO"
}
```

## Format Tokens

CalVer format strings are composed of tokens that represent date or semantic
segments.

### Date Segments

Date segments are automatically updated based on the current date when a release is
created.

| Token  | Description                                        | Example |
|--------|----------------------------------------------------|---------|
| `YYYY` | Full year                                          | 2024    |
| `YY`   | Short year without zero-padding (relative to 2000) | 24      |
| `0Y`   | Zero-padded short year (relative to 2000)          | 06, 24  |
| `MM`   | Month without zero-padding                         | 1, 12   |
| `0M`   | Zero-padded month                                  | 01, 12  |
| `WW`   | Week of year without zero-padding                  | 1, 52   |
| `0W`   | Zero-padded week of year                           | 01, 52  |
| `DD`   | Day without zero-padding                           | 1, 31   |
| `0D`   | Zero-padded day                                    | 01, 31  |

Week numbers are calculated such that January 1 is always in week 1, and weeks roll
over on Monday. This differs from ISO 8601 week numbering where January 1 may fall in
week 52/53 of the previous year.

### Semantic Segments

Semantic segments work like traditional semver and are incremented based on commit
types.

| Token   | Description                | Bumped By        |
|---------|----------------------------|------------------|
| `MAJOR` | Major version number       | Breaking changes |
| `MINOR` | Minor version number       | Features         |
| `MICRO` | Micro/patch version number | Bug fixes        |

## Default Format

The default format is `YYYY.0M.0D`, which produces versions like `2024.01.15`.

## Example Formats

| Format             | Example Version | Description                      |
|--------------------|-----------------|----------------------------------|
| `YYYY.0M.0D`       | `2024.01.15`    | Full date-based version          |
| `YY.MM.MICRO`      | `24.1.3`        | Year, month, and patch counter   |
| `YYYY.MINOR.MICRO` | `2024.2.1`      | Year with semantic minor/patch   |
| `YY.0M.0D`         | `24.01.15`      | Short year with zero-padded date |
| `YYYY.0M.MICRO`    | `2024.06.0`     | Year, month, and patch counter   |

## Behavior

### Date Changes

When the date changes (based on the format tokens), semantic segments (`MAJOR`,
`MINOR`, `MICRO`) are reset to 0. For example:

- Current version: `2024.01.5` (format: `YYYY.0M.MICRO`)
- Date changes to February
- Next version: `2024.02.0` (MICRO resets to 0)

### Semantic Bumping

When the date has not changed, semantic segments are bumped based on conventional
commits:

- **Breaking changes** bump `MAJOR` (or `MINOR` if no `MAJOR` in format)
- **Features** bump `MINOR` (or `MICRO` if no `MINOR` in format)
- **Bug fixes** bump `MICRO`

When a higher segment is bumped, lower segments reset to 0:

- Current version: `2024.2.5` (format: `YYYY.MINOR.MICRO`)
- Feature commit added
- Next version: `2024.3.0` (MINOR bumped, MICRO reset)

### Release-As

You can force a specific version using the `Release-As` footer in commit messages:

```
feat: add new feature

Release-As: 2024.06.0
```

## Multiple Releases Per Day

If you release multiple times on the same day using a pure date format like
`YYYY.0M.0D`, each release will have the same version number (which may cause
issues). To support multiple releases per day, include a semantic segment:

```json
{
    "versioning": "calendar",
    "calver-scheme": "YYYY.0M.0D.MICRO"
}
```

This produces versions like `2024.01.15.0`, `2024.01.15.1`, etc.

## Four-Segment Versions

CalVer supports formats with four segments, such as `YY.MM.MINOR.MICRO` which might
produce versions like `24.6.5.123`. However, there's an important limitation to be
aware of:

**Version Object Mapping**: Internally, Release Please uses a `Version` object that
only has three semantic fields: `major`, `minor`, and `patch`. When using four-segment
formats:

- The first three segments map to `major.minor.patch`
- The fourth segment is preserved only in the string representation
- The fourth segment is not accessible via the Version object's properties

This limitation doesn't affect version bumping or comparison, but it's important to
understand if you're programmatically accessing version properties.

