export interface GoWorkspace {
  members?: string[];
}

export function parseGoWorkspace(content: string): GoWorkspace {
  // Read the file, split on newlines, and filter out empty lines
  const lines = content.split('\n').filter((line) => line !== '');
  const members = lines.map((line) => line.trim());
  return { members };
}
