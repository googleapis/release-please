import * as path from 'path';

export interface GoWorkspace {
  members?: string[];
}

// Example go.work file
/*
go 1.23.1

// Ignore comments

use (
  ./packages/goA
  ./packages/goB
  ./packages/goC
  ./packages/goD
)

use ./packages/goE

*/
export function parseGoWorkspace(content: string): GoWorkspace {
  const lines = content.split('\n')
    .filter(line => line !== '')
    .filter(line => !line.startsWith('//'));

  const members: string[] = [];

  let inCommentBlock = false;
  let inUseBlock = false;
  for (const line of lines) {
    if (line.startsWith('/*')) {
      inCommentBlock = true;
    }
    if (line.endsWith('*/')) {
      inCommentBlock = false;
      continue;
    }
    if (inCommentBlock) {
      continue;
    }
    if (line.startsWith('use (')) {
      inUseBlock = true;
      continue;
    }
    if (inUseBlock && line === ')') {
      inUseBlock = false;
      continue;
    }
    if (inUseBlock || line.startsWith('use ')) {
      const rawPath = line.replace('use ', '').trim();
      const normalizedPath = path.normalize(rawPath);
      members.push(normalizedPath);
    }
  }

  return { members };
}
