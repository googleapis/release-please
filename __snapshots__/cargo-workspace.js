exports['CargoWorkspaceDependencyUpdates run handles a simple chain where root pkg update cascades to dependents changes'] = `
====================
{
  "config": {
    "releaseType": "rust",
    "packageName": "pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/Cargo.toml

        [package]
        name = "pkgA"
        version = "1.1.2"
        
====================
{
  "config": {
    "releaseType": "python",
    "path": "py/pkg"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: py/pkg/setup.py
some python version content
====================
{
  "config": {
    "releaseType": "rust",
    "packageName": "pkgB",
    "path": "packages/pkgB"
  },
  "prData": {
    "changes": {},
    "version": "2.2.3"
  }
}

filename: packages/pkgB/Cargo.toml

        [package]
        name = "pkgB"
        version = "2.2.3"

        [dependencies]
        pkgA = { version = "1.1.2", path = "../pkgA" }
        tracing = "1.0.0"
        
====================
{
  "config": {
    "releaseType": "rust",
    "packageName": "pkgC",
    "path": "packages/pkgC"
  },
  "prData": {
    "changes": {},
    "version": "3.3.4"
  }
}

filename: packages/pkgC/Cargo.toml

        [package]
        name = "pkgC"
        version = "3.3.4"

        [dependencies]
        pkgB = { version = "2.2.3", path = "../pkgB" }
        rustls = "1.0.0"
        
====================
{
  "config": {
    "path": ".",
    "packageName": "cargo workspace",
    "releaseType": "rust"
  },
  "prData": {
    "changes": {},
    "version": "lockfile maintenance"
  }
}

filename: Cargo.lock

          # This file is automatically @generated by Cargo.
          # It is not intended for manual editing.
          [[package]]
          name = "pkgA"
          version = "1.1.2"
          dependencies = []

          [[package]]
          name = "pkgB"
          version = "2.2.3"
          dependencies = ["pkgA"]

          [[package]]
          name = "pkgC"
          version = "3.3.4"
          dependencies = ["pkgB"]
          

`

exports['CargoWorkspaceDependencyUpdates run handles a simple chain where root pkg update cascades to dependents logs'] = []

exports['CargoWorkspaceDependencyUpdates run handles a triangle: root and one leg updates bumps other leg changes'] = `
====================
{
  "config": {
    "releaseType": "rust",
    "packageName": "pkgA",
    "path": "packages/pkgA"
  },
  "prData": {
    "version": "1.1.2",
    "changes": {}
  }
}

filename: packages/pkgA/Cargo.toml

        [package]
        name = "pkgA"
        version = "1.1.2"
        
====================
{
  "config": {
    "releaseType": "rust",
    "packageName": "pkgB",
    "path": "packages/pkgB"
  },
  "prData": {
    "version": "0.3.0",
    "changes": {}
  }
}

filename: packages/pkgB/Cargo.toml

                [package]
                name = "pkgB"
                version = "0.3.0"

                [dependencies]
                # release-please does not update dependency versions
                pkgA = { version = "1.1.2", path = "../pkgA" }
                someExternal = "9.2.3"
                
====================
{
  "config": {
    "releaseType": "rust",
    "packageName": "pkgC",
    "path": "packages/pkgC"
  },
  "prData": {
    "changes": {},
    "version": "3.3.4"
  }
}

filename: packages/pkgC/Cargo.toml

        [package]
        name = "pkgC"
        version = "3.3.4"

        [dependencies]
        pkgA = { version = "1.1.2", path = "../pkgA" }
        pkgB = { version = "0.3.0", path = "../pkgB" }

        [dependencies.anotherExternal]
        version = "4.3.1"
        
====================
{
  "config": {
    "path": ".",
    "packageName": "cargo workspace",
    "releaseType": "rust"
  },
  "prData": {
    "changes": {},
    "version": "lockfile maintenance"
  }
}

filename: Cargo.lock

          # This file is automatically @generated by Cargo.
          # It is not intended for manual editing.
          [[package]]
          name = "pkgA"
          version = "1.1.2"
          dependencies = []

          [[package]]
          name = "pkgB"
          version = "0.3.0"
          dependencies = []

          [[package]]
          name = "pkgC"
          version = "3.3.4"
          dependencies = ["pkgA", "pkgB", "anotherExternal"]
        

`

exports['CargoWorkspaceDependencyUpdates run handles a triangle: root and one leg updates bumps other leg logs'] = []
