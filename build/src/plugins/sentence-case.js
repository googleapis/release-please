"use strict";
// Copyright 2022 Google LLC
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentenceCase = void 0;
const plugin_1 = require("../plugin");
// A list of words that should not be converted to uppercase:
const SPECIAL_WORDS = ['gRPC', 'npm'];
/**
 * This plugin converts commit messages to sentence case, for the benefit
 * of the generated CHANGELOG.
 */
class SentenceCase extends plugin_1.ManifestPlugin {
    constructor(github, targetBranch, repositoryConfig, specialWords) {
        super(github, targetBranch, repositoryConfig);
        this.specialWords = new Set(specialWords ? [...specialWords] : SPECIAL_WORDS);
    }
    /**
     * Perform post-processing on commits, e.g, sentence casing them.
     * @param {Commit[]} commits The set of commits that will feed into release pull request.
     * @returns {Commit[]} The modified commit objects.
     */
    processCommits(commits) {
        this.logger.info(`SentenceCase processing ${commits.length} commits`);
        for (const commit of commits) {
            // The parsed conventional commit message, without the type:
            console.info(commit.bareMessage);
            commit.bareMessage = this.toUpperCase(commit.bareMessage);
            // Check whether commit is in conventional commit format, if it is
            // we'll split the string by type and description:
            if (commit.message.includes(':')) {
                const splitMessage = commit.message.split(':');
                let prefix = splitMessage[0];
                prefix += ': ';
                let suffix = splitMessage.slice(1).join(':').trim();
                // Extract the first word from the rest of the string:
                const match = /\s|$/.exec(suffix);
                if (match) {
                    const endFirstWord = match.index;
                    const firstWord = suffix.slice(0, endFirstWord);
                    suffix = suffix.slice(endFirstWord);
                    // Put the string back together again:
                    commit.message = `${prefix}${this.toUpperCase(firstWord)}${suffix}`;
                }
            }
        }
        return commits;
    }
    /*
     * Convert a string to upper case, taking into account a dictionary of
     * common lowercase words, e.g., gRPC, npm.
     *
     * @param {string} word The original word.
     * @returns {string} The word, now upper case.
     */
    toUpperCase(word) {
        if (this.specialWords.has(word)) {
            return word;
        }
        if (word.match(/^[a-z]/)) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
        else {
            return word;
        }
    }
}
exports.SentenceCase = SentenceCase;
//# sourceMappingURL=sentence-case.js.map