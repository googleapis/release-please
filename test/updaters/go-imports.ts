import {readFileSync} from 'fs';
import {resolve} from 'path';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {Version} from '../../src/version';
import {GithubImportsGo} from '../../src/updaters/go/github-imports-go';

const fixturesPath = './test/updaters/fixtures';

describe('GithubImportsGo', () => {
  const v2File = readFileSync(
    resolve(fixturesPath, 'file-with-imports-v2.go'),
    'utf8'
  );

  const v3File = readFileSync(
    resolve(fixturesPath, 'file-with-imports-v3.go'),
    'utf8'
  );

  it('makes no changes if the new version has a major version of 2', async () => {
    const readmeUpdater = new GithubImportsGo({
      version: Version.parse('2.0.0'),
    });
    expect(readmeUpdater.updateContent(v2File)).to.equal(v2File);
  });

  it('updates the version in the imports if the new version has a major version of 3', async () => {
    const readmeUpdater = new GithubImportsGo({
      version: Version.parse('3.0.0'),
    });
    expect(readmeUpdater.updateContent(v2File)).to.equal(v3File);
  });
});
