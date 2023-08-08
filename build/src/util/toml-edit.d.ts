import { JsonMap } from '@iarna/toml';
import * as TOMLParser from '@iarna/toml/lib/toml-parser';
/**
 * Parses input as TOML with the given parser
 * @param input A string
 * @param parserType The TOML parser to use (might be custom)
 */
export declare function parseWith(input: string, parserType?: typeof TOMLParser): JsonMap;
/**
 * Given TOML input and a path to a value, attempt to replace
 * that value without modifying the formatting.
 * @param input A string that's valid TOML
 * @param path Path to a value to replace. When replacing 'deps.tokio.version', pass ['deps', 'tokio', 'version']. The value must already exist.
 * @param newValue The value to replace the value at `path` with. Is passed through `JSON.stringify()` when replacing: strings will end up being double-quoted strings, properly escaped. Numbers will be numbers.
 */
export declare function replaceTomlValue(input: string, path: (string | number)[], newValue: string): string;
