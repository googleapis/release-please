#!/usr/bin/env node
import * as yargs from 'yargs';
interface ErrorObject {
    body?: object;
    status?: number;
    message: string;
    stack: string;
}
export declare const parser: yargs.Argv<{
    debug: boolean;
} & {
    trace: boolean;
} & {
    plugin: (string | number)[] | never[];
}>;
interface HandleError {
    (err: ErrorObject): void;
    logger?: Console;
    yargsArgs?: yargs.Arguments;
}
export declare const handleError: HandleError;
export {};
