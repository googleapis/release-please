// Copyright 2026 Google LLC
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

import {DefaultUpdater, UpdateOptions} from '../default';

/**
 * Options for ExampleVersion updater.
 */
export interface ExampleVersionOptions extends UpdateOptions {
  moduleName?: string;
  provider?: string;
}

interface ModuleBlock {
  start: number;
  end: number;
  body: string;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Updates a Terraform module's examples versions.
 */
export class ExampleVersion extends DefaultUpdater {
  readonly moduleName?: string;
  readonly provider?: string;

  constructor(options: ExampleVersionOptions) {
    super(options);
    this.moduleName = options.moduleName;
    this.provider = options.provider;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string): string {
    if (!this.moduleName || !this.provider) {
      return content;
    }

    const blocks = this.findModuleBlocks(content);
    if (blocks.length === 0) {
      return content;
    }

    const escapedModule = escapeRegExp(this.moduleName);
    const escapedProvider = escapeRegExp(this.provider);
    const sourcePattern = new RegExp(
      `^[ \\t]*source\\s*=\\s*"[^"]*/${escapedModule}/${escapedProvider}(?://[^"]*)?"`,
      'm'
    );

    let result = '';
    let lastIndex = 0;
    for (const block of blocks) {
      result += content.slice(lastIndex, block.start);
      if (sourcePattern.test(block.body)) {
        result += this.updateModuleBlock(block.body);
      } else {
        result += block.body;
      }
      lastIndex = block.end;
    }
    result += content.slice(lastIndex);
    return result;
  }

