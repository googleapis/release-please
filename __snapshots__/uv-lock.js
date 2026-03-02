exports['UvLock updateContent updates the package version while preserving formatting 1'] = `
version = 1
revision = 3
requires-python = ">=3.11"

[[package]]
name = "aiohappyeyeballs"
version = "2.6.1"
source = { registry = "https://pypi.org/simple" }
sdist = { url = "https://files.pythonhosted.org/packages/26/30/aiohappyeyeballs-2.6.1.tar.gz", hash = "sha256:c3f9d0113123803ccadfdf3f0faa505bc78e6a72d1cc4806cbd719826e943558", size = 22760 }
wheels = [
    { url = "https://files.pythonhosted.org/packages/0f/15/aiohappyeyeballs-2.6.1-py3-none-any.whl", hash = "sha256:f349ba8f4b75cb25c99c5c2d84e997e485204d2902a9597802b0371f09331fb8", size = 15265 },
]

[[package]]
name = "aiohttp"
version = "3.13.3"
source = { registry = "https://pypi.org/simple" }
dependencies = [
    { name = "aiohappyeyeballs" },
]
sdist = { url = "https://files.pythonhosted.org/packages/50/42/aiohttp-3.13.3.tar.gz", hash = "sha256:a949eee43d3782f2daae4f4a2819b2cb9b0c5d3b7f7a927067cc84dafdbb9f88", size = 7844556 }
wheels = [
    { url = "https://files.pythonhosted.org/packages/f1/4c/aiohttp-3.13.3-cp311-cp311-macosx_10_9_universal2.whl", hash = "sha256:5b6073099fb654e0a068ae678b10feff95c5cae95bbfcbfa7af669d361a8aa6b", size = 746051 },
]

[[package]]
name = "virtual-workspace-member"
source = { virtual = "." }

[[package]]
name = "socketry"
version = "0.3.0"
source = { editable = "." }
dependencies = [
    { name = "aiohttp" },
]

[package.dev-dependencies]
dev = [
    { name = "pytest" },
]

[package.metadata]
requires-dist = [
    { name = "aiohttp", specifier = ">=3.9" },
]

[package.metadata.requires-dev]
dev = [
    { name = "pytest", specifier = ">=9.0.2" },
]

`
