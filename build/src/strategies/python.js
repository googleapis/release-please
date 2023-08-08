"use strict";
// Copyright 2019 Google LLC
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
exports.Python = void 0;
const base_1 = require("./base");
const changelog_1 = require("../updaters/changelog");
const changelog_json_1 = require("../updaters/changelog-json");
const version_1 = require("../version");
const setup_cfg_1 = require("../updaters/python/setup-cfg");
const setup_py_1 = require("../updaters/python/setup-py");
const pyproject_toml_1 = require("../updaters/python/pyproject-toml");
const python_file_with_version_1 = require("../updaters/python/python-file-with-version");
const errors_1 = require("../errors");
const filter_commits_1 = require("../util/filter-commits");
const CHANGELOG_SECTIONS = [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance Improvements' },
    { type: 'deps', section: 'Dependencies' },
    { type: 'revert', section: 'Reverts' },
    { type: 'docs', section: 'Documentation' },
    { type: 'style', section: 'Styles', hidden: true },
    { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
    { type: 'refactor', section: 'Code Refactoring', hidden: true },
    { type: 'test', section: 'Tests', hidden: true },
    { type: 'build', section: 'Build System', hidden: true },
    { type: 'ci', section: 'Continuous Integration', hidden: true },
];
class Python extends base_1.BaseStrategy {
    constructor(options) {
        var _a;
        options.changelogSections = (_a = options.changelogSections) !== null && _a !== void 0 ? _a : CHANGELOG_SECTIONS;
        super(options);
    }
    async buildUpdates(options) {
        var _a;
        const updates = [];
        const version = options.newVersion;
        updates.push({
            path: this.addPath(this.changelogPath),
            createIfMissing: true,
            updater: new changelog_1.Changelog({
                version,
                changelogEntry: options.changelogEntry,
            }),
        });
        updates.push({
            path: this.addPath('setup.cfg'),
            createIfMissing: false,
            updater: new setup_cfg_1.SetupCfg({
                version,
            }),
        });
        updates.push({
            path: this.addPath('setup.py'),
            createIfMissing: false,
            updater: new setup_py_1.SetupPy({
                version,
            }),
        });
        const parsedPyProject = await this.getPyProject(this.addPath('pyproject.toml'));
        const pyProject = (parsedPyProject === null || parsedPyProject === void 0 ? void 0 : parsedPyProject.project) || ((_a = parsedPyProject === null || parsedPyProject === void 0 ? void 0 : parsedPyProject.tool) === null || _a === void 0 ? void 0 : _a.poetry);
        let projectName = this.component;
        if (pyProject) {
            updates.push({
                path: this.addPath('pyproject.toml'),
                createIfMissing: false,
                updater: new pyproject_toml_1.PyProjectToml({
                    version,
                }),
            });
            projectName = pyProject.name;
        }
        else {
            this.logger.warn(parsedPyProject
                ? 'invalid pyproject.toml'
                : `file ${this.addPath('pyproject.toml')} did not exist`);
        }
        if (!projectName) {
            this.logger.warn('No project/component found.');
        }
        else {
            [projectName, projectName.replace(/-/g, '_')]
                .flatMap(packageName => [
                `${packageName}/__init__.py`,
                `src/${packageName}/__init__.py`,
            ])
                .forEach(packagePath => updates.push({
                path: this.addPath(packagePath),
                createIfMissing: false,
                updater: new python_file_with_version_1.PythonFileWithVersion({ version }),
            }));
        }
        // There should be only one version.py, but foreach in case that is incorrect
        const versionPyFilesSearch = this.github.findFilesByFilenameAndRef('version.py', this.targetBranch, this.path);
        const versionPyFiles = await versionPyFilesSearch;
        versionPyFiles.forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new python_file_with_version_1.PythonFileWithVersion({
                    version,
                }),
            });
        });
        // If a machine readable changelog.json exists update it:
        const artifactName = projectName !== null && projectName !== void 0 ? projectName : (await this.getNameFromSetupPy());
        if (options.commits && artifactName) {
            const commits = (0, filter_commits_1.filterCommits)(options.commits, this.changelogSections);
            updates.push({
                path: 'changelog.json',
                createIfMissing: false,
                updater: new changelog_json_1.ChangelogJson({
                    artifactName,
                    version,
                    commits,
                    language: 'PYTHON',
                }),
            });
        }
        return updates;
    }
    async getPyProject(path) {
        try {
            const content = await this.github.getFileContentsOnBranch(path, this.targetBranch);
            return (0, pyproject_toml_1.parsePyProject)(content.parsedContent);
        }
        catch (e) {
            return null;
        }
    }
    async getNameFromSetupPy() {
        var _a;
        const ARTIFACT_NAME_REGEX = /name *= *['"](?<name>.*)['"](\r|\n|$)/;
        const setupPyContents = await this.getSetupPyContents();
        if (setupPyContents) {
            const match = setupPyContents.match(ARTIFACT_NAME_REGEX);
            if (match && ((_a = match === null || match === void 0 ? void 0 : match.groups) === null || _a === void 0 ? void 0 : _a.name)) {
                return match.groups.name;
            }
        }
        return null;
    }
    async getSetupPyContents() {
        try {
            return (await this.github.getFileContentsOnBranch(this.addPath('setup.py'), this.targetBranch)).parsedContent;
        }
        catch (e) {
            if (e instanceof errors_1.FileNotFoundError) {
                return null;
            }
            else {
                throw e;
            }
        }
    }
    initialReleaseVersion() {
        return version_1.Version.parse('0.1.0');
    }
}
exports.Python = Python;
//# sourceMappingURL=python.js.map