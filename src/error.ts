import type { z } from "zod";

export type ZodFetchErrorCause = "network" | "timeout" | "validation" | "abort" | "unknown";

export interface ZodFetchErrorOptions {
    message: string;
    status?: number;
    statusText?: string;
    url?: string;
    response?: Response;
    issues?: z.ZodIssue[];
    data?: unknown;
    cause: ZodFetchErrorCause;
}

export class ZodFetchError extends Error {
    name = "ZodFetchError";
    status?: number;
    statusText?: string;
    url?: string;
    response?: Response;
    issues?: z.ZodIssue[];
    data?: unknown;
    cause: ZodFetchErrorCause;

    constructor(options: ZodFetchErrorOptions) {
        super(options.message);
        this.status = options.status;
        this.statusText = options.statusText;
        this.url = options.url;
        this.response = options.response;
        this.issues = options.issues;
        this.data = options.data;
        this.cause = options.cause;
    }
}
