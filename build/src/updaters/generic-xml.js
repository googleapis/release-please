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
exports.GenericXml = void 0;
const base_xml_1 = require("./base-xml");
const xpath = require("xpath");
class GenericXml extends base_xml_1.BaseXml {
    constructor(xpath, version) {
        super();
        this.xpath = xpath;
        this.version = version;
    }
    updateDocument(document) {
        const version = this.version.toString();
        let updated = false;
        for (const node of xpath.select(this.xpath, document)) {
            if (node.textContent !== version) {
                node.textContent = version;
                updated = true;
            }
        }
        return updated;
    }
}
exports.GenericXml = GenericXml;
//# sourceMappingURL=generic-xml.js.map