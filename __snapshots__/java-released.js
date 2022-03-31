exports['JavaReleased updateContent updates released version markers 1'] = `
/*
 * Copyright 2022 Google LLC
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
  // {x-release-please-released-start-version}
  public static String VERSION = "2.3.4";
  // {x-release-please-released-end}

  // {x-release-please-released-start-major}
  public static String MAJOR = "2";
  // {x-release-please-released-end}

  // {x-release-please-released-start-minor}
  public static String MINOR = "3";
  // {x-release-please-released-end}

  // {x-release-please-released-start-patch}
  public static String PATCH = "4";
  // {x-release-please-released-end}

  public static String INLINE_VERSION = "2.3.4"; // {x-release-please-released-version}
  public static String INLINE_MAJOR = "2"; // {x-release-please-released-major}
  public static String INLINE_MINOR = "3"; // {x-release-please-released-minor}
  public static String INLINE_PATCH = "4"; // {x-release-please-released-patch}

  // These should not change
  public static String NEXT_INLINE_VERSION = "1.2.3-SNAPSHOT"; // {x-release-please-version}
  public static String NEXT_INLINE_MAJOR = "1"; // {x-release-please-major}
  public static String NEXT_INLINE_MINOR = "2"; // {x-release-please-minor}
  public static String NEXT_INLINE_PATCH = "3"; // {x-release-please-patch}
}

`
