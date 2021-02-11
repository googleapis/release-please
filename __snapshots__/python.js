exports['Python run creates a release PR 1'] = `
[
  [
    "CHANGELOG.md",
    {
      "content": "# Changelog\\n\\n### [0.123.5](https://www.github.com/googleapis/py-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))\\n",
      "mode": "100644"
    }
  ],
  [
    "setup.cfg",
    {
      "content": "# Copyright 2020 Google LLC\\n#\\n# Licensed under the Apache License, Version 2.0 (the \\"License\\");\\n# you may not use this file except in compliance with the License.\\n# You may obtain a copy of the License at\\n#\\n#     https://www.apache.org/licenses/LICENSE-2.0\\n#\\n# Unless required by applicable law or agreed to in writing, software\\n# distributed under the License is distributed on an \\"AS IS\\" BASIS,\\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\\n# See the License for the specific language governing permissions and\\n# limitations under the License.\\n\\n[metadata]\\nname = google-crc32c\\nversion = 0.123.5\\ndescription = A python wrapper of the C library 'Google CRC32C'\\nurl = https://github.com/googleapis/python-crc32c\\nlong_description = file: README.md\\nlong_description_content_type = text/markdown\\nauthor = Google LLC\\nauthor_email = googleapis-packages@google.com\\n\\nlicense = Apache 2.0\\nplatforms = Posix, MacOS X, Windows\\nclassifiers =\\n    Development Status :: 4 - Beta\\n    Intended Audience :: Developers\\n    License :: OSI Approved :: Apache Software License\\n    Operating System :: OS Independent\\n    Programming Language :: Python :: 3\\n    Programming Language :: Python :: 3.5\\n    Programming Language :: Python :: 3.6\\n    Programming Language :: Python :: 3.7\\n    Programming Language :: Python :: 3.8\\n    \\n[options]\\nzip_safe = True\\npython_requires = >=3.5\\n\\n[options.extras_require]\\ntesting = pytest\\n\\n",
      "mode": "100644"
    }
  ],
  [
    "setup.py",
    {
      "content": "# Copyright 2018 Google LLC\\n#\\n# Licensed under the Apache License, Version 2.0 (the \\"License\\");\\n# you may not use this file except in compliance with the License.\\n# You may obtain a copy of the License at\\n#\\n#     https://www.apache.org/licenses/LICENSE-2.0\\n#\\n# Unless required by applicable law or agreed to in writing, software\\n# distributed under the License is distributed on an \\"AS IS\\" BASIS,\\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\\n# See the License for the specific language governing permissions and\\n# limitations under the License.\\n\\nimport io\\nimport os\\n\\nimport setuptools\\n\\nname = \\"google-cloud-automl\\"\\ndescription = \\"Cloud AutoML API client library\\"\\nversion = \\"0.123.5\\"\\nrelease_status = \\"Development Status :: 3 - Alpha\\"\\ndependencies = [\\n    \\"google-api-core[grpc] >= 1.14.0, < 2.0.0dev\\",\\n    'enum34; python_version < \\"3.4\\"',\\n]\\nextras = {\\n    \\"pandas\\": [\\"pandas>=0.24.0\\"],\\n    \\"storage\\": [\\"google-cloud-storage >= 1.18.0, < 2.0.0dev\\"],\\n}\\n\\npackage_root = os.path.abspath(os.path.dirname(__file__))\\n\\nreadme_filename = os.path.join(package_root, \\"README.rst\\")\\nwith io.open(readme_filename, encoding=\\"utf-8\\") as readme_file:\\n    readme = readme_file.read()\\n\\npackages = [\\n    package for package in setuptools.find_packages() if package.startswith(\\"google\\")\\n]\\n\\nnamespaces = [\\"google\\"]\\nif \\"google.cloud\\" in packages:\\n    namespaces.append(\\"google.cloud\\")\\n\\nsetuptools.setup(\\n    name=name,\\n    version=version,\\n    description=description,\\n    long_description=readme,\\n    author=\\"Google LLC\\",\\n    author_email=\\"googleapis-packages@oogle.com\\",\\n    license=\\"Apache 2.0\\",\\n    url=\\"https://github.com/GoogleCloudPlatform/google-cloud-python\\",\\n    classifiers=[\\n        release_status,\\n        \\"Intended Audience :: Developers\\",\\n        \\"License :: OSI Approved :: Apache Software License\\",\\n        \\"Programming Language :: Python\\",\\n        \\"Programming Language :: Python :: 2\\",\\n        \\"Programming Language :: Python :: 2.7\\",\\n        \\"Programming Language :: Python :: 3\\",\\n        \\"Programming Language :: Python :: 3.5\\",\\n        \\"Programming Language :: Python :: 3.6\\",\\n        \\"Programming Language :: Python :: 3.7\\",\\n        \\"Operating System :: OS Independent\\",\\n        \\"Topic :: Internet\\",\\n    ],\\n    platforms=\\"Posix; MacOS X; Windows\\",\\n    packages=packages,\\n    namespace_packages=namespaces,\\n    install_requires=dependencies,\\n    extras_require=extras,\\n    python_requires=\\">=2.7,!=3.0.*,!=3.1.*,!=3.2.*,!=3.3.*\\",\\n    include_package_data=True,\\n    zip_safe=False,\\n)",
      "mode": "100644"
    }
  ],
  [
    "src/version.py",
    {
      "content": "# Copyright 2020 Google LLC\\n#\\n# Licensed under the Apache License, Version 2.0 (the \\"License\\");\\n# you may not use this file except in compliance with the License.\\n# You may obtain a copy of the License at\\n#\\n#     https://www.apache.org/licenses/LICENSE-2.0\\n#\\n# Unless required by applicable law or agreed to in writing, software\\n# distributed under the License is distributed on an \\"AS IS\\" BASIS,\\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\\n# See the License for the specific language governing permissions and\\n# limitations under the License.\\n\\n__version__ = \\"0.123.5\\"\\n",
      "mode": "100644"
    }
  ]
]
`

