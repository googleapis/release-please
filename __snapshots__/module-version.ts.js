exports['versions.tf updateContent updates version in versions.tf 1'] = `
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
    module_name = "foo/bar/baz/v2.1.0"
  }

  provider_meta "google-beta" {
    module_name = "foo/bar/baz/v2.1.0"
  }
}

`
