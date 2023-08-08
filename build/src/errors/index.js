"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileNotFoundError = exports.DuplicateReleaseError = exports.AuthError = exports.GitHubAPIError = exports.MissingRequiredFileError = exports.ConfigurationError = void 0;
class ConfigurationError extends Error {
    constructor(message, releaserName, repository) {
        super(`${releaserName} (${repository}): ${message}`);
        this.releaserName = releaserName;
        this.repository = repository;
        this.name = ConfigurationError.name;
    }
}
exports.ConfigurationError = ConfigurationError;
class MissingRequiredFileError extends ConfigurationError {
    constructor(file, releaserName, repository) {
        super(`Missing required file: ${file}`, releaserName, repository);
        this.file = file;
        this.name = MissingRequiredFileError.name;
    }
}
exports.MissingRequiredFileError = MissingRequiredFileError;
class GitHubAPIError extends Error {
    constructor(requestError, message) {
        super(message !== null && message !== void 0 ? message : requestError.message);
        this.status = requestError.status;
        this.body = GitHubAPIError.parseErrorBody(requestError);
        this.name = GitHubAPIError.name;
        this.cause = requestError;
        this.stack = requestError.stack;
    }
    static parseErrorBody(requestError) {
        const body = requestError.response;
        return (body === null || body === void 0 ? void 0 : body.data) || undefined;
    }
    static parseErrors(requestError) {
        var _a;
        return ((_a = GitHubAPIError.parseErrorBody(requestError)) === null || _a === void 0 ? void 0 : _a.errors) || [];
    }
}
exports.GitHubAPIError = GitHubAPIError;
class AuthError extends GitHubAPIError {
    constructor(requestError) {
        super(requestError, 'unauthorized');
        this.status = 401;
        this.name = AuthError.name;
    }
}
exports.AuthError = AuthError;
class DuplicateReleaseError extends GitHubAPIError {
    constructor(requestError, tag) {
        super(requestError);
        this.tag = tag;
        this.name = DuplicateReleaseError.name;
    }
}
exports.DuplicateReleaseError = DuplicateReleaseError;
class FileNotFoundError extends Error {
    constructor(path) {
        super(`Failed to find file: ${path}`);
        this.path = path;
        this.name = FileNotFoundError.name;
    }
}
exports.FileNotFoundError = FileNotFoundError;
//# sourceMappingURL=index.js.map