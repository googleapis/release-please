exports['krm-blueprints run creates a release PR for nested-pkg: changes'] = `

filename: CHANGELOG.md
# Changelog

### [3.0.1](https://www.github.com/googleapis/blueprints/compare/v3.0.0...v3.0.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/blueprints/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/blueprints/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

filename: nested/nested-project.yaml
# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
kind: Project
metadata:
  name: project-id # {"$kpt-set":"project-id"}
  namespace: projects # {"$kpt-set":"projects-namespace"}
  annotations:
    cnrm.cloud.google.com/auto-create-network: "false"
    cnrm.cloud.google.com/blueprint: cnrm/landing-zone:project/v3.0.1
    config.kubernetes.io/function: |
      container:
        image: gcr.io/yakima-eap/folder-ref:latest
spec:
  name: project-id # {"$kpt-set":"project-id"}
  billingAccountRef:
    external: "AAAAAA-BBBBBB-CCCCCC" # {"$kpt-set":"billing-account-id"}
  folderRef:
    name: name.of.folder # {"$kpt-set":"folder-name"}
    namespace: hierarchy # {"$kpt-set":"folder-namespace"}
filename: project.yaml
# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
kind: Project
metadata:
  name: project-id # {"$kpt-set":"project-id"}
  namespace: projects # {"$kpt-set":"projects-namespace"}
  annotations:
    cnrm.cloud.google.com/auto-create-network: "false"
    cnrm.cloud.google.com/blueprint: cnrm/landing-zone:project/v3.0.1
    config.kubernetes.io/function: |
      container:
        image: gcr.io/yakima-eap/folder-ref:latest
spec:
  name: project-id # {"$kpt-set":"project-id"}
  billingAccountRef:
    external: "AAAAAA-BBBBBB-CCCCCC" # {"$kpt-set":"billing-account-id"}
  folderRef:
    name: name.of.folder # {"$kpt-set":"folder-name"}
    namespace: hierarchy # {"$kpt-set":"folder-namespace"}
`

exports['krm-blueprints run creates a release PR for nested-pkg: options'] = `

upstreamOwner: googleapis
upstreamRepo: blueprints
title: chore: release 3.0.1
branch: release-v3.0.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [3.0.1](https://www.github.com/googleapis/blueprints/compare/v3.0.0...v3.0.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/blueprints/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/blueprints/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 3.0.1
logger: [object Object]
`

exports['krm-blueprints run creates a release PR for simple-pkg: changes'] = `

filename: CHANGELOG.md
# Changelog

### [12.1.1](https://www.github.com/googleapis/blueprints/compare/v12.1.0...v12.1.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/blueprints/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/blueprints/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

filename: project.yaml
# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
kind: Project
metadata:
  name: project-id # kpt-set: \${project-id}
  namespace: projects # kpt-set: \${projects-namespace}
  annotations:
    cnrm.cloud.google.com/auto-create-network: "false"
    cnrm.cloud.google.com/blueprint: cnrm/landing-zone:project/v12.1.1
spec:
  name: project-id # kpt-set: \${project-id}
  billingAccountRef:
    external: "AAAAAA-BBBBBB-CCCCCC" # kpt-set: \${billing-account-id}
  folderRef:
    name: name.of.folder # kpt-set: \${folder-name}
    namespace: hierarchy # kpt-set: \${folder-namespace}
`

exports['krm-blueprints run creates a release PR for simple-pkg: options'] = `

upstreamOwner: googleapis
upstreamRepo: blueprints
title: chore: release 12.1.1
branch: release-v12.1.1
description: :robot: I have created a release \\*beep\\* \\*boop\\*
---
### [12.1.1](https://www.github.com/googleapis/blueprints/compare/v12.1.0...v12.1.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/blueprints/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/blueprints/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
primary: main
force: true
fork: false
message: chore: release 12.1.1
logger: [object Object]
`
