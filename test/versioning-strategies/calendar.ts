// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {describe, it} from 'mocha';

import {expect} from 'chai';
import {
  CalendarVersioningStrategy,
  CalendarVersion,
} from '../../src/versioning-strategies/calendar';
import {Version} from '../../src/version';

describe('CalendarVersioningStrategy', () => {
  const fixCommits = [
    {
      sha: 'sha1',
      message: 'fix: some bugfix',
      files: ['path1/file1.txt'],
      type: 'fix',
      scope: null,
      bareMessage: 'some bugfix',
      notes: [],
      references: [],
      breaking: false,
    },
  ];

  const featureCommits = [
    {
      sha: 'sha1',
      message: 'feat: some feature',
      files: ['path1/file1.txt'],
      type: 'feat',
      scope: null,
      bareMessage: 'some feature',
      notes: [],
      references: [],
      breaking: false,
    },
  ];

  const breakingCommits = [
    {
      sha: 'sha1',
      message: 'feat!: breaking change',
      files: ['path1/file1.txt'],
      type: 'feat',
      scope: null,
      bareMessage: 'breaking change',
      notes: [{title: 'BREAKING CHANGE', text: 'breaking change'}],
      references: [],
      breaking: true,
    },
  ];

  describe('date segments', () => {
    describe('YYYY - Full year', () => {
      it('formats full year correctly', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.0D',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 10, 15)));
        const oldVersion = new CalendarVersion(
          2023,
          11,
          1,
          undefined,
          undefined,
          '2023.11.01'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.11.15');
      });
    });

    describe('YY - Short year (no padding)', () => {
      it('formats short year without padding', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.MM.DD',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 5)));
        const oldVersion = Version.parse('23.12.1');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('24.1.5');
      });

      it('handles year > 99 (relative to 2000)', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.MM.DD',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2106, 4, 15)));
        const oldVersion = Version.parse('24.1.1');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('106.5.15');
      });
    });

    describe('0Y - Zero-padded year', () => {
      it('formats zero-padded year', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: '0Y.0M.0D',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2006, 0, 5)));
        const oldVersion = new CalendarVersion(
          5,
          12,
          1,
          undefined,
          undefined,
          '05.12.01'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('06.01.05');
      });
    });

    describe('MM - Short month (no padding)', () => {
      it('formats month without padding', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MM.DD',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 5)));
        const oldVersion = Version.parse('2023.12.1');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.1.5');
      });
    });

    describe('0M - Zero-padded month', () => {
      it('formats zero-padded month', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.DD',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 5)));
        const oldVersion = new CalendarVersion(
          2024,
          1,
          2,
          undefined,
          undefined,
          '2024.01.2'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.01.5');
      });
    });

    describe('WW - Short week', () => {
      it('formats week of year without padding', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.WW.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 7, 15)));
        const oldVersion = Version.parse('2024.4.0');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.33.0');
      });

      it('formats first week of year', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.WW.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 3)));
        const oldVersion = Version.parse('2023.52.0');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.1.0');
      });

      it('January 1 is always in week 1', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.WW.MICRO',
        });
        // 2025-01-01 is a Wednesday
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 1)));
        const oldVersion = Version.parse('2024.52.0');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2025.1.0');
      });

      it('week changes on Monday', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.WW.MICRO',
        });
        // 2025-01-05 is Sunday (still week 1)
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 5)));
        let oldVersion = Version.parse('2024.52.0');
        let newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2025.1.0');

        // 2025-01-06 is Monday (week 2 starts)
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 6)));
        oldVersion = Version.parse('2025.1.0');
        newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2025.2.0');
      });

      it('handles year where Jan 1 is Monday', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.WW.MICRO',
        });
        // 2024-01-01 is a Monday
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
        const oldVersion = Version.parse('2023.52.0');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.1.0');

        // 2024-01-07 is Sunday (still week 1)
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 7)));
        const oldVersion2 = Version.parse('2024.1.0');
        const newVersion2 = await strategy.bump(oldVersion2, fixCommits);
        expect(newVersion2.toString()).to.equal('2024.1.1');

        // 2024-01-08 is Monday (week 2)
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 8)));
        const oldVersion3 = Version.parse('2024.1.0');
        const newVersion3 = await strategy.bump(oldVersion3, fixCommits);
        expect(newVersion3.toString()).to.equal('2024.2.0');
      });
    });

    describe('0W - Zero-padded week', () => {
      it('formats zero-padded week for single digit', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0W.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 3)));
        const oldVersion = Version.parse('2023.52.0');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.01.0');
      });

      it('formats zero-padded week for double digit', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0W.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 7, 15)));
        const oldVersion = new CalendarVersion(
          2024,
          1,
          0,
          undefined,
          undefined,
          '2024.01.0'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.33.0');
      });
    });

    describe('DD - Short day (no padding)', () => {
      it('formats day without padding', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MM.DD',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 5)));
        const oldVersion = Version.parse('2023.12.31');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.1.5');
      });
    });

    describe('0D - Zero-padded day', () => {
      it('formats zero-padded day', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MM.0D',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 5)));
        const oldVersion = new CalendarVersion(
          2023,
          1,
          1,
          undefined,
          undefined,
          '2023.1.01'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.1.05');
      });
    });
  });

  describe('semantic segments', () => {
    describe('MAJOR - based on breaking changes', () => {
      it('resets MAJOR to 0 on breaking change when date changes', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MAJOR.MINOR',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 1)));
        const oldVersion = Version.parse('2024.2.5');
        const newVersion = await strategy.bump(oldVersion, breakingCommits);
        expect(newVersion.toString()).to.equal('2025.0.0');
      });

      it('bumps MAJOR on breaking change when date is same', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MAJOR.MINOR',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
        const oldVersion = Version.parse('2024.2.5');
        const newVersion = await strategy.bump(oldVersion, breakingCommits);
        expect(newVersion.toString()).to.equal('2024.3.0');
      });

      it('bumps MINOR for breaking change when no MAJOR in format', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
        const oldVersion = Version.parse('2024.2.5');
        const newVersion = await strategy.bump(oldVersion, breakingCommits);
        expect(newVersion.toString()).to.equal('2024.3.0');
      });
    });

    describe('MINOR - based on features', () => {
      it('resets MINOR to 0 on feature when date changes', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 1)));
        const oldVersion = Version.parse('2024.2.5');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('2025.0.0');
      });

      it('bumps MINOR on feature when date is same', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
        const oldVersion = Version.parse('2024.2.5');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('2024.3.0');
      });
    });

    describe('MICRO - based on fixes', () => {
      it('resets MICRO to 0 on fix when date changes', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 1)));
        const oldVersion = Version.parse('2024.2.5');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2025.0.0');
      });

      it('bumps MICRO on fix when date is same', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
        const oldVersion = Version.parse('2024.2.5');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.2.6');
      });
    });
  });

  describe('real-world CalVer schemes', () => {
    describe('YY.0M', () => {
      it('resets MICRO to 0 on new month release', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.0M.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 2, 1)));
        const oldVersion = Version.parse('23.10.0');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('24.03.0');
      });
    });

    describe('YYYY.0M.0D', () => {
      it('bumps to new date', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.0D',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 10, 15)));
        const oldVersion = new CalendarVersion(
          2024,
          11,
          1,
          undefined,
          undefined,
          '2024.11.01'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.11.15');
      });
    });

    describe('YY.MINOR.MICRO', () => {
      it('bumps MINOR on feature in same year', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = Version.parse('24.1.0');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('24.2.0');
      });

      it('resets MINOR to 0 on year change', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 1)));
        const oldVersion = Version.parse('23.5.3');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('25.0.0');
      });

      it('bumps MICRO on fix in same year', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = Version.parse('24.1.2');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('24.1.3');
      });
    });

    describe('YYYY.MINOR.MICRO', () => {
      it('bumps MINOR on feature', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = Version.parse('2024.1.5');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('2024.2.0');
      });

      it('resets MINOR to 0 on year change', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 1)));
        const oldVersion = Version.parse('2024.3.5');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('2025.0.0');
      });
    });

    describe('YY.MM.MICRO', () => {
      it('bumps MICRO when same month', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.MM.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = Version.parse('24.6.0');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('24.6.1');
      });

      it('resets MICRO to 0 when month changes', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.MM.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 6, 1)));
        const oldVersion = Version.parse('24.6.5');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('24.7.0');
      });
    });
  });

  describe('release-as support', () => {
    it('honors release-as note', async () => {
      const commits = [
        {
          sha: 'sha1',
          message: 'feat: some feature',
          files: ['path1/file1.txt'],
          type: 'feat',
          scope: null,
          bareMessage: 'some feature',
          notes: [{title: 'RELEASE AS', text: '2024.99.0'}],
          references: [],
          breaking: false,
        },
      ];
      const strategy = new CalendarVersioningStrategy({
        dateFormat: 'YYYY.MINOR.MICRO',
      });
      strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
      const oldVersion = Version.parse('2024.1.0');
      const newVersion = await strategy.bump(oldVersion, commits);
      expect(newVersion.toString()).to.equal('2024.99.0');
    });

    it('takes newest release-as when multiple exist', async () => {
      const commits = [
        {
          sha: 'sha1',
          message: 'feat: some feature',
          files: ['path1/file1.txt'],
          type: 'feat',
          scope: null,
          bareMessage: 'some feature',
          notes: [{title: 'RELEASE AS', text: '2024.99.0'}],
          references: [],
          breaking: false,
        },
        {
          sha: 'sha2',
          message: 'fix: some fix',
          files: ['path1/file1.txt'],
          type: 'fix',
          scope: null,
          bareMessage: 'some fix',
          notes: [{title: 'RELEASE AS', text: '2024.50.0'}],
          references: [],
          breaking: false,
        },
      ];
      const strategy = new CalendarVersioningStrategy({
        dateFormat: 'YYYY.MINOR.MICRO',
      });
      strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
      const oldVersion = Version.parse('2024.1.0');
      const newVersion = await strategy.bump(oldVersion, commits);
      expect(newVersion.toString()).to.equal('2024.99.0');
    });
  });

  describe('determineReleaseType', () => {
    it('returns a VersionUpdater', async () => {
      const strategy = new CalendarVersioningStrategy({
        dateFormat: 'YYYY.MINOR.MICRO',
      });
      strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
      const oldVersion = Version.parse('2024.1.0');
      const updater = strategy.determineReleaseType(oldVersion, fixCommits);
      const newVersion = updater.bump(oldVersion);
      expect(newVersion.toString()).to.equal('2024.1.1');
    });
  });

  describe('error handling for older date versions', () => {
    it('throws error when current date is older than version date', async () => {
      const strategy = new CalendarVersioningStrategy({
        dateFormat: 'YYYY.0M.0D',
      });
      strategy.setCurrentDate(new Date(Date.UTC(2023, 5, 15)));
      const futureVersion = new CalendarVersion(
        2024,
        6,
        15,
        undefined,
        undefined,
        '2024.06.15'
      );
      try {
        await strategy.bump(futureVersion, fixCommits);
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Cannot bump version');
        expect((error as Error).message).to.include(
          'version date is newer than the current date'
        );
      }
    });

    it('throws error when year is older', async () => {
      const strategy = new CalendarVersioningStrategy({
        dateFormat: 'YYYY.MINOR.MICRO',
      });
      strategy.setCurrentDate(new Date(Date.UTC(2023, 0, 1)));
      const futureVersion = Version.parse('2024.5.3');
      try {
        await strategy.bump(futureVersion, fixCommits);
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Cannot bump version');
      }
    });
  });

  describe('error handling for invalid version strings', () => {
    it('throws error when version has fewer segments than format requires', async () => {
      const strategy = new CalendarVersioningStrategy({
        dateFormat: 'YYYY.0M.0D.MICRO',
      });
      strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
      const wrongSegmentsVersion = Version.parse('2024.6.15');
      try {
        await strategy.bump(wrongSegmentsVersion, fixCommits);
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to parse version');
        expect((error as Error).message).to.include('YYYY.0M.0D.MICRO');
      }
    });

    it('throws error in CalendarVersionUpdate.bump for mismatched version', () => {
      const strategy = new CalendarVersioningStrategy({
        dateFormat: 'YYYY.0M.0D.MICRO',
      });
      strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
      const validVersion = new CalendarVersion(
        2024,
        1,
        15,
        undefined,
        undefined,
        '2024.01.15.0'
      );
      const versionUpdater = strategy.determineReleaseType(
        validVersion,
        fixCommits
      );

      const mismatchedVersion = Version.parse('2024.1.0');
      try {
        versionUpdater.bump(mismatchedVersion);
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to parse version');
        expect((error as Error).message).to.include('2024.1.0');
      }
    });
  });

  describe('edge cases', () => {
    describe('multiple date segments changing', () => {
      it('resets MICRO to 0 when year changes', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 15)));
        const oldVersion = Version.parse('2024.12.5');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2025.01.0');
      });

      it('resets MICRO to 0 when only month changes', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 1, 15)));
        const oldVersion = new CalendarVersion(
          2024,
          1,
          5,
          undefined,
          undefined,
          '2024.01.5'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.02.0');
      });
    });

    describe('first release of new period', () => {
      it('resets MINOR to 0 for feature in new year', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 1)));
        const oldVersion = Version.parse('2024.10.5');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('2025.0.0');
      });

      it('resets MAJOR to 0 for breaking change in new year', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MAJOR.MINOR',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 1)));
        const oldVersion = Version.parse('2024.5.3');
        const newVersion = await strategy.bump(oldVersion, breakingCommits);
        expect(newVersion.toString()).to.equal('2025.0.0');
      });
    });

    describe('same date multiple releases', () => {
      it('increments MICRO for multiple fixes on same day', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = new CalendarVersion(
          2024,
          6,
          3,
          undefined,
          undefined,
          '2024.06.3'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.06.4');
      });

      it('increments MINOR for multiple features on same day', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 0, 1)));
        const oldVersion = Version.parse('2024.3.0');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('2024.4.0');
      });
    });

    describe('leap year handling', () => {
      it('handles February 29 in leap year', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.0D',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 1, 29)));
        const oldVersion = new CalendarVersion(
          2024,
          2,
          28,
          undefined,
          undefined,
          '2024.02.28'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2024.02.29');
      });
    });

    describe('end of year transitions', () => {
      it('handles December 31 to January 1', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.0D',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 1)));
        const oldVersion = Version.parse('2024.12.31');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2025.01.01');
      });

      it('handles last week of year to first week', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0W.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2025, 0, 3)));
        const oldVersion = Version.parse('2024.52.5');
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('2025.01.0');
      });
    });

    describe('zero-padding preservation', () => {
      it('preserves zero-padding for single digit values', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: '0Y.0M.0D',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2009, 0, 5)));
        const oldVersion = new CalendarVersion(
          8,
          12,
          31,
          undefined,
          undefined,
          '08.12.31'
        );
        const newVersion = await strategy.bump(oldVersion, fixCommits);
        expect(newVersion.toString()).to.equal('09.01.05');
      });
    });

    describe('mixing date and semantic segments', () => {
      it('handles YY.MM.MINOR.MICRO style (four segments)', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.MM.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = new CalendarVersion(
          24,
          6,
          5,
          undefined,
          undefined,
          '24.6.5.123'
        );
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('24.6.6.0');
      });

      it('resets semantic to 0 when any date part changes', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YY.MM.MINOR',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 6, 1)));
        const oldVersion = Version.parse('24.6.5');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('24.7.0');
      });
    });

    describe('missing semantic placeholders', () => {
      it('bumps MINOR for breaking change when no MAJOR placeholder exists', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MINOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = Version.parse('2024.2.5');
        const newVersion = await strategy.bump(oldVersion, breakingCommits);
        expect(newVersion.toString()).to.equal('2024.3.0');
      });

      it('bumps MICRO for breaking change when no MAJOR or MINOR placeholder exists', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = new CalendarVersion(
          2024,
          6,
          5,
          undefined,
          undefined,
          '2024.06.5'
        );
        const newVersion = await strategy.bump(oldVersion, breakingCommits);
        expect(newVersion.toString()).to.equal('2024.06.6');
      });

      it('bumps MICRO for feature when no MINOR placeholder exists', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.MAJOR.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = Version.parse('2024.1.5');
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('2024.1.6');
      });

      it('bumps MICRO for feature when no MAJOR or MINOR placeholder exists', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.MICRO',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = new CalendarVersion(
          2024,
          6,
          5,
          undefined,
          undefined,
          '2024.06.5'
        );
        const newVersion = await strategy.bump(oldVersion, featureCommits);
        expect(newVersion.toString()).to.equal('2024.06.6');
      });

      it('updates only date when no semantic placeholders exist', async () => {
        const strategy = new CalendarVersioningStrategy({
          dateFormat: 'YYYY.0M.0D',
        });
        strategy.setCurrentDate(new Date(Date.UTC(2024, 5, 15)));
        const oldVersion = new CalendarVersion(
          2024,
          6,
          14,
          undefined,
          undefined,
          '2024.06.14'
        );
        const newVersion = await strategy.bump(oldVersion, breakingCommits);
        expect(newVersion.toString()).to.equal('2024.06.15');
      });
    });
  });
});
