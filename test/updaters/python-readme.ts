import {readFileSync} from 'fs';
import {resolve} from 'path';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {Version} from '../../src/version';
import {PythonReadme} from '../../src/updaters/python/python-readme';

const fixturesPath = './test/updaters/fixtures';

describe('PythonReadme', () => {
  const withPreFlag = readFileSync(
    resolve(fixturesPath, 'README-python-pre.md'),
    'utf8'
  );

  const withoutPreFlag = readFileSync(
    resolve(fixturesPath, 'README-python-no-pre.md'),
    'utf8'
  );

  it('makes no changes if there is a --pre on the install instructions in a README for a prerelease version', async () => {
    const readmeUpdater = new PythonReadme({
      version: Version.parse('0.6.0-alpha.1'),
    });
    expect(readmeUpdater.updateContent(withPreFlag)).to.equal(withPreFlag);
  });

  it('makes no changes if there is no --pre on the install instructions in a README for a non-prerelease version', async () => {
    const readmeUpdater = new PythonReadme({
      version: Version.parse('0.6.0'),
    });
    expect(readmeUpdater.updateContent(withoutPreFlag)).to.equal(
      withoutPreFlag
    );
  });

  it('adds --pre if there is no --pre on the install instructions in a README for a prerelease version', async () => {
    const readmeUpdater = new PythonReadme({
      version: Version.parse('0.6.0-alpha.1'),
    });
    expect(readmeUpdater.updateContent(withoutPreFlag)).to.equal(withPreFlag);
  });

  it('removes --pre if there is a --pre on the install instructions in a README for a non-prerelease version', async () => {
    const readmeUpdater = new PythonReadme({
      version: Version.parse('0.6.0'),
    });
    expect(readmeUpdater.updateContent(withPreFlag)).to.equal(withoutPreFlag);
  });
});
