// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Version} from '../version';

/**
 * Renders a template string with version variables.
 *
 * Supported template variables:
 * - {{version}} - Full version (e.g., "1.2.3")
 * - {{major}} - Major version (e.g., "1")
 * - {{minor}} - Minor version (e.g., "2")
 * - {{patch}} - Patch version (e.g., "3")
 * - {{prerelease}} - Prerelease suffix (e.g., "beta.1")
 * - {{component}} - Component name
 *
 * @param template - Template string with {{variable}} placeholders
 * @param version - Version object to extract values from
 * @param component - Optional component name
 * @returns Rendered template string
 */
export function renderTemplate(
  template: string,
  version: Version,
  component?: string
): string {
  return template
    .replace(/\{\{version\}\}/g, version.toString())
    .replace(/\{\{major\}\}/g, version.major.toString())
    .replace(/\{\{minor\}\}/g, version.minor.toString())
    .replace(/\{\{patch\}\}/g, version.patch.toString())
    .replace(/\{\{prerelease\}\}/g, version.preRelease || '')
    .replace(/\{\{component\}\}/g, component || '');
}
