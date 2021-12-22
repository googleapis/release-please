exports['Generic updateContent updates generic version markers 1'] = `
/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.example;

public final class Version {
  // {x-release-please-start-version}
  public static String VERSION = "2.3.4";
  // {x-release-please-end}

  // {x-release-please-start-major}
  public static String MAJOR = "2";
  // {x-release-please-end}

  // {x-release-please-start-minor}
  public static String MINOR = "3";
  // {x-release-please-end}

  // {x-release-please-start-patch}
  public static String PATCH = "4";
  // {x-release-please-end}

  public static String INLINE_VERSION = "2.3.4"; // {x-release-please-version}
  public static String INLINE_MAJOR = "2"; // {x-release-please-major}
  public static String INLINE_MINOR = "3"; // {x-release-please-minor}
  public static String INLINE_PATCH = "4"; // {x-release-please-patch}
}

`
