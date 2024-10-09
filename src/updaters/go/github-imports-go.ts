import {Repository} from '@google-automations/git-file-utils';
import {DefaultUpdater} from '../default';
import {Version} from '../../version';

export class GithubImportsGo extends DefaultUpdater {
  private repository: Repository;

  constructor(options: {repository: Repository; version: Version}) {
    super(options);
    this.repository = options.repository;
  }

  updateContent(content: string): string {
    if (this.version.major < 2) {
      return content;
    }

    return content.replace(
      new RegExp(
        `"(https://pkg.go.dev/)?github.com/${this.repository.owner}/${this.repository.repo}(/v([1-9]\\d*))?(/[^"\\r?\\n]+)?"`,
        'g'
      ),
      (_, prefix, __, ___, path) =>
        `"${prefix ?? ''}github.com/${this.repository.owner}/${
          this.repository.repo
        }${this.version.major < 2 ? '' : '/v' + this.version.major.toString()}${
          path ?? ''
        }"`
    );
  }
}
