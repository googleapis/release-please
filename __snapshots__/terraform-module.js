exports['terraform-module run creates a release PR for module-no-versions: changes'] = `

filename: CHANGELOG.md
# Changelog

### [2.1.1](https://www.github.com/googleapis/terraform-test-repo/compare/v2.1.0...v2.1.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/terraform-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/terraform-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

filename: module-no-versions/README.MD
# Terraform Module

## Usage

\`\`\`hcl
module "vpc" {
    source  = "terraform-google-modules/mine/google"
    version = "~> 2.1"
}
\`\`\`

`

exports['terraform-module run creates a release PR for module-no-versions: options'] = `

upstreamOwner: googleapis
upstreamRepo: terraform-test-repo
title: chore: release 2.1.1
branch: release-v2.1.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [2.1.1](https://www.github.com/googleapis/terraform-test-repo/compare/v2.1.0...v2.1.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/terraform-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/terraform-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 2.1.1
`

exports['terraform-module run creates a release PR for module-submodule: changes'] = `

filename: CHANGELOG.md
# Changelog

### [2.1.1](https://www.github.com/googleapis/terraform-test-repo/compare/v2.1.0...v2.1.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/terraform-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/terraform-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

filename: README.md
# Terraform Module

## Usage

\`\`\`hcl
module "vpc" {
    source  = "terraform-google-modules/mine/google"
    version = "~> 2.1"
}
\`\`\`

filename: modules/sub-module-with-version/readme.md
# Terraform Module

## Usage

\`\`\`hcl
module "vpc" {
    source  = "terraform-google-modules/mine/google"
    version = "~> 2.1"
}
\`\`\`

filename: modules/sub-module-missing-versions/README.md
# Terraform Module

## Usage

\`\`\`hcl
module "vpc" {
    source  = "terraform-google-modules/mine/google"
    version = "~> 2.1"
}
\`\`\`

filename: versions.tf
/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

terraform {
  required_version = ">=0.13, <0.14"

  required_providers {
    google = ">= 3.44.0, <4.0.0"
  }

  provider_meta "google" {
    module_name = "foo/bar/main/v2.1.1"
  }

  provider_meta "google-beta" {
    module_name = "foo/bar/main/v2.1.1"
  }
}

filename: modules/sub-module-with-version/versions.tf
/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

terraform {
  required_version = ">=0.13, <0.14"

  required_providers {
    google = ">= 3.44.0, <4.0.0"
  }

  provider_meta "google" {
    module_name = "foo/bar/submodule/v2.1.1"
  }

  provider_meta "google-beta" {
    module_name = "foo/bar/submodule/v2.1.1"
  }
}

`

exports['terraform-module run creates a release PR for module-submodule: options'] = `

upstreamOwner: googleapis
upstreamRepo: terraform-test-repo
title: chore: release 2.1.1
branch: release-v2.1.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [2.1.1](https://www.github.com/googleapis/terraform-test-repo/compare/v2.1.0...v2.1.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/terraform-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/terraform-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 2.1.1
`

exports['terraform-module run creates a release PR for simple-module: changes'] = `

filename: CHANGELOG.md
# Changelog

### [12.1.1](https://www.github.com/googleapis/terraform-test-repo/compare/v12.1.0...v12.1.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/terraform-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/terraform-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

filename: readme.md
# Terraform Module

## Usage

\`\`\`hcl
module "vpc" {
    source  = "terraform-google-modules/mine/google"
    version = "~> 12.1"
}
\`\`\`

filename: versions.tf
/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

terraform {
  required_version = ">=0.13, <0.14"

  required_providers {
    google = ">= 3.44.0, <4.0.0"
  }

  provider_meta "google" {
    module_name = "foo/bar/baz/v12.1.1"
  }

  provider_meta "google-beta" {
    module_name = "foo/bar/baz/v12.1.1"
  }
}

filename: versions.tf.tmpl
/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

{% if test %}
terraform {
  required_version = ">=0.13, <0.14"

  required_providers {
    google = ">= 3.44.0, <4.0.0"
  }

  provider_meta "google" {
    module_name = "foo/bar/baz/v12.1.1"
  }

  provider_meta "google-beta" {
    module_name = "foo/bar/baz/v12.1.1"
  }
}
{% endif %}
`

exports['terraform-module run creates a release PR for simple-module: options'] = `

upstreamOwner: googleapis
upstreamRepo: terraform-test-repo
title: chore: release 12.1.1
branch: release-v12.1.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [12.1.1](https://www.github.com/googleapis/terraform-test-repo/compare/v12.1.0...v12.1.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/terraform-test-repo/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/terraform-test-repo/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 12.1.1
`
