import {DefaultUpdater} from '../default';

export class GoModUpdater extends DefaultUpdater {
  updateContent(content: string): string {
    if (this.version.major < 2) {
      return content;
    }

    return content.replace(
      /module github\.com\/([^/"\r?\n]+)\/([^/"\r?\n]+)(\/v([1-9]\d*))?/g,
      (_, user, repo) =>
        `module github.com/${user}/${repo}${
          this.version.major < 2 ? '' : '/v' + this.version.major.toString()
        }`
    );
  }
}