  private updateModuleBlock(body: string): string {
    let depth = 0;
    let bracketDepth = 0;
    const stringStack: (
      | {type: 'interpolation'; depth: number}
      | {type: 'string'}
    )[] = [];
    let inLineComment = false;
    let inBlockComment = false;
    let heredoc: {marker: string; indented: boolean} | null = null;
    let atLineStart = true;

    for (let i = 0; i < body.length; i++) {
      const c = body[i];

      if (inLineComment) {
        if (c === '\n') {
          inLineComment = false;
          atLineStart = true;
        }
        continue;
      }

      if (inBlockComment) {
        if (c === '*' && body[i + 1] === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }

      if (heredoc) {
        if (c === '\n') {
          let nextPos = i + 1;
          if (heredoc.indented) {
            while (
              nextPos < body.length &&
              (body[nextPos] === ' ' || body[nextPos] === '\t')
            ) {
              nextPos++;
            }
          }
          if (body.startsWith(heredoc.marker, nextPos)) {
            const afterMarker = nextPos + heredoc.marker.length;
            if (
              afterMarker >= body.length ||
              body[afterMarker] === '\n' ||
              body[afterMarker] === '\r'
            ) {
              heredoc = null;
              i = afterMarker - 1;
            }
          }
        }
        continue;
      }

      if (stringStack.length > 0) {
        const top = stringStack[stringStack.length - 1];
        if (top.type === 'string') {
          if (c === '\\') {
            i++;
          } else if ((c === '$' || c === '%') && body[i + 1] === '{') {
            stringStack.push({type: 'interpolation', depth: 1});
            i++;
          } else if (c === '"') {
            stringStack.pop();
          }
          continue;
        }
      }

      const inInterpolation =
        stringStack.length > 0 &&
        stringStack[stringStack.length - 1].type === 'interpolation';

      if (c === '#' || (c === '/' && body[i + 1] === '/')) {
        inLineComment = true;
        if (c === '/') {
          i++;
        }
        continue;
      }

      if (c === '/' && body[i + 1] === '*') {
        inBlockComment = true;
        i++;
        continue;
      }

      if (c === '<' && body[i + 1] === '<') {
        const heredocMatch = body
          .slice(i)
          .match(
            /^<<(-)?(?:'([A-Za-z0-9_]+)'|"([A-Za-z0-9_]+)"|([A-Za-z0-9_]+))/
          );
        if (heredocMatch) {
          const indented = Boolean(heredocMatch[1]);
          const marker = heredocMatch[2] || heredocMatch[3] || heredocMatch[4];
          heredoc = {marker, indented};
          i += heredocMatch[0].length - 1;
          continue;
        }
      }

      if (c === '"') {
        stringStack.push({type: 'string'});
        continue;
      }

      if (inInterpolation) {
        const top = stringStack[stringStack.length - 1] as {
          type: 'interpolation';
          depth: number;
        };
        if (c === '{') {
          top.depth++;
        } else if (c === '}') {
          top.depth--;
          if (top.depth === 0) {
            stringStack.pop();
          }
        }
        continue;
      }

      if (c === '{') {
        depth++;
        atLineStart = false;
        continue;
      }
      if (c === '}') {
        depth--;
        atLineStart = false;
        continue;
      }
      if (c === '[') {
        bracketDepth++;
        atLineStart = false;
        continue;
      }
      if (c === ']') {
        bracketDepth--;
        atLineStart = false;
        continue;
      }

      if (atLineStart && depth === 1 && bracketDepth === 0) {
        const lineRemainder = body.slice(i);
        const match = lineRemainder.match(
          /^([ \t]*version\s*=\s*)"~>\s*[\d]+\.[\d]+(?:\.[\d]+)?"/
        );
        if (match) {
          const replacement = `${match[1]}"~> ${this.version.major}.${this.version.minor}"`;
          return (
            body.slice(0, i) + replacement + body.slice(i + match[0].length)
          );
        }
      }

      if (c === '\n') {
        atLineStart = true;
      } else if (c !== ' ' && c !== '\t' && c !== '\r') {
        atLineStart = false;
      }
    }

    return body;
  }

  private findModuleBlocks(content: string): ModuleBlock[] {
    const blocks: ModuleBlock[] = [];
    let depth = 0;
    const stringStack: (
      | {type: 'interpolation'; depth: number}
      | {type: 'string'}
    )[] = [];
    let inLineComment = false;
    let inBlockComment = false;
    let heredoc: {marker: string; indented: boolean} | null = null;
    let currentBlock: {start: number} | null = null;

    for (let i = 0; i < content.length; i++) {
      const c = content[i];

      if (inLineComment) {
        if (c === '\n') {
          inLineComment = false;
        }
        continue;
      }

      if (inBlockComment) {
        if (c === '*' && content[i + 1] === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }

      if (heredoc) {
        if (c === '\n') {
          let nextPos = i + 1;
          if (heredoc.indented) {
            while (
              nextPos < content.length &&
              (content[nextPos] === ' ' || content[nextPos] === '\t')
            ) {
              nextPos++;
            }
          }
          if (content.startsWith(heredoc.marker, nextPos)) {
            const afterMarker = nextPos + heredoc.marker.length;
            if (
              afterMarker >= content.length ||
              content[afterMarker] === '\n' ||
              content[afterMarker] === '\r'
            ) {
              heredoc = null;
              i = afterMarker - 1;
            }
          }
        }
        continue;
      }

      if (stringStack.length > 0) {
        const top = stringStack[stringStack.length - 1];
        if (top.type === 'string') {
          if (c === '\\') {
            i++;
          } else if ((c === '$' || c === '%') && content[i + 1] === '{') {
            stringStack.push({type: 'interpolation', depth: 1});
            i++;
          } else if (c === '"') {
            stringStack.pop();
          }
          continue;
        }
      }

      const inInterpolation =
        stringStack.length > 0 &&
        stringStack[stringStack.length - 1].type === 'interpolation';

      if (c === '#' || (c === '/' && content[i + 1] === '/')) {
        inLineComment = true;
        if (c === '/') {
          i++;
        }
        continue;
      }

      if (c === '/' && content[i + 1] === '*') {
        inBlockComment = true;
        i++;
        continue;
      }

      if (c === '<' && content[i + 1] === '<') {
        const heredocMatch = content
          .slice(i)
          .match(
            /^<<(-)?(?:'([A-Za-z0-9_]+)'|"([A-Za-z0-9_]+)"|([A-Za-z0-9_]+))/
          );
        if (heredocMatch) {
          const indented = Boolean(heredocMatch[1]);
          const marker = heredocMatch[2] || heredocMatch[3] || heredocMatch[4];
          heredoc = {marker, indented};
          i += heredocMatch[0].length - 1;
          continue;
        }
      }

      if (c === '"') {
        stringStack.push({type: 'string'});
        continue;
      }

      if (inInterpolation) {
        const top = stringStack[stringStack.length - 1] as {
          type: 'interpolation';
          depth: number;
        };
        if (c === '{') {
          top.depth++;
        } else if (c === '}') {
          top.depth--;
          if (top.depth === 0) {
            stringStack.pop();
          }
        }
        continue;
      }

      if (depth === 0) {
        const isWordBoundary = i === 0 || /[^a-zA-Z0-9_]/.test(content[i - 1]);
        if (isWordBoundary) {
          const moduleMatch = content.slice(i).match(/^module\s+"[^"]+"\s*\{/);
          if (moduleMatch) {
            currentBlock = {start: i};
            depth = 1;
            i += moduleMatch[0].length - 1;
            continue;
          }
        }
      }

      if (c === '{') {
        depth++;
      } else if (c === '}') {
        depth--;
        if (depth === 0 && currentBlock) {
          blocks.push({
            start: currentBlock.start,
            end: i + 1,
            body: content.slice(currentBlock.start, i + 1),
          });
          currentBlock = null;
        }
      }
    }

    return blocks;
  }
}
