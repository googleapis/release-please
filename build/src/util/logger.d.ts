interface LogFn {
    <T extends object>(obj: T, msg?: string, ...args: any[]): void;
    (msg: string, ...args: any[]): void;
}
export interface Logger {
    error: LogFn;
    warn: LogFn;
    info: LogFn;
    debug: LogFn;
    trace: LogFn;
}
export declare class CheckpointLogger implements Logger {
    private includeDebug;
    private includeTrace;
    constructor(includeDebug?: boolean, includeTrace?: boolean);
    error: LogFn;
    warn: LogFn;
    info: LogFn;
    debug: LogFn;
    trace: LogFn;
}
export declare let logger: Logger;
export declare function setLogger(userLogger: Logger): void;
export {};
