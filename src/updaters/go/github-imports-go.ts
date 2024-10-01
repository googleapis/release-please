import {DefaultUpdater} from '../default';

export class GithubImportsGo extends DefaultUpdater {
  updateContent(content: string): string {
    if (this.version.major < 2) {
      return content;
    }

    return content.replace(
      /"(https:\/\/pkg.go.dev\/)?github\.com\/([^/]+)\/([^/]+)(\/v([1-9]\d*))?(\/[^"]+)?"/g,
      (_, prefix, user, repo, ___, ____, path) =>
        `"${prefix ?? ''}github.com/${user}/${repo}${
          this.version.major < 2 ? '' : '/v' + this.version.major.toString()
        }${path ?? ''}"`
    );
  }
}
