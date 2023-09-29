exports['KRM Blueprint updateContent with previousVersion updates version in multiKRMwithFn.yaml 1'] = `
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
  name: project-id1 # {"$kpt-set":"project-id"}
  namespace: projects # {"$kpt-set":"projects-namespace"}
  annotations:
    cnrm.cloud.google.com/auto-create-network: "false"
    cnrm.cloud.google.com/blueprint: cnrm/landing-zone:project/v18.0.0
spec:
  name: project-id # {"$kpt-set":"project-id"}
  billingAccountRef:
    external: "AAAAAA-BBBBBB-CCCCCC" # {"$kpt-set":"billing-account-id"}
  folderRef:
    name: name.of.folder # {"$kpt-set":"folder-name"}
    namespace: hierarchy # {"$kpt-set":"folder-namespace"}
---
apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
kind: Project
metadata:
  name: project-id2 # {"$kpt-set":"project-id"}
  namespace: projects # {"$kpt-set":"projects-namespace"}
  annotations:
    cnrm.cloud.google.com/auto-create-network: "false"
    cnrm.cloud.google.com/blueprint: cnrm/landing-zone:project/v18.0.0
    config.kubernetes.io/function: |
      container:
        image: gcr.io/foo/bar:v0.1.0
spec:
  name: project-id # {"$kpt-set":"project-id"}
  billingAccountRef:
    external: "AAAAAA-BBBBBB-CCCCCC" # {"$kpt-set":"billing-account-id"}
  folderRef:
    name: name.of.folder # {"$kpt-set":"folder-name"}
    namespace: hierarchy # {"$kpt-set":"folder-namespace"}

`

exports['KRM Blueprint updateContent with previousVersion updates version in simpleKRM.yaml 1'] = `
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
    cnrm.cloud.google.com/blueprint: cnrm/landing-zone:project/v2.1.0
spec:
  name: project-id # {"$kpt-set":"project-id"}
  billingAccountRef:
    external: "AAAAAA-BBBBBB-CCCCCC" # {"$kpt-set":"billing-account-id"}
  folderRef:
    name: name.of.folder # {"$kpt-set":"folder-name"}
    namespace: hierarchy # {"$kpt-set":"folder-namespace"}

`

exports['KRM Blueprint updateContent without previousVersion updates version in multiKRMwithFn.yaml 1'] = `
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
  name: project-id1 # {"$kpt-set":"project-id"}
  namespace: projects # {"$kpt-set":"projects-namespace"}
  annotations:
    cnrm.cloud.google.com/auto-create-network: "false"
    cnrm.cloud.google.com/blueprint: cnrm/landing-zone:project/v18.0.0
spec:
  name: project-id # {"$kpt-set":"project-id"}
  billingAccountRef:
    external: "AAAAAA-BBBBBB-CCCCCC" # {"$kpt-set":"billing-account-id"}
  folderRef:
    name: name.of.folder # {"$kpt-set":"folder-name"}
    namespace: hierarchy # {"$kpt-set":"folder-namespace"}
---
apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
kind: Project
metadata:
  name: project-id2 # {"$kpt-set":"project-id"}
  namespace: projects # {"$kpt-set":"projects-namespace"}
  annotations:
    cnrm.cloud.google.com/auto-create-network: "false"
    cnrm.cloud.google.com/blueprint: cnrm/landing-zone:project/v18.0.0
    config.kubernetes.io/function: |
      container:
        image: gcr.io/foo/bar:v0.1.0
spec:
  name: project-id # {"$kpt-set":"project-id"}
  billingAccountRef:
    external: "AAAAAA-BBBBBB-CCCCCC" # {"$kpt-set":"billing-account-id"}
  folderRef:
    name: name.of.folder # {"$kpt-set":"folder-name"}
    namespace: hierarchy # {"$kpt-set":"folder-namespace"}

`

exports['KRM Blueprint updateContent without previousVersion updates version in simpleKRM.yaml 1'] = `
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
    cnrm.cloud.google.com/blueprint: cnrm/landing-zone:project/v2.1.0
spec:
  name: project-id # {"$kpt-set":"project-id"}
  billingAccountRef:
    external: "AAAAAA-BBBBBB-CCCCCC" # {"$kpt-set":"billing-account-id"}
  folderRef:
    name: name.of.folder # {"$kpt-set":"folder-name"}
    namespace: hierarchy # {"$kpt-set":"folder-namespace"}

`
