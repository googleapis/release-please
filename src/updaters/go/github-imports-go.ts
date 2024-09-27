import {DefaultUpdater} from '../default';

export class GithubImportsGo extends DefaultUpdater {
  updateContent(content: string): string {
    if (this.version.major < 2) {
      return content;
    }

    return content.replace(
      /"github\.com\/([^/]+)\/([^/]+)(\/v([1-9]\d*))?\/(.+)"/g,
      (_, user, repo, __, ___, path) =>
        `"github.com/${user}/${repo}/v${this.version.major.toString()}/${path}"`
    );
  }
}
