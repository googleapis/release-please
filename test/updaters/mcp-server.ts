import {readFileSync} from 'fs';
import {resolve} from 'path';
import snapshot = require('snap-shot-it');
import {describe, it} from 'mocha';
import {Version} from '../../src/version';
import {McpServer} from '../../src/updaters/node/mcp-server';

const fixturesPath = './test/updaters/fixtures';

describe('McpServer', () => {
  describe('updateContent', () => {
    it('updates the version', async () => {
      const oldContent = readFileSync(
        // it's a .txt file rather than .ts so that the linter doesn't complain
        resolve(fixturesPath, './mcp_server.txt'),
        'utf8'
      );
      const packageJson = new McpServer({
        version: Version.parse('2.36.1'),
      });
      const newContent = packageJson.updateContent(oldContent);
      snapshot(newContent.replace(/\r\n/g, '\n'));
    });
  });
});
