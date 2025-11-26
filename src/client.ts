import type { z } from "zod";
import { zFetch, type ZodFetchOptions } from "./core";

export interface ZodFetchClientConfig extends Omit<ZodFetchOptions<unknown>, "url" | "schema" | "method"> {
    baseURL?: string;
}

export type ZodFetchClient = {
    get: <T>(url: string, schema: z.ZodType<T>, options?: Omit<ZodFetchOptions<T>, "url" | "schema" | "method">) => Promise<T>;
    post: <T>(url: string, schema: z.ZodType<T>, options?: Omit<ZodFetchOptions<T>, "url" | "schema" | "method">) => Promise<T>;
    put: <T>(url: string, schema: z.ZodType<T>, options?: Omit<ZodFetchOptions<T>, "url" | "schema" | "method">) => Promise<T>;
    patch: <T>(url: string, schema: z.ZodType<T>, options?: Omit<ZodFetchOptions<T>, "url" | "schema" | "method">) => Promise<T>;
    delete: <T>(url: string, schema: z.ZodType<T>, options?: Omit<ZodFetchOptions<T>, "url" | "schema" | "method">) => Promise<T>;
    fetch: <T>(options: ZodFetchOptions<T>) => Promise<T>;
};

export function createZodFetchClient(config: ZodFetchClientConfig = {}): ZodFetchClient {
    const { baseURL, ...baseOptions } = config;

    const resolveUrl = (url: string | URL) => {
        if (url instanceof URL) return url.toString();
        if (baseURL && !url.startsWith("http")) {
            // Handle slash consistency
            const base = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
            const path = url.startsWith("/") ? url.slice(1) : url;
            return `${base}${path}`;
        }
        return url;
    };

    const mergeOptions = <T>(options: Omit<ZodFetchOptions<T>, "url" | "schema"> = {}): Omit<ZodFetchOptions<T>, "url" | "schema"> => {
        const { headers: baseHeaders, ...restBase } = baseOptions;
        const { headers: optHeaders, ...restOpt } = options;

        // Merge headers
        const headers = new Headers(baseHeaders);
        if (optHeaders) {
            const h = new Headers(optHeaders);
            h.forEach((v, k) => headers.set(k, v));
        }

        return {
            ...restBase,
            ...restOpt,
            headers,
        };
    };

    return {
        get: (url, schema, options) =>
            zFetch({ url: resolveUrl(url), schema, method: "GET", ...mergeOptions(options) }),
        post: (url, schema, options) =>
            zFetch({ url: resolveUrl(url), schema, method: "POST", ...mergeOptions(options) }),
        put: (url, schema, options) =>
            zFetch({ url: resolveUrl(url), schema, method: "PUT", ...mergeOptions(options) }),
        patch: (url, schema, options) =>
            zFetch({ url: resolveUrl(url), schema, method: "PATCH", ...mergeOptions(options) }),
        delete: (url, schema, options) =>
            zFetch({ url: resolveUrl(url), schema, method: "DELETE", ...mergeOptions(options) }),
        fetch: (options) =>
            zFetch({ ...options, url: resolveUrl(options.url), ...mergeOptions(options) }),
    };
}
