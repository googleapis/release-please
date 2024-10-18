import {logger as defaultLogger, Logger} from '../../util/logger';
import {DefaultUpdater} from '../default';

/**
 * Updates `go.mod` files, preserving formatting and comments.
 */
export class GoMod extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    let payload = content;

    if (!this.versionsMap) {
      throw new Error('updateContent called with no versions');
    }

    for (const [pkgName, pkgVersion] of this.versionsMap) {
      // Is the dep in the go.mod file?
      const deps = payload.match(
        new RegExp(`${pkgName} v[0-9]+\.[0-9]+\.[0-9]`)
      );

      if (!deps) {
        logger.info(`skipping ${pkgName} (not found in go.mod)`);
        continue;
      }

      // Split deps[0] into the package name and version
      const dep = deps[0].split(' ');

      logger.info(`updating ${pkgName} from ${dep[1]} to ${pkgVersion}`);

      payload = payload.replace(
        new RegExp(`${pkgName} ${dep[1]}`),
        `${pkgName} ${pkgVersion}`
      );
    }

    return payload;
  }
}
