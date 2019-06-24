#
# Copyright 2019 Google LLC. All Rights Reserved.
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

FROM node:12-alpine

LABEL version="1.0.0"
LABEL maintainer="Google Inc."
LABEL repository="https://github.com/googleapis/release-please"
LABEL homepage="https://github.com/googleapis/release-please"

LABEL "com.github.actions.name"="Release Please"
LABEL "com.github.actions.description"="Automatic releases with conventional commits."
LABEL "com.github.actions.icon"="book-open"
LABEL "com.github.actions.color"="green"

RUN npm i release-please@2.2.0 json -g
COPY entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]
