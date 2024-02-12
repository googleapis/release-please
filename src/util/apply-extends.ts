import {populate} from '@topoconfig/extends';
import {type ManifestConfig, DEFAULT_RELEASE_PLEASE_CONFIG} from '../manifest';
import type {GitHub} from '../github';
import {http} from './http-api';

export const applyExtends = async (
  config: ManifestConfig,
  github: GitHub,
  branch: string
): Promise<ManifestConfig> => {
  return populate(config, {
    resolve(id: string) {
      if (id.startsWith('./')) {
        return id.slice(2);
      }

      const [_, owner, repo, _branch = branch] =
        /^([a-z0-9_-]+)\/(\.?[a-z0-9_-]+)(?:\/([a-z0-9_-]+))?$/i.exec(id) || [];
      if (_) {
        return `https://raw.githubusercontent.com/${owner}/${repo}/${_branch}/${DEFAULT_RELEASE_PLEASE_CONFIG}`;
      }

      throw new Error(`unsupported 'extends' argument: ${id}`);
    },
    async load(id, _, base) {
      if (base.startsWith('https:')) {
        return http.getJson<ManifestConfig>(`${base}/${id}`);
      }

      return github.getFileJson<ManifestConfig>(id, branch);
    },
    parse(v) {
      return v;
    },
  });
};