exports['Python run creates a release PR relative to a path 1'] = `
[
  [
    "projects/python/CHANGELOG.md",
    {
      "content": "# Changelog\\n\\n### [0.123.5](https://www.github.com/googleapis/py-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))\\n",
      "mode": "100644"
    }
  ],
  [
    "projects/python/setup.cfg",
    {
      "content": "# Copyright 2020 Google LLC\\n#\\n# Licensed under the Apache License, Version 2.0 (the \\"License\\");\\n# you may not use this file except in compliance with the License.\\n# You may obtain a copy of the License at\\n#\\n#     https://www.apache.org/licenses/LICENSE-2.0\\n#\\n# Unless required by applicable law or agreed to in writing, software\\n# distributed under the License is distributed on an \\"AS IS\\" BASIS,\\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\\n# See the License for the specific language governing permissions and\\n# limitations under the License.\\n\\n[metadata]\\nname = google-crc32c\\nversion = 0.123.5\\ndescription = A python wrapper of the C library 'Google CRC32C'\\nurl = https://github.com/googleapis/python-crc32c\\nlong_description = file: README.md\\nlong_description_content_type = text/markdown\\nauthor = Google LLC\\nauthor_email = googleapis-packages@google.com\\n\\nlicense = Apache 2.0\\nplatforms = Posix, MacOS X, Windows\\nclassifiers =\\n    Development Status :: 4 - Beta\\n    Intended Audience :: Developers\\n    License :: OSI Approved :: Apache Software License\\n    Operating System :: OS Independent\\n    Programming Language :: Python :: 3\\n    Programming Language :: Python :: 3.5\\n    Programming Language :: Python :: 3.6\\n    Programming Language :: Python :: 3.7\\n    Programming Language :: Python :: 3.8\\n    \\n[options]\\nzip_safe = True\\npython_requires = >=3.5\\n\\n[options.extras_require]\\ntesting = pytest\\n\\n",
      "mode": "100644"
    }
  ],
  [
    "projects/python/setup.py",
    {
      "content": "# Copyright 2018 Google LLC\\n#\\n# Licensed under the Apache License, Version 2.0 (the \\"License\\");\\n# you may not use this file except in compliance with the License.\\n# You may obtain a copy of the License at\\n#\\n#     https://www.apache.org/licenses/LICENSE-2.0\\n#\\n# Unless required by applicable law or agreed to in writing, software\\n# distributed under the License is distributed on an \\"AS IS\\" BASIS,\\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\\n# See the License for the specific language governing permissions and\\n# limitations under the License.\\n\\nimport io\\nimport os\\n\\nimport setuptools\\n\\nname = \\"google-cloud-automl\\"\\ndescription = \\"Cloud AutoML API client library\\"\\nversion = \\"0.123.5\\"\\nrelease_status = \\"Development Status :: 3 - Alpha\\"\\ndependencies = [\\n    \\"google-api-core[grpc] >= 1.14.0, < 2.0.0dev\\",\\n    'enum34; python_version < \\"3.4\\"',\\n]\\nextras = {\\n    \\"pandas\\": [\\"pandas>=0.24.0\\"],\\n    \\"storage\\": [\\"google-cloud-storage >= 1.18.0, < 2.0.0dev\\"],\\n}\\n\\npackage_root = os.path.abspath(os.path.dirname(__file__))\\n\\nreadme_filename = os.path.join(package_root, \\"README.rst\\")\\nwith io.open(readme_filename, encoding=\\"utf-8\\") as readme_file:\\n    readme = readme_file.read()\\n\\npackages = [\\n    package for package in setuptools.find_packages() if package.startswith(\\"google\\")\\n]\\n\\nnamespaces = [\\"google\\"]\\nif \\"google.cloud\\" in packages:\\n    namespaces.append(\\"google.cloud\\")\\n\\nsetuptools.setup(\\n    name=name,\\n    version=version,\\n    description=description,\\n    long_description=readme,\\n    author=\\"Google LLC\\",\\n    author_email=\\"googleapis-packages@oogle.com\\",\\n    license=\\"Apache 2.0\\",\\n    url=\\"https://github.com/GoogleCloudPlatform/google-cloud-python\\",\\n    classifiers=[\\n        release_status,\\n        \\"Intended Audience :: Developers\\",\\n        \\"License :: OSI Approved :: Apache Software License\\",\\n        \\"Programming Language :: Python\\",\\n        \\"Programming Language :: Python :: 2\\",\\n        \\"Programming Language :: Python :: 2.7\\",\\n        \\"Programming Language :: Python :: 3\\",\\n        \\"Programming Language :: Python :: 3.5\\",\\n        \\"Programming Language :: Python :: 3.6\\",\\n        \\"Programming Language :: Python :: 3.7\\",\\n        \\"Operating System :: OS Independent\\",\\n        \\"Topic :: Internet\\",\\n    ],\\n    platforms=\\"Posix; MacOS X; Windows\\",\\n    packages=packages,\\n    namespace_packages=namespaces,\\n    install_requires=dependencies,\\n    extras_require=extras,\\n    python_requires=\\">=2.7,!=3.0.*,!=3.1.*,!=3.2.*,!=3.3.*\\",\\n    include_package_data=True,\\n    zip_safe=False,\\n)",
      "mode": "100644"
    }
  ],
  [
    "projects/python/src/version.py",
    {
      "content": "# Copyright 2020 Google LLC\\n#\\n# Licensed under the Apache License, Version 2.0 (the \\"License\\");\\n# you may not use this file except in compliance with the License.\\n# You may obtain a copy of the License at\\n#\\n#     https://www.apache.org/licenses/LICENSE-2.0\\n#\\n# Unless required by applicable law or agreed to in writing, software\\n# distributed under the License is distributed on an \\"AS IS\\" BASIS,\\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\\n# See the License for the specific language governing permissions and\\n# limitations under the License.\\n\\n__version__ = \\"0.123.5\\"\\n",
      "mode": "100644"
    }
  ]
]
`

exports['Python getOpenPROptions returns release PR changes with defaultInitialVersion 1'] = `
## 0.1.0 (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---

`

exports['Python getOpenPROptions returns release PR changes with semver patch bump 1'] = `
### [0.123.5](https://www.github.com/googleapis/py-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---

`
