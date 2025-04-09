import {DefaultUpdater} from '../default';
import {RUBY_VERSION_REGEX, stringifyRubyVersion} from './common';

const RUBY_VERSION_LINE_REGEX = new RegExp(
  `(^gem "[^"]+"\\s*,\\s*"[^\\d]+)(${RUBY_VERSION_REGEX.source})(.)\\s*$`,
  'gm'
);

/**
 * Updates a versions.rb file which is expected to have a version string.
 */
export class RubyReadMeUpdater extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string): string {
    return content.replace(
      RUBY_VERSION_LINE_REGEX,
      `$1${stringifyRubyVersion(this.version)}"`
    );
  }
}
