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
      const regex = new RegExp(`${pkgName} v\\d+\\.\\d+\\.\\d+`, 'g');
      // Is the dep in the go.mod file?
      const deps = regex.exec(payload);

      if (!deps) {
        logger.info(`skipping ${pkgName} (not found in go.mod)`);
        continue;
      }

      for (const dep of deps) {
        const oldVersion = dep.split(' ')[1];
        logger.info(`updating ${pkgName} from ${oldVersion} to ${pkgVersion}`);

        payload = payload.replace(dep, `${pkgName} ${pkgVersion}`);
      }
    }

    return payload;
  }
}
