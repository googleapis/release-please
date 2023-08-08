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
exports.GenericYaml = void 0;
const jp = require("jsonpath");
const yaml = require("js-yaml");
const logger_1 = require("../util/logger");
const DOCUMENT_SEPARATOR = '---\n';
/**
 * Updates YAML document according to given JSONPath.
 *
 * Note that used parser does reformat the document and removes all comments,
 * and converts everything to pure YAML (even JSON source).
 * If you want to retain formatting, use generic updater with comment hints.
 *
 * When applied on multi-document file, it updates all documents.
 */
class GenericYaml {
    constructor(jsonpath, version) {
        this.jsonpath = jsonpath;
        this.version = version;
    }
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        // Parse possibly multi-document file
        let docs;
        try {
            docs = yaml.loadAll(content, null, { json: true });
        }
        catch (e) {
            logger.warn('Invalid yaml, cannot be parsed', e);
            return content;
        }
        // Update each document
        let modified = false;
        docs.forEach(data => {
            const nodes = jp.apply(data, this.jsonpath, _val => {
                return this.version.toString();
            });
            if (nodes && nodes.length) {
                modified = true;
            }
        });
        // If nothing was modified, return original content
        if (!modified) {
            logger.warn(`No entries modified in ${this.jsonpath}`);
            return content;
        }
        // Stringify documents
        if (docs.length === 1) {
            // Single doc
            return yaml.dump(docs[0]);
        }
        else {
            // Multi-document, each document starts with separator
            return docs.map(data => DOCUMENT_SEPARATOR + yaml.dump(data)).join('');
        }
    }
}
exports.GenericYaml = GenericYaml;
//# sourceMappingURL=generic-yaml.js.map