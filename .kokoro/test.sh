#!/bin/bash

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

set -xeo pipefail

export NPM_CONFIG_PREFIX=/home/node/.npm-global

cd $(dirname $0)/..

npm install
npm test

# codecov combines coverage across integration and unit tests. Include
# the logic below for any environment you wish to collect coverage for:
COVERAGE_NODE=10
if npx check-node-version@3.3.0 --silent --node $COVERAGE_NODE; then
  NYC_BIN=./node_modules/nyc/bin/nyc.js
  if [ -f "$NYC_BIN" ]; then
    $NYC_BIN report
  fi
  bash $KOKORO_GFILE_DIR/codecov.sh
else
  echo "coverage is only reported for Node $COVERAGE_NODE"
fi
