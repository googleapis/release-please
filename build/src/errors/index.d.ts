import { RequestError } from '@octokit/request-error';
import { RequestError as RequestErrorBody } from '@octokit/types';
interface SingleError {
    resource: string;
    code: string;
    field: string;
}
export declare class ConfigurationError extends Error {
    releaserName: string;
    repository: string;
    constructor(message: string, releaserName: string, repository: string);
}
export declare class MissingRequiredFileError extends ConfigurationError {
    file: string;
    constructor(file: string, releaserName: string, repository: string);
}
export declare class GitHubAPIError extends Error {
    body: RequestErrorBody | undefined;
    status: number;
    cause?: Error;
    constructor(requestError: RequestError, message?: string);
    static parseErrorBody(requestError: RequestError): RequestErrorBody | undefined;
    static parseErrors(requestError: RequestError): SingleError[];
}
export declare class AuthError extends GitHubAPIError {
    constructor(requestError: RequestError);
}
export declare class DuplicateReleaseError extends GitHubAPIError {
    tag: string;
    constructor(requestError: RequestError, tag: string);
}
export declare class FileNotFoundError extends Error {
    path: string;
    constructor(path: string);
}
export {};
