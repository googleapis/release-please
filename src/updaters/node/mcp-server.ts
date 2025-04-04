import {DefaultUpdater} from '../default';
import {logger as defaultLogger, Logger} from '../../util/logger';

/**
 * This updates an MCP server's version
 */
export class McpServer extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    logger.info(`updating to ${this.version}`);
    return content.replace(/version: '.*'/, `version: '${this.version}'`);
  }
}
