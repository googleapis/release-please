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

import {JsonMap} from '@iarna/toml';
import * as TOMLParser from '@iarna/toml/lib/toml-parser';

const taggedValueMarker = Symbol('__TAGGED_VALUE');

/**
 * The type for any value parsed by `TaggedTOMLParser`, including all kinds of
 * strings, numbers, dates, etc.
 */
interface TaggedValue {
  /** Type marker */
  [taggedValueMarker]: true;

  /** Byte offset of the start of the value */
  start: number;

  /** Byte offset of the end of the value */
  end: number;

  /** Current contents of the string. May be shorter than (end-start), if the string had escape sequences */
  value: unknown;
}

/**
 * A custom variant of `TOMLParser` that replaces all values with a tagged
 * variant that includes their start and end positions, allowing them to be
 * replaced.
 */
class TaggedTOMLParser extends TOMLParser {
  parseValue() {
    // Remember the start position of the value.
    //
    // Off-by-one correctness: by this point, `this.pos` points one character
    // *after* the first character of the value, which is in `this.char`
    this.state.__TAGGED_START = this.pos - 1;

    return super.parseValue();
  }

  next(fn: Function) {
    const prevState = this.state;
    super.next(fn); // `next` returns void

    // Carry over the start position. If it wasn't set, (say, if we were parsing
    // something other than a value), we're just assigning `undefined` here.
    this.state.__TAGGED_START = prevState.__TAGGED_START;
  }

  return(value: unknown) {
    const prevState = this.state;
    super.return(value); // `return` returns void

    if (prevState.__TAGGED_START && typeof this.state.returned !== 'object') {
      // If the parser we just returned from remembered a start position,
      // tag the returned value with "start" and "end".
      // Note that we don't tag objects to avoid encountering multiple tagged
      // values when replacing later on.
      const taggedValue: TaggedValue = {
        [taggedValueMarker]: true,
        start: prevState.__TAGGED_START,
        end: this.pos,
        value: this.state.returned,
      };

      this.state.returned = taggedValue;
    }
  }
}

/**
 * `@iarna/toml` implements TOML 1.0.0-rc.1, but Cargo accepts TOML 1.1 inline
 * tables: newlines, comments and a trailing comma between `{` and `}`. Blank
 * those out with spaces so the text parses as TOML 1.0.0-rc.1. The length is
 * unchanged, so value offsets still point into the original input.
 * @param input TOML text
 */
export function toToml10(input: string): string {
  const out = input.split('');
  const stack: string[] = [];
  let lastComma = -1; // index of a comma with only blanks since
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    const inInline = stack[stack.length - 1] === '{';
    if (c === '#') {
      const end = input.indexOf('\n', i);
      const stop = end === -1 ? input.length : end;
      if (inInline) {
        out.fill(' ', i, stop);
      }
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = input.startsWith(c.repeat(3), i) ? c.repeat(3) : c;
      let j = i + q.length;
      while (j < input.length && !input.startsWith(q, j)) {
        j += c === '"' && input[j] === '\\' ? 2 : 1;
      }
      i = j + q.length;
      // a multi-line string may end with up to two extra quotes
      for (let k = 0; q.length === 3 && k < 2 && input[i] === c; k++) {
        i++;
      }
      lastComma = -1;
      continue;
    }
    if (c === '{' || c === '[') {
      stack.push(c);
      lastComma = -1;
    } else if (c === '}' || c === ']') {
      if (c === '}' && lastComma !== -1) {
        out[lastComma] = ' ';
      }
      stack.pop();
      lastComma = -1;
    } else if (c === ',') {
      lastComma = inInline ? i : -1;
    } else if (c === '\n' || c === '\r') {
      if (inInline) {
        out[i] = ' ';
      }
    } else if (c !== ' ' && c !== '\t') {
      lastComma = -1;
    }
    i++;
  }
  return out.join('');
}

/**
 * Parses input as TOML with the given parser
 * @param input A string
 * @param parserType The TOML parser to use (might be custom)
 */
export function parseWith(
  input: string,
  parserType: typeof TOMLParser = TaggedTOMLParser
): JsonMap {
  const parser = new parserType();
  parser.parse(toToml10(input));
  return parser.finish();
}

function isTaggedValue(x: unknown): x is TaggedValue {
  if (!x) {
    return false;
  }

  if (typeof x !== 'object') {
    return false;
  }

  const ts = x as TaggedValue;
  return ts[taggedValueMarker] === true;
}

/**
 * Given TOML input and a path to a value, attempt to replace
 * that value without modifying the formatting.
 * @param input A string that's valid TOML
 * @param path Path to a value to replace. When replacing 'deps.tokio.version', pass ['deps', 'tokio', 'version']. The value must already exist.
 * @param newValue The value to replace the value at `path` with. Is passed through `JSON.stringify()` when replacing: strings will end up being double-quoted strings, properly escaped. Numbers will be numbers.
 */
export function replaceTomlValue(
  input: string,
  path: (string | number)[],
  newValue: string
) {
  // our pointer into the object "tree", initially points to the root.
  let current = parseWith(input, TaggedTOMLParser) as Record<string, unknown>;

  // navigate down the object tree, following the path, expecting only objects.
  // Note that tagged strings (generated by `TaggedTOMLParser`) are also objects.
  for (let i = 0; i < path.length; i++) {
    const key = path[i];

    // // We may encounter tagged values when descending through the object tree
    // if (isTaggedValue(current)) {
    //   if (!current.value || typeof current.value !== 'object') {
    //     const msg = `partial path does not lead to table: ${path
    //       .slice(0, i)
    //       .join('.')}`;
    //     throw new Error(msg);
    //   }
    //   current = current.value as Record<string, unknown>;
    // }

    const next = current[key];

    if (typeof next !== 'object') {
      const msg = `path not found in object: ${path.slice(0, i + 1).join('.')}`;
      throw new Error(msg);
    }
    current = next as JsonMap;
  }

  if (!isTaggedValue(current)) {
    const msg = `value at path ${path.join('.')} is not tagged`;
    throw new Error(msg);
  }

  const before = input.slice(0, current.start);
  const after = input.slice(current.end);
  const output = before + JSON.stringify(newValue) + after;

  try {
    parseWith(output, TOMLParser);
  } catch (e) {
    throw new Error(`After replacing value, result is not valid TOML: ${e}`);
  }

  return output;
}
