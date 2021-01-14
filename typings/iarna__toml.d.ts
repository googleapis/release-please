declare module '@iarna/toml/lib/toml-parser' {
  // Copied from `@iarna/toml`'s typings
  type JsonArray = boolean[] | number[] | string[] | JsonMap[] | Date[];
  type AnyJson =
    | boolean
    | number
    | string
    | JsonMap
    | Date
    | JsonArray
    | JsonArray[];

  interface JsonMap {
    [key: string]: AnyJson;
  }

  /**
   * Low-level @iarna/toml interface (documented in the README, not in the official typings)
   * Only the fields that we're using or overriding are declared here.
   */
  export class TOMLParser {
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
}
