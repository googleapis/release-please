// Copyright 2021 Google LLC
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

import {MissingReleaseNotesError} from '../errors';
import Handlebars = require('handlebars');

export class TemplatingError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export type PartialsMap = Map<string, Handlebars.Template>;

export interface ReleaseNotesOptions {
  notesHeader?: string;
  notesFooter?: string;
  partials?: PartialsMap;
}

/**
 * Parse release notes for a specific release from the CHANGELOG contents,
 * extending the result with the optional header and footer. Header and
 * footer templated with handlebars.js. Extra partials can be exposed to
 * the templating engine.
 *
 * @param {string} changelogContents The entire CHANGELOG contents
 * @param {string} version The release version to extract notes from
 * @param {ReleaseNotesOptions} releaseNotesOptions Optionally provide header,
 * footer and handlebars partials.
 */
export function generateReleaseNotes(
  changelogContents: string,
  version: string,
  releaseNotesOptions?: ReleaseNotesOptions
): string {
  let notes = extractReleaseNotes(changelogContents, version);

  if (
    releaseNotesOptions === undefined ||
    (releaseNotesOptions.notesHeader === undefined &&
      releaseNotesOptions.notesFooter === undefined)
  ) {
    return notes;
  }

  if (releaseNotesOptions.partials !== undefined) {
    for (const [partialName, partialValue] of releaseNotesOptions.partials) {
      Handlebars.registerPartial(partialName, partialValue);
    }
  }

  if (releaseNotesOptions.notesHeader !== undefined) {
    const notesHeader = '\n'.concat(
      releaseNotesOptions.notesHeader.replace(/\\n/g, '\n'),
      '\n'
    );

    let compiledNotesHeader;
    try {
      compiledNotesHeader = Handlebars.compile(notesHeader, {
        noEscape: true,
        strict: true,
      })({});
    } catch (e) {
      throw new TemplatingError(
        `Unable to generate release notes header: ${e.message}`
      );
    }

    notes = compiledNotesHeader.concat(notes);
  }

  if (releaseNotesOptions.notesFooter !== undefined) {
    const notesFooter = '\n'.concat(
      releaseNotesOptions.notesFooter.replace(/\\n/g, '\n'),
      '\n'
    );

    let compiledNotesFooter;
    try {
      compiledNotesFooter = Handlebars.compile(notesFooter, {
        noEscape: true,
        strict: true,
      })({});
    } catch (e) {
      throw new TemplatingError(
        `Unable to generate release notes footer: ${e.message}`
      );
    }

    notes = notes.concat(compiledNotesFooter);
  }

  return notes;
}

/**
 * Parse release notes for a specific release from the CHANGELOG contents
 *
 * @param {string} changelogContents The entire CHANGELOG contents
 * @param {string} version The release version to extract notes from
 */
export function extractReleaseNotes(
  changelogContents: string,
  version: string
): string {
  version = version.replace(/^v/, '');
  const latestRe = new RegExp(
    `## v?\\[?${version}[^\\n]*\\n(.*?)(\\n##\\s|\\n### \\[?[0-9]+\\.|($(?![\r\n])))`,
    'ms'
  );
  const match = changelogContents.match(latestRe);
  if (!match) {
    throw new MissingReleaseNotesError(changelogContents, version);
  }
  return match[1];
}
