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

exports['Python run creates a release PR relative to a path: changes'] = `

filename: projects/python/CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/googleapis/py-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))

filename: projects/python/setup.cfg
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

[metadata]
name = google-crc32c
version = 0.123.5
description = A python wrapper of the C library 'Google CRC32C'
url = https://github.com/googleapis/python-crc32c
long_description = file: README.md
long_description_content_type = text/markdown
author = Google LLC
author_email = googleapis-packages@google.com

license = Apache 2.0
platforms = Posix, MacOS X, Windows
classifiers =
    Development Status :: 4 - Beta
    Intended Audience :: Developers
    License :: OSI Approved :: Apache Software License
    Operating System :: OS Independent
    Programming Language :: Python :: 3
    Programming Language :: Python :: 3.5
    Programming Language :: Python :: 3.6
    Programming Language :: Python :: 3.7
    Programming Language :: Python :: 3.8
    
[options]
zip_safe = True
python_requires = >=3.5

[options.extras_require]
testing = pytest


filename: projects/python/setup.py
# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import io
import os

import setuptools

name = "google-cloud-automl"
description = "Cloud AutoML API client library"
version = "0.123.5"
release_status = "Development Status :: 3 - Alpha"
dependencies = [
    "google-api-core[grpc] >= 1.14.0, < 2.0.0dev",
    'enum34; python_version < "3.4"',
]
extras = {
    "pandas": ["pandas>=0.24.0"],
    "storage": ["google-cloud-storage >= 1.18.0, < 2.0.0dev"],
}

package_root = os.path.abspath(os.path.dirname(__file__))

readme_filename = os.path.join(package_root, "README.rst")
with io.open(readme_filename, encoding="utf-8") as readme_file:
    readme = readme_file.read()

packages = [
    package for package in setuptools.find_packages() if package.startswith("google")
]

namespaces = ["google"]
if "google.cloud" in packages:
    namespaces.append("google.cloud")

setuptools.setup(
    name=name,
    version=version,
    description=description,
    long_description=readme,
    author="Google LLC",
    author_email="googleapis-packages@oogle.com",
    license="Apache 2.0",
    url="https://github.com/GoogleCloudPlatform/google-cloud-python",
    classifiers=[
        release_status,
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Operating System :: OS Independent",
        "Topic :: Internet",
    ],
    platforms="Posix; MacOS X; Windows",
    packages=packages,
    namespace_packages=namespaces,
    install_requires=dependencies,
    extras_require=extras,
    python_requires=">=2.7,!=3.0.*,!=3.1.*,!=3.2.*,!=3.3.*",
    include_package_data=True,
    zip_safe=False,
)
filename: projects/python/src/version.py
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__version__ = '0.123.5'

`

exports['Python run creates a release PR relative to a path: options'] = `

upstreamOwner: googleapis
upstreamRepo: py-test-repo
title: chore: release 0.123.5
branch: release-v0.123.5
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.123.5](https://www.github.com/googleapis/py-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release 0.123.5
logger: [object Object]
`

exports['Python run creates a release PR with custom config: changes'] = `

filename: projects/python/HISTORY.md
# Changelog

## [0.124.0](https://www.github.com/googleapis/py-test-repo/compare/google-cloud-automl-v0.123.4...google-cloud-automl-v0.124.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* still no major version

### Features

* still no major version ([c0d3c41](https://www.github.com/googleapis/py-test-repo/commit/c0d3c4181ecf6c7337a39da1755805b2))


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))

filename: projects/python/setup.cfg
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

[metadata]
name = google-crc32c
version = 0.124.0
description = A python wrapper of the C library 'Google CRC32C'
url = https://github.com/googleapis/python-crc32c
long_description = file: README.md
long_description_content_type = text/markdown
author = Google LLC
author_email = googleapis-packages@google.com

license = Apache 2.0
platforms = Posix, MacOS X, Windows
classifiers =
    Development Status :: 4 - Beta
    Intended Audience :: Developers
    License :: OSI Approved :: Apache Software License
    Operating System :: OS Independent
    Programming Language :: Python :: 3
    Programming Language :: Python :: 3.5
    Programming Language :: Python :: 3.6
    Programming Language :: Python :: 3.7
    Programming Language :: Python :: 3.8
    
[options]
zip_safe = True
python_requires = >=3.5

[options.extras_require]
testing = pytest


filename: projects/python/setup.py
# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import io
import os

import setuptools

name = "google-cloud-automl"
description = "Cloud AutoML API client library"
version = "0.124.0"
release_status = "Development Status :: 3 - Alpha"
dependencies = [
    "google-api-core[grpc] >= 1.14.0, < 2.0.0dev",
    'enum34; python_version < "3.4"',
]
extras = {
    "pandas": ["pandas>=0.24.0"],
    "storage": ["google-cloud-storage >= 1.18.0, < 2.0.0dev"],
}

package_root = os.path.abspath(os.path.dirname(__file__))

readme_filename = os.path.join(package_root, "README.rst")
with io.open(readme_filename, encoding="utf-8") as readme_file:
    readme = readme_file.read()

packages = [
    package for package in setuptools.find_packages() if package.startswith("google")
]

namespaces = ["google"]
if "google.cloud" in packages:
    namespaces.append("google.cloud")

setuptools.setup(
    name=name,
    version=version,
    description=description,
    long_description=readme,
    author="Google LLC",
    author_email="googleapis-packages@oogle.com",
    license="Apache 2.0",
    url="https://github.com/GoogleCloudPlatform/google-cloud-python",
    classifiers=[
        release_status,
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Operating System :: OS Independent",
        "Topic :: Internet",
    ],
    platforms="Posix; MacOS X; Windows",
    packages=packages,
    namespace_packages=namespaces,
    install_requires=dependencies,
    extras_require=extras,
    python_requires=">=2.7,!=3.0.*,!=3.1.*,!=3.2.*,!=3.3.*",
    include_package_data=True,
    zip_safe=False,
)
filename: projects/python/src/version.py
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__version__ = '0.124.0'

`

