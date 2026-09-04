# Local Development Setup

This guide walks you through setting up the **release-please** repository for local development.

## Prerequisites

- **Node.js**: Version 22.0.0 or higher (see `package.json` `engines` field)
- **npm**: Comes with Node.js
- **Git**: For cloning and version control

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ashclay95/release-please.git
cd release-please
git checkout setup/local-development
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Runtime dependencies**: @octokit/rest, @conventional-commits/parser, conventional-changelog-writer, semver, yargs, etc.
- **Dev dependencies**: TypeScript, Mocha, c8 (coverage), gts (linter/formatter), @types/* packages

### 3. Compile TypeScript

```bash
npm run compile
```

- Runs `tsc -p .` (TypeScript compiler)
- Compiles source code from `src/` to `build/`
- Output includes JavaScript and source maps
- Uses configuration from `tsconfig.json` (extends `gts/tsconfig-google.json`)

### 4. Run Tests

```bash
npm test
```

- Executes Mocha test suite in `build/test/`
- Collects coverage with c8
- Environment variables: `ENVIRONMENT=test`, `LC_ALL=en`
- **Note**: `pretest` hook automatically compiles TypeScript first
- Timeout: 5000ms per test
- Snapshot testing enabled via `snap-shot-it`

### 5. Lint and Format Code

```bash
npm run lint        # Check code style (gts check)
npm run fix         # Auto-fix style issues (gts fix)
```

- Uses **gts** (Google TypeScript Style) for consistent code formatting
- Includes ESLint rules from `@eslint/js`
- Configuration: `.eslintrc.json`, `.prettierrc.js`

## Available npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `test` | `cross-env ENVIRONMENT=test LC_ALL=en c8 mocha --recursive --timeout=5000 build/test` | Run Mocha tests with coverage |
| `test:snap` | `cross-env SNAPSHOT_UPDATE=1 LC_ALL=en npm test` | Update test snapshots |
| `compile` | `tsc -p .` | Compile TypeScript to JavaScript |
| `lint` | `gts check` | Check code style |
| `fix` | `gts fix` | Auto-format code |
| `clean` | `gts clean` | Remove build artifacts |
| `prepare` | `npm run compile` | Pre-publication hook |

## Project Structure

```
src/
├── bin/release-please.ts       # CLI entry point with yargs router
├── github.ts                   # GitHub API client wrapper
├── manifest.ts                 # Multi-package release orchestration
├── updaters/                   # Language-specific file updaters
│   ├── node.ts                 # Updates package.json
│   ├── python.ts               # Updates setup.py, pyproject.toml
│   ├── java.ts                 # Updates pom.xml
│   └── ...
├── strategies/                 # Release type strategies
│   ├── node.ts
│   ├── go.ts
│   └── ...
├── changelog/                  # CHANGELOG generation logic
└── util/                       # Utilities (logger, coercion, etc.)

test/                           # Mocha test suite
build/                          # Compiled output (generated, not in git)
templates/                      # PR title/body templates
docs/                           # Documentation
  ├── cli.md                    # CLI usage guide
  ├── manifest-releaser.md      # Monorepo support
  └── ...
schemas/                        # JSON schema for config validation
```

## How to Contribute

### Making Changes

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes in `src/`
3. Compile and test: `npm run compile && npm test`
4. Fix any lint issues: `npm run fix`
5. Commit with Conventional Commits: `git commit -m "feat: description"`

### Testing Your Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test -- build/test/manifest.js

# Update snapshots (if tests have changed expected output)
npm test:snap
```

### Creating a Release PR

To test release-please itself:

```bash
node build/src/bin/release-please.js release-pr \
  --token=$GITHUB_TOKEN \
  --repo-url=ashclay95/release-please \
  --dry-run
```

This simulates creating a release PR without actually opening one on GitHub.

## Troubleshooting

### "Cannot find module" errors

```bash
npm run clean
npm install
npm run compile
```

### TypeScript compilation errors

Ensure you're using Node.js ≥22.0.0:

```bash
node --version
```

If not, use `nvm` (Node Version Manager) to switch:

```bash
nvm install 22
nvm use 22
```

### Test failures

Check that all dependencies are installed and TypeScript is compiled:

```bash
npm install
npm run compile
npm test
```

### Port/network issues when running CLI

If you're testing the CLI locally against GitHub, ensure:
- Your `GITHUB_TOKEN` is set and has `repo` scope
- You have network access to `api.github.com`
- Rate limits haven't been exceeded

## Next Steps

- **Read the CLI docs**: See `docs/cli.md` for command-line usage
- **Understand monorepos**: See `docs/manifest-releaser.md` for multi-package setups
- **View the design**: See `docs/design.md` for architecture details
- **Check troubleshooting**: See `docs/troubleshooting.md` for common issues

## Resources

- **Conventional Commits**: https://www.conventionalcommits.org/
- **Semantic Versioning**: https://semver.org/
- **GitHub API**: https://docs.github.com/en/rest
- **gts (Google TypeScript Style)**: https://github.com/google/gts
- **Mocha**: https://mochajs.org/
- **c8 Coverage**: https://github.com/bcoe/c8

Happy hacking! 🚀
