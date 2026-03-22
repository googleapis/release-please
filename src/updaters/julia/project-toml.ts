import * as TOML from '@iarna/toml';
import {replaceTomlValue} from '../../util/toml-edit';
import {DefaultUpdater} from '../default';

export interface JuliaProject {
  name?: string;
  version?: string;
}

export function parseProjectToml(content: string): JuliaProject {
  const parsed = TOML.parse(content) as Record<string, unknown>;
  return {
    name: typeof parsed.name === 'string' ? parsed.name : undefined,
    version: typeof parsed.version === 'string' ? parsed.version : undefined,
  };
}

/**
 * Updates Julia `Project.toml` manifests while preserving formatting/comments.
 */
export class ProjectToml extends DefaultUpdater {
  updateContent(content: string): string {
    const parsed = parseProjectToml(content);
    if (!parsed.version) {
      throw new Error('Project.toml does not contain a version field');
    }
    return replaceTomlValue(content, ['version'], this.version.toString());
  }
}
