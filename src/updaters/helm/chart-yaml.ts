import {checkpoint, CheckpointType} from '../../util/checkpoint';
import {Update, UpdateOptions, VersionsMap} from '../update';
import {GitHubFileContents} from '../../github';
import * as yaml from 'yaml';

export class ChartYaml implements Update {
  path: string;
  changelogEntry: string;
  version: string;
  versions?: VersionsMap;
  packageName: string;
  create: boolean;
  contents?: GitHubFileContents;

  constructor(options: UpdateOptions) {
    this.create = false;
    this.path = options.path;
    this.changelogEntry = options.changelogEntry;
    this.version = options.version;
    this.packageName = options.packageName;
  }

  updateContent(content: string): string {
    const parsed = yaml.parse(content);
    checkpoint(
      `updating ${this.path} from ${parsed.version} to ${this.version}`,
      CheckpointType.Success
    );
    parsed.version = this.version;
    return yaml.stringify(parsed) + '\n';
  }
}
