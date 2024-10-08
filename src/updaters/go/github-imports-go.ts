import {DefaultUpdater} from '../default';

export class GithubImportsGo extends DefaultUpdater {
  updateContent(content: string): string {
    if (this.version.major < 2) {
      return content;
    }

    return content.replace(
      /"(https:\/\/pkg.go.dev\/)?github\.com\/([^/"\n]+)\/([^/"\n]+)(\/v([1-9]\d*))?(\/[^"\n]+)?"/g,
      (_, prefix, user, repo, ___, ____, path) =>
        `"${prefix ?? ''}github.com/${user}/${repo}${
          this.version.major < 2 ? '' : '/v' + this.version.major.toString()
        }${path ?? ''}"`
    );
  }
}
