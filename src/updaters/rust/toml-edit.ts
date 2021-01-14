import {JsonMap} from '@iarna/toml';
import * as TOMLParser from '@iarna/toml/lib/toml-parser';

const taggedStringMarker = Symbol('__TAGGED_STRING');

/**
 * The type returned by `TaggedTOMLParser` instead of single-line,
 * double-quoted strings.
 */
interface TaggedString {
  /** Marker property, ensuring we don't accidentally accept something that *looks* like a `TaggedString` */
  [taggedStringMarker]: true;

  /** Byte offset of the start of the string's contents (after the initial double-quote) */
  start: number;

  /** Byte offset of the end of the string's contents (before the final double-quote) */
  end: number;

  /** Current contents of the string. May be shorter than (end-start), if the string had escape sequences */
  value: string;
}

/**
 * A custom variant of `TOMLParser` that replaces "basic strings" with a tagged
 * variant that includes their start and end positions, allowing them to be
 * replaced.
 */
class TaggedTOMLParser extends TOMLParser {
  /**
   * This is an internal parser routine, it's called whenever the *contents* of
   * a single-line, double-quoted string is being parsed.
   */
  parseBasicString() {
    // positions in `@iarna/toml` are 1-based, but we're returning 0-based positions.
    const start = this.pos - 1;
    super.parseBasicString();
    const end = this.pos - 1;

    const returned: TaggedString = {
      [taggedStringMarker]: true,
      start,
      end,
      // Cast safety: parseBasicString uses `consume()` to append to an internal
      // buffer, and `next()` stores that buffer in `this.state.returned`, this
      // is always a string.
      value: this.state.returned as string,
    };

    this.state.returned = returned;
  }
}

/**
 * Parses input as TOML with the given parser
 * @param input A string
 * @param parserType The TOML parser to use (might be custom)
 */
function parseWith(input: string, parserType: typeof TOMLParser): JsonMap {
  const parser = new parserType();
  parser.parse(input);
  return parser.finish();
}

function isTaggedString(x: unknown): x is TaggedString {
  if (!x) {
    return false;
  }

  if (typeof x !== 'object') {
    return false;
  }

  const ts = x as TaggedString;
  return ts[taggedStringMarker] === true;
}

/**
 * Given TOML input and a path to a string, attempt to replace
 * that string without modifying the formatting.
 * @param input A string that's valid TOML
 * @param path Path to a value to replace. When replacing 'deps.tokio.version', pass ['deps', 'tokio', 'version']. The value must exist and be a string.
 * @param newValue The string to replace the value at `path` with.
 */
export function replaceTomlString(
  input: string,
  path: string[],
  newValue: string
) {
  // our pointer into the object "tree", initially points to the root.
  let current = parseWith(input, TaggedTOMLParser) as Record<string, unknown>;

  // navigate down the object tree, following the path, expecting only objects.
  // Note that tagged strings (generated by `TaggedTOMLParser`) are also objects.
  for (let i = 0; i < path.length; i++) {
    const key = path[i];

    if (typeof current[key] !== 'object') {
      const msg = `path not found in object: ${path.slice(0, i + 1).join('.')}`;
      throw new Error(msg);
    }
    current = current[key] as JsonMap;
  }

  if (!isTaggedString(current)) {
    const msg = `value at path ${path.join('.')} is not a string`;
    throw new Error(msg);
  }

  const before = input.slice(0, current.start);
  const after = input.slice(current.end);
  const output = before + newValue + after;

  try {
    parseWith(output, TOMLParser);
  } catch (e) {
    throw new Error(`Could not edit toml: ${e}`);
  }

  return output;
}

module.exports = {replaceTomlString};
