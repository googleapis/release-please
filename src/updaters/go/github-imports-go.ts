import {DefaultUpdater} from '../default';

export class GithubImportsGo extends DefaultUpdater {
  updateContent(content: string): string {
    return content.replace(
      /"github\.com\/([^/]+)\/([^/]+)\/v([1-9]\d*)\/(.+)"/g,
      (_, user, repo, __, path) =>
        `"github.com/${user}/${repo}/v${this.version.major.toString()}/${path}"`
    );
  }
}
