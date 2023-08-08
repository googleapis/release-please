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
exports.BaseXml = void 0;
const dom = require("@xmldom/xmldom");
/**
 * Base class for all updaters working with XML files.
 */
class BaseXml {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content) {
        const document = new dom.DOMParser().parseFromString(content);
        const updated = this.updateDocument(document);
        if (updated) {
            const newContent = new dom.XMLSerializer().serializeToString(document);
            if (content.endsWith('\n') && !newContent.endsWith('\n')) {
                return `${newContent}\n`;
            }
            return newContent;
        }
        else {
            return content;
        }
    }
}
exports.BaseXml = BaseXml;
//# sourceMappingURL=base-xml.js.map