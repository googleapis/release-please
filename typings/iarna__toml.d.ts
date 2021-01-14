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
