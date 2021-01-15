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
      /// Value returned by parser (its result)
      returned: unknown;

      /// Internal marker used to remember the start of values,
      /// not set by `@iarna/toml` itself.
      __TAGGED_START?: number;
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
     * Parses any value (string, number, boolean, date, etc.)
     */
    parseValue(): void;

    /**
     * Specifies the next parser to be run by setting `this.state.parser`,
     * called by `goto()`, `call()`, etc.
     */
    next(fn: Function): void;

    /**
     * Called when a parser ends, returns either @value or `this.state.buf`
     * The parser we're returning "to" is popped from `this.stack`, assigned
     * to `this.state`, and `this.state.returned` is set to the returned value.
     */
    return(value: unknown): void;
  }

  export = TOMLParser;
}
