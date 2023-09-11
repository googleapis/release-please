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

import {GraphqlResponseError} from '@octokit/graphql';
import {RequestError} from '@octokit/request-error';
import {RequestError as RequestErrorBody} from '@octokit/types';

interface SingleError {
  resource: string;
  code: string;
  field: string;
}

export class ConfigurationError extends Error {
  releaserName: string;
  repository: string;
  constructor(message: string, releaserName: string, repository: string) {
    super(`${releaserName} (${repository}): ${message}`);
    this.releaserName = releaserName;
    this.repository = repository;
    this.name = ConfigurationError.name;
  }
}

export class MissingRequiredFileError extends ConfigurationError {
  file: string;
  constructor(file: string, releaserName: string, repository: string) {
    super(`Missing required file: ${file}`, releaserName, repository);
    this.file = file;
    this.name = MissingRequiredFileError.name;
  }
}

export class GitHubAPIError extends Error {
  body: RequestErrorBody | undefined;
  status: number;
  cause?: Error;
  constructor(requestError: RequestError, message?: string) {
    super(message ?? requestError.message);
    this.status = requestError.status;
    this.body = GitHubAPIError.parseErrorBody(requestError);
    this.name = GitHubAPIError.name;
    this.cause = requestError;
    this.stack = requestError.stack;
  }

  static parseErrorBody(
    requestError: RequestError
  ): RequestErrorBody | undefined {
    const body = requestError.response as {data: RequestErrorBody};
    return body?.data || undefined;
  }

  static parseErrors(requestError: RequestError): SingleError[] {
    return GitHubAPIError.parseErrorBody(requestError)?.errors || [];
  }
}

export class AuthError extends GitHubAPIError {
  constructor(requestError: RequestError) {
    super(requestError, 'unauthorized');
    this.status = 401;
    this.name = AuthError.name;
  }
}

export class DuplicateReleaseError extends GitHubAPIError {
  tag: string;
  constructor(requestError: RequestError, tag: string) {
    super(requestError);
    this.tag = tag;
    this.name = DuplicateReleaseError.name;
  }
}

export class FileNotFoundError extends Error {
  path: string;
  constructor(path: string) {
    super(`Failed to find file: ${path}`);
    this.path = path;
    this.name = FileNotFoundError.name;
  }
}

/**
 * Type guard to check if an error is an Octokit RequestError.
 *
 * This function checks the structure of the error object to determine if it matches
 * the shape of a RequestError. It should be favored instead of `instanceof` checks,
 * especially in scenarios where the prototype chain might not be reliable, such as when
 * dealing with different versions of a package or when the error object might have been
 * modified.
 *
 * @param error The error object to check.
 * @returns A boolean indicating whether the error is a RequestError.
 */
export function isOctokitRequestError(error: unknown): error is RequestError {
  if (typeof error === 'object' && error !== null) {
    const e = error as RequestError;
    return (
      e.name === 'HttpError' &&
      typeof e.status === 'number' &&
      typeof e.request === 'object'
    );
  }
  return false;
}

/**
 * Type guard to check if an error is an Octokit GraphqlResponseError.
 *
 * This function checks the structure of the error object to determine if it matches
 * the shape of a GraphqlResponseError. It should be favored instead of `instanceof` checks,
 * especially in scenarios where the prototype chain might not be reliable, such as when
 * dealing with different versions of a package or when the error object might have been
 * modified.
 *
 * @param error The error object to check.
 * @returns A boolean indicating whether the error is a GraphqlResponseError.
 */
export function isOctokitGraphqlResponseError(
  error: unknown
): error is GraphqlResponseError<unknown> {
  if (typeof error === 'object' && error !== null) {
    const e = error as GraphqlResponseError<unknown>;
    return (
      typeof e.request === 'object' &&
      typeof e.headers === 'object' &&
      typeof e.response === 'object' &&
      typeof e.name === 'string' &&
      Array.isArray(e.errors) &&
      e.data !== undefined
    );
  }
  return false;
}

export class AggregateError extends Error {
  constructor(public errors: Error[], message?: string) {
    const prefix = message ?? 'AggregateError';
    super(`${prefix}: ${errors.map(err => `\n  - ${err.message}`)}`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