exports['Python run creates a release PR with custom config: options'] = `

upstreamOwner: googleapis
upstreamRepo: py-test-repo
title: chore: release google-cloud-automl 0.124.0
branch: release-google-cloud-automl-v0.124.0
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
## [0.124.0](https://www.github.com/googleapis/py-test-repo/compare/google-cloud-automl-v0.123.4...google-cloud-automl-v0.124.0) (1983-10-10)


### ⚠ BREAKING CHANGES

* still no major version

### Features

* still no major version ([c0d3c41](https://www.github.com/googleapis/py-test-repo/commit/c0d3c4181ecf6c7337a39da1755805b2))


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release google-cloud-automl 0.124.0
logger: [object Object]
`

exports['Python run creates a release PR with defaults: changes'] = `

filename: CHANGELOG.md
# Changelog

### [0.123.5](https://www.github.com/googleapis/py-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))

filename: setup.cfg
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

[metadata]
name = google-crc32c
version = 0.123.5
description = A python wrapper of the C library 'Google CRC32C'
url = https://github.com/googleapis/python-crc32c
long_description = file: README.md
long_description_content_type = text/markdown
author = Google LLC
author_email = googleapis-packages@google.com

license = Apache 2.0
platforms = Posix, MacOS X, Windows
classifiers =
    Development Status :: 4 - Beta
    Intended Audience :: Developers
    License :: OSI Approved :: Apache Software License
    Operating System :: OS Independent
    Programming Language :: Python :: 3
    Programming Language :: Python :: 3.5
    Programming Language :: Python :: 3.6
    Programming Language :: Python :: 3.7
    Programming Language :: Python :: 3.8
    
[options]
zip_safe = True
python_requires = >=3.5

[options.extras_require]
testing = pytest


filename: setup.py
# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import io
import os

import setuptools

name = "google-cloud-automl"
description = "Cloud AutoML API client library"
version = "0.123.5"
release_status = "Development Status :: 3 - Alpha"
dependencies = [
    "google-api-core[grpc] >= 1.14.0, < 2.0.0dev",
    'enum34; python_version < "3.4"',
]
extras = {
    "pandas": ["pandas>=0.24.0"],
    "storage": ["google-cloud-storage >= 1.18.0, < 2.0.0dev"],
}

package_root = os.path.abspath(os.path.dirname(__file__))

readme_filename = os.path.join(package_root, "README.rst")
with io.open(readme_filename, encoding="utf-8") as readme_file:
    readme = readme_file.read()

packages = [
    package for package in setuptools.find_packages() if package.startswith("google")
]

namespaces = ["google"]
if "google.cloud" in packages:
    namespaces.append("google.cloud")

setuptools.setup(
    name=name,
    version=version,
    description=description,
    long_description=readme,
    author="Google LLC",
    author_email="googleapis-packages@oogle.com",
    license="Apache 2.0",
    url="https://github.com/GoogleCloudPlatform/google-cloud-python",
    classifiers=[
        release_status,
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Operating System :: OS Independent",
        "Topic :: Internet",
    ],
    platforms="Posix; MacOS X; Windows",
    packages=packages,
    namespace_packages=namespaces,
    install_requires=dependencies,
    extras_require=extras,
    python_requires=">=2.7,!=3.0.*,!=3.1.*,!=3.2.*,!=3.3.*",
    include_package_data=True,
    zip_safe=False,
)
filename: pyproject.toml
[project]
name = 'project'
version = "0.123.5"

filename: project/__init__.py
__version__ = '0.123.5'

filename: src/version.py
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__version__ = '0.123.5'

`

exports['Python run creates a release PR with defaults: options'] = `

upstreamOwner: googleapis
upstreamRepo: py-test-repo
title: chore: release 0.123.5
branch: release-v0.123.5
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [0.123.5](https://www.github.com/googleapis/py-test-repo/compare/v0.123.4...v0.123.5) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/08ca01180a91c0a1ba8992b491db9212))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/845db1381b3d5d20151cad2588f85feb))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: master
force: true
fork: false
message: chore: release 0.123.5
logger: [object Object]
`
