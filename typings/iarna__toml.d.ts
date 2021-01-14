// Copyright 2021 Google LLC
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

declare module '@iarna/toml/lib/toml-parser' {
  import {JsonMap} from '@iarna/toml';

  namespace TOMLParser {
    // This is necessary, or TS will consider this to be a "non-module entity"
  }

  /**
   * Low-level @iarna/toml interface (documented in the README, not in the official typings)
   * Only the fields that we're using or overriding are declared here.
   */
  class TOMLParser {
    pos: number;
    state: {
      returned: unknown;
    };

    constructor();

    ///////////////////////////////
    // Public API
    ///////////////////////////////

    /**
     * Parses a chunk of input
     */
    parse(chunk: string): void;

    /**
     * Finish parsing, returns the parsed object
     */
    finish(): JsonMap;

    ///////////////////////////////
    // Internal parser methods
    ///////////////////////////////

    /**
     * Parses a single-line, double-quoted string
     */
    parseBasicString(): void;
  }

  export = TOMLParser;
}
