# Copyright 2021 Google LLC
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


import synthtool.languages.node as node

node.owlbot_main(templates_excludes=[
  'README.md',
  'CONTRIBUTING.md',
  '.eslintignore',
  '.eslintrc.json',
  '.mocharc.js',
  '.prettierignore',
  '.prettierrc',
  '.nycrc',
  '.kokoro/presubmit/node10/system-test.cfg',
  '.kokoro/continuous/node10/system-test.cfg',
  '.kokoro/system-test.sh',
  '.mocharc.js',
  '.github/generated-files-bot.yml',
  '.github/release-please.yml',
  '.github/sync-repo-settings.yaml',
  '.github/workflows/ci.yaml',
])
